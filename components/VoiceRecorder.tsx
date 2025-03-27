import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import Voice from '@react-native-voice/voice';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface VoiceRecorderProps {
  onTextUpdate?: (text: string) => void;
  onError?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTextUpdate, onError }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  
  // Initialize Voice on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeVoice = async () => {
      try {
        const available = await Voice.isAvailable();
        if (isMounted) {
          // Convert to boolean to avoid type issues
          setIsVoiceAvailable(!!available);
          if (!available) {
            setError('Voice recognition is not available on this device');
          }
        }
      } catch (e) {
        console.error('Failed to check Voice availability:', e);
        if (isMounted) {
          setError('Could not initialize speech recognition');
        }
      }
    };
    
    initializeVoice();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Set up Voice listeners
  useEffect(() => {
    function setupVoiceListeners() {
      Voice.onSpeechStart = () => setIsListening(true);
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechResults = (e) => {
        if (e.value && e.value.length > 0) {
          setRecognizedText(e.value[0]);
          if (onTextUpdate) {
            onTextUpdate(e.value[0]);
          }
        }
      };
      Voice.onSpeechPartialResults = (e) => {
        if (e.value) {
          setPartialResults(e.value);
        }
      };
      Voice.onSpeechError = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        setError('Recognition error');
      };
    }

    setupVoiceListeners();
    
    // Cleanup function
    return () => {
      try {
        Voice.removeAllListeners();
        if (recording) {
          recording.stopAndUnloadAsync();
        }
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    };
  }, [onTextUpdate]);

  const startRecording = async () => {
    try {
      setError('');
      
      if (!isVoiceAvailable) {
        setError('Speech recognition is not available');
        if (onError) onError();
        return;
      }
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission denied');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start voice recognition with the proper language
      try {
        // Use a language that's definitely supported
        const languageOption = Platform.OS === 'ios' ? 'en-US' : 'en-US';
        await Voice.start(languageOption);
      } catch (voiceErr) {
        console.error('Voice.start error:', voiceErr);
        setError(`Speech recognition error: ${voiceErr instanceof Error ? voiceErr.message : String(voiceErr)}`);
        
        // Stop recording if voice recognition fails
        if (newRecording) {
          await newRecording.stopAndUnloadAsync();
          setRecording(null);
          setIsRecording(false);
        }
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not start recording');
      if (onError) onError();
      
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (stopErr) {
          console.error('Error stopping recording:', stopErr);
        }
        setRecording(null);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Stop voice recognition
      try {
        await Voice.stop();
      } catch (e) {
        console.error('Error stopping Voice:', e);
      }
      
      // Stop recording
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      
      setIsRecording(false);
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.textContainer}>
        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : recognizedText ? (
          <ThemedText style={styles.recognizedText}>{recognizedText}</ThemedText>
        ) : isListening ? (
          <View>
            <ThemedText style={styles.listeningText}>
              {partialResults.length > 0 ? partialResults[0] : 'Listening...'}
            </ThemedText>
            <ActivityIndicator style={styles.activityIndicator} />
          </View>
        ) : (
          <ThemedText style={styles.placeholderText}>
            {isVoiceAvailable 
              ? 'Press the microphone to start speaking' 
              : 'Speech recognition is not available on this device'}
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.recordButton, 
          isRecording && styles.recordingButton,
          !isVoiceAvailable && styles.disabledButton
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={!isVoiceAvailable}
      >
        <FontAwesome
          name={isRecording ? "stop-circle" : "microphone"}
          size={24}
          color="white"
        />
      </TouchableOpacity>
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
  listeningText: {
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
  disabledButton: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
  },
  activityIndicator: {
    marginTop: 10,
  },
}); 