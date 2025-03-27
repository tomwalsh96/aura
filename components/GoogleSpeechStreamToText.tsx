import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { GOOGLE_CLOUD_API_KEY, GOOGLE_SPEECH_STREAM_API_ENDPOINT as GOOGLE_SPEECH_API_ENDPOINT, STREAM_INTERVAL_MS } from '../app/config';

interface GoogleSpeechStreamToTextProps {
  onTextUpdate?: (text: string) => void;
}

export const GoogleSpeechStreamToText: React.FC<GoogleSpeechStreamToTextProps> = ({ onTextUpdate }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [partialText, setPartialText] = useState('');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [streamCount, setStreamCount] = useState(0);
  
  const recordingStartTimeRef = useRef<number | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogMessages(prev => [logMessage, ...prev].slice(0, 15)); // Keep last 15 messages
  };

  // Clean up on unmount
  useEffect(() => {
    addLog('Component mounted');
    return () => {
      addLog('Component unmounting, cleaning up resources');
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(err => {
          console.error('Error stopping recording during cleanup:', err);
        });
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      addLog('Starting streaming recording...');
      setError('');
      setIsProcessing(true);
      setRecognizedText('');
      setPartialText('');
      setStreamCount(0);

      // Request permissions
      addLog('Requesting microphone permissions');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission denied');
        addLog('❌ Microphone permission denied');
        setIsProcessing(false);
        return;
      }
      addLog('✅ Microphone permission granted');

      // Configure audio
      addLog('Configuring audio settings for streaming');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });
      addLog('✅ Audio configured successfully');

      // Start recording with settings optimized for speech recognition
      addLog('Initializing recording with speech recognition settings');
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      addLog('✅ Recording started successfully');

      setRecording(newRecording);
      setIsRecording(true);
      setIsProcessing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Set start time
      recordingStartTimeRef.current = Date.now();
      addLog(`Recording start time: ${new Date().toLocaleTimeString()}`);
      
      // Start streaming interval
      addLog(`Setting up streaming interval every ${STREAM_INTERVAL_MS}ms`);
      streamIntervalRef.current = setInterval(async () => {
        try {
          if (!isRecording || !recording) {
            addLog('Recording stopped or recording object is null, skipping stream processing');
            return;
          }
          
          // Get current audio and process it without stopping the recording
          addLog(`Beginning stream segment processing #${streamCount + 1}`);
          setStreamCount(prev => prev + 1);
          await processStreamSegment(newRecording);
        } catch (err) {
          console.error('Error in stream interval:', err);
          addLog(`❌ Stream interval error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }, STREAM_INTERVAL_MS);
      addLog('✅ Streaming interval set up successfully');
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      addLog(`❌ Error starting recording: ${err instanceof Error ? err.message : String(err)}`);
      setError('Could not start recording');
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    try {
      addLog('Stopping streaming recording...');
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Clear streaming interval
      if (streamIntervalRef.current) {
        addLog('Clearing streaming interval');
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }

      if (!recording) {
        addLog('❌ No active recording to stop');
        setIsProcessing(false);
        return;
      }

      // Stop recording
      addLog('Stopping and unloading recording');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      // Reset audio mode
      addLog('Resetting audio mode');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
      addLog('✅ Audio mode reset successfully');

      // Process the final recording
      if (uri) {
        addLog('Processing final recording segment');
        await processAudioWithGoogleAPI(uri, true);
      } else {
        addLog('❌ No URI available for final recording');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      addLog(`❌ Error stopping recording: ${err instanceof Error ? err.message : String(err)}`);
      setError('Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const processStreamSegment = async (currentRecording: Audio.Recording) => {
    try {
      addLog('Processing stream segment');
      // Create a status object which includes the URI of the recording
      const status = await currentRecording.getStatusAsync();
      if (!status.canRecord) {
        addLog('Recording is not active, skipping processing');
        return;
      }
      
      addLog(`Recording duration: ${status.durationMillis}ms`);
      
      // On iOS, we create a copy of the current recording
      if (Platform.OS === 'ios') {
        addLog('iOS platform detected, creating temporary copy of recording');
        // Create a temporary file for the copy
        const tempUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.wav`;
        
        // Get the URI of the current recording
        const recordingUri = currentRecording.getURI();
        if (!recordingUri) {
          addLog('❌ No recording URI available');
          return;
        }
        
        // Copy the current recording to the temp file
        addLog(`Copying recording from ${recordingUri} to ${tempUri}`);
        await FileSystem.copyAsync({
          from: recordingUri,
          to: tempUri
        });
        
        // Process the copy
        addLog('Processing temporary copy');
        await processAudioWithGoogleAPI(tempUri, false);
        
        // Delete the temp file
        addLog('Cleaning up temporary file');
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } else {
        // On Android, we can directly get the URI
        addLog('Android platform detected, using direct URI');
        const uri = currentRecording.getURI();
        if (uri) {
          await processAudioWithGoogleAPI(uri, false);
        } else {
          addLog('❌ No recording URI available on Android');
        }
      }
    } catch (err) {
      console.error('Error processing stream segment:', err);
      addLog(`❌ Error processing stream segment: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const processAudioWithGoogleAPI = async (audioUri: string, isFinal: boolean) => {
    try {
      addLog(`Processing audio${isFinal ? ' (FINAL)' : ' (INTERIM)'} with Google API`);
      
      // Check file size and existence
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (fileInfo.exists) {
        const size = fileInfo.size || 0;
        addLog(`Audio file size: ${size} bytes`);
        if (size > 10000000) { // 10MB limit for direct API call
          addLog('❌ Audio file too large (>10MB)');
          setError('Audio file too large for direct API processing');
          setIsProcessing(false);
          return;
        }
        if (size < 100) {
          addLog('⚠️ Audio file suspiciously small, might be empty');
        }
      } else {
        addLog('❌ Audio file does not exist');
        setError('Audio file does not exist');
        setIsProcessing(false);
        return;
      }
      
      // Read the audio file as base64
      addLog('Reading audio file as base64');
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      addLog(`✅ Base64 audio length: ${base64Audio.length} chars`);
      
      // Validate base64 data
      if (base64Audio.length < 100) {
        addLog('⚠️ Base64 data suspiciously small, might be corrupted');
      }

      // Prepare request to Google Cloud Speech-to-Text API
      addLog('Preparing API request');
      const data = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'default',
          enableAutomaticPunctuation: true,
          // Use streaming options for better real-time performance
          enableWordTimeOffsets: false,
          useEnhanced: true,
          // For partial results when streaming
          interimResults: !isFinal,
        },
        audio: {
          content: base64Audio,
        },
      };
      
      // Log request details
      addLog(`API URL: ${GOOGLE_SPEECH_API_ENDPOINT}?key=${GOOGLE_CLOUD_API_KEY.substring(0, 5)}...`);
      addLog(`Google API request config: ${JSON.stringify(data.config)}`);

      // Send request to Google Cloud Speech-to-Text API
      addLog(`Sending ${isFinal ? 'final' : 'interim'} request to Google API`);
      const response = await fetch(`${GOOGLE_SPEECH_API_ENDPOINT}?key=${GOOGLE_CLOUD_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      addLog(`API Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        addLog(`❌ API error response: ${JSON.stringify(errorData)}`);
        throw new Error(`Google API error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      addLog(`✅ API result received with ${result.results?.length || 0} result(s)`);
      
      // Process the speech recognition result
      if (
        result.results &&
        result.results.length > 0 &&
        result.results[0].alternatives &&
        result.results[0].alternatives.length > 0
      ) {
        const transcript = result.results[0].alternatives[0].transcript;
        addLog(`Transcript: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
        
        if (isFinal) {
          // For the final result, combine any partial text with the final transcript
          const finalText = recognizedText + (partialText ? ' ' + partialText : '') + 
                           (recognizedText || partialText ? ' ' : '') + transcript;
          addLog(`Setting final recognized text: "${finalText.substring(0, 50)}${finalText.length > 50 ? '...' : ''}"`);
          setRecognizedText(finalText);
          setPartialText('');
          
          if (onTextUpdate) {
            onTextUpdate(finalText);
          }
        } else {
          // For partial results, just update the partial text
          addLog(`Setting partial text: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
          setPartialText(transcript);
          
          // Also update the UI with current recognized + partial
          const currentText = recognizedText + (recognizedText ? ' ' : '') + transcript;
          if (onTextUpdate) {
            onTextUpdate(currentText);
          }
        }
      } else if (isFinal && partialText) {
        // If it's the final call and we have partial text but no new transcript,
        // add the partial text to the recognized text
        const finalText = recognizedText + (recognizedText ? ' ' : '') + partialText;
        addLog(`No results in final API call. Using partial text for final: "${finalText.substring(0, 50)}${finalText.length > 50 ? '...' : ''}"`);
        setRecognizedText(finalText);
        setPartialText('');
        
        if (onTextUpdate) {
          onTextUpdate(finalText);
        }
      } else {
        addLog('❌ No transcript found in API response');
        if (isFinal) {
          setError('No speech detected in the recording');
        }
      }
    } catch (err) {
      console.error('Error processing audio with Google API:', err);
      addLog(`❌ Error processing audio: ${err instanceof Error ? err.message : String(err)}`);
      if (isFinal) {
        setError('Error processing speech: ' + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      if (isFinal) {
        setIsProcessing(false);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.textContainer}>
        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : isProcessing && !isRecording ? (
          <View>
            <ThemedText style={styles.processingText}>Processing speech...</ThemedText>
            <ActivityIndicator style={styles.activityIndicator} />
          </View>
        ) : recognizedText || partialText ? (
          <ThemedText style={styles.recognizedText}>
            {recognizedText}
            {recognizedText && partialText ? ' ' : ''}
            {partialText && <ThemedText style={styles.partialText}>{partialText}</ThemedText>}
          </ThemedText>
        ) : (
          <ThemedText style={styles.placeholderText}>
            Press the microphone to start speaking. Your speech will stream to Google's API.
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.recordButton, 
          isRecording && styles.recordingButton,
          isProcessing && styles.processingButton
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing && !isRecording}
      >
        {isProcessing && !isRecording ? (
          <ActivityIndicator color="white" />
        ) : (
          <FontAwesome
            name={isRecording ? "stop-circle" : "microphone"}
            size={24}
            color="white"
          />
        )}
      </TouchableOpacity>
      
      {isRecording && (
        <ThemedText style={styles.streamingIndicator}>
          Streaming to Google... ({streamCount} segments sent)
        </ThemedText>
      )}
      
      {/* Logs display in development mode */}
      {__DEV__ && (
        <ScrollView style={styles.logContainer}>
          <ThemedText style={styles.logTitle}>Debug Logs:</ThemedText>
          {logMessages.map((msg, i) => (
            <ThemedText key={i} style={styles.logMessage}>{msg}</ThemedText>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    minHeight: 150,
    width: '100%',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
  },
  recognizedText: {
    fontSize: 18,
    textAlign: 'center',
  },
  partialText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  processingText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#EA4335',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  recordingButton: {
    backgroundColor: '#EA4335',
  },
  processingButton: {
    backgroundColor: '#9E9E9E',
  },
  activityIndicator: {
    marginTop: 10,
  },
  streamingIndicator: {
    marginTop: 10,
    fontSize: 12,
    color: '#EA4335',
    fontStyle: 'italic',
  },
  // Debug log styles
  logContainer: {
    marginTop: 20,
    padding: 10,
    maxHeight: 150,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 5,
  },
  logTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 12,
  },
  logMessage: {
    fontSize: 10,
    marginBottom: 2,
  },
}); 