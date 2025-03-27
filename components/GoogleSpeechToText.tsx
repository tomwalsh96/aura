import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { GOOGLE_CLOUD_API_KEY, GOOGLE_SPEECH_API_ENDPOINT } from '../app/config';

// Helper function to log and show alerts in development
const logAndShow = (message: string, obj?: any) => {
  let fullMessage = message;
  if (obj) {
    fullMessage += ': ' + (typeof obj === 'object' ? JSON.stringify(obj) : String(obj));
  }
  console.log(fullMessage);
  
  // Show alert in development
  if (__DEV__) {
    Alert.alert('Debug Info', fullMessage);
  }
};

interface GoogleSpeechToTextProps {
  onTextUpdate?: (text: string) => void;
}

export const GoogleSpeechToText: React.FC<GoogleSpeechToTextProps> = ({ onTextUpdate }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Add log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogMessages(prev => [logMessage, ...prev].slice(0, 10)); // Keep last 10 messages
  };

  const startRecording = async () => {
    try {
      addLog('Starting recording...');
      setError('');
      setIsProcessing(true);

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
      addLog('Configuring audio settings');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });
      addLog('✅ Audio configured successfully');

      // Start recording with 16kHz sample rate, mono, 16-bit per sample
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
    } catch (err) {
      console.error('Failed to start recording:', err);
      addLog(`❌ Error starting recording: ${err instanceof Error ? err.message : String(err)}`);
      setError('Could not start recording');
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    try {
      addLog('Stopping recording...');
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

      if (!uri) {
        addLog('❌ Failed to get recording URI');
        setError('Failed to get recording URI');
        setIsProcessing(false);
        return;
      }
      addLog(`✅ Recording saved at: ${uri}`);

      // Reset audio mode
      addLog('Resetting audio mode');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
      addLog('✅ Audio mode reset successfully');

      // Process the recording with Google Speech-to-Text
      addLog('Sending recording to Google Speech-to-Text API');
      await processAudioWithGoogleAPI(uri);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      addLog(`❌ Error stopping recording: ${err instanceof Error ? err.message : String(err)}`);
      setError('Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const processAudioWithGoogleAPI = async (audioUri: string) => {
    try {
      addLog('Processing audio with Google API');
      
      // Check file size
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

      // Prepare request to Google Cloud Speech-to-Text API
      addLog('Preparing API request');
      const data = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'default',
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: base64Audio,
        },
      };

      // Log request URL and first 50 chars of audio content
      addLog(`API URL: ${GOOGLE_SPEECH_API_ENDPOINT}?key=${GOOGLE_CLOUD_API_KEY.substring(0, 5)}...`);
      addLog(`Audio content preview: ${base64Audio.substring(0, 50)}...`);
      
      // Log full request data without the audio content
      const logData = { ...data };
      logData.audio = { content: `[${base64Audio.length} chars]` };
      addLog(`Request data: ${JSON.stringify(logData)}`);

      // Send request to Google Cloud Speech-to-Text API
      addLog('Sending request to Google API');
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
      addLog(`API result received: ${JSON.stringify(result)}`);
      
      // Process the speech recognition result
      if (
        result.results &&
        result.results.length > 0 &&
        result.results[0].alternatives &&
        result.results[0].alternatives.length > 0
      ) {
        const transcript = result.results[0].alternatives[0].transcript;
        addLog(`✅ Transcript: "${transcript}"`);
        setRecognizedText(transcript);
        if (onTextUpdate) {
          onTextUpdate(transcript);
        }
      } else {
        addLog('❌ No speech detected in the result');
        setError('No speech detected');
      }
    } catch (err) {
      console.error('Error processing audio with Google API:', err);
      addLog(`❌ Error processing audio: ${err instanceof Error ? err.message : String(err)}`);
      setError('Error processing speech: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
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
        ) : recognizedText ? (
          <ThemedText style={styles.recognizedText}>{recognizedText}</ThemedText>
        ) : (
          <ThemedText style={styles.placeholderText}>
            Press the microphone to start speaking
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
        disabled={isProcessing}
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
      
      {/* Log display for debugging */}
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