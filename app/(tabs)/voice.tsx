import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { WebSpeechRecognition } from '@/components/WebSpeechRecognition';
import { GoogleSpeechToText } from '@/components/GoogleSpeechToText';
import { GoogleSpeechStreamToText } from '@/components/GoogleSpeechStreamToText';
import Voice from '@react-native-voice/voice';
import { FontAwesome } from '@expo/vector-icons';

// Define speech recognition methods
type RecognitionMethod = 'native' | 'web' | 'google' | 'google-stream';

export default function VoiceScreen() {
  const [transcription, setTranscription] = useState('');
  const [recognitionMethod, setRecognitionMethod] = useState<RecognitionMethod>('native');
  const [checkedVoiceAvailability, setCheckedVoiceAvailability] = useState(false);
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);

  // Check if the native Voice API is available
  useEffect(() => {
    const checkVoiceAvailability = async () => {
      try {
        const isAvailable = await Voice.isAvailable();
        if (!isAvailable) {
          console.log('Native Voice API not available, using web fallback');
          setRecognitionMethod('web');
        }
        setCheckedVoiceAvailability(true);
      } catch (error) {
        console.error('Error checking Voice availability:', error);
        setRecognitionMethod('web');
        setCheckedVoiceAvailability(true);
      }
    };
    
    checkVoiceAvailability();
  }, []);

  const handleTextUpdate = (text: string) => {
    setTranscription(text);
  };

  const handleVoiceError = () => {
    Alert.alert(
      "Speech Recognition Error",
      "Would you like to try an alternative speech recognition method?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Try Web Speech", 
          onPress: () => setRecognitionMethod('web')
        },
        { 
          text: "Try Google API", 
          onPress: () => setRecognitionMethod('google')
        }
      ]
    );
  };

  const saveTranscription = () => {
    if (transcription.trim()) {
      setTranscriptionHistory([transcription, ...transcriptionHistory]);
      setTranscription('');
    }
  };

  const clearHistory = () => {
    setTranscriptionHistory([]);
  };

  // Wait until we've checked Voice availability
  if (!checkedVoiceAvailability) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading speech recognition...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>
            Speech to Text
          </ThemedText>
          
          <ThemedText style={styles.description}>
            Tap the microphone and start speaking. Your speech will be converted to text in real-time.
          </ThemedText>
          
          <View style={styles.methodSelector}>
            <TouchableOpacity 
              style={[styles.methodButton, recognitionMethod === 'native' && styles.selectedMethod]}
              onPress={() => setRecognitionMethod('native')}
            >
              <FontAwesome name="microphone" size={14} color={recognitionMethod === 'native' ? 'white' : '#4285F4'} />
              <ThemedText style={[styles.methodText, recognitionMethod === 'native' && styles.selectedMethodText]}>
                Device
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.methodButton, recognitionMethod === 'web' && styles.selectedMethod]}
              onPress={() => setRecognitionMethod('web')}
            >
              <FontAwesome name="chrome" size={14} color={recognitionMethod === 'web' ? 'white' : '#4285F4'} />
              <ThemedText style={[styles.methodText, recognitionMethod === 'web' && styles.selectedMethodText]}>
                Web
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.methodButton, recognitionMethod === 'google' && styles.selectedMethod]}
              onPress={() => setRecognitionMethod('google')}
            >
              <FontAwesome name="google" size={14} color={recognitionMethod === 'google' ? 'white' : '#4285F4'} />
              <ThemedText style={[styles.methodText, recognitionMethod === 'google' && styles.selectedMethodText]}>
                Google
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.methodButton, recognitionMethod === 'google-stream' && styles.selectedMethod]}
              onPress={() => setRecognitionMethod('google-stream')}
            >
              <FontAwesome name="google" size={14} color={recognitionMethod === 'google-stream' ? 'white' : '#4285F4'} />
              <ThemedText style={[styles.methodText, recognitionMethod === 'google-stream' && styles.selectedMethodText]}>
                Stream
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          {(recognitionMethod === 'google' || recognitionMethod === 'google-stream') && (
            <ThemedText style={styles.apiKeyReminder}>
              Remember to add your Google Cloud API key in the .env file as GOOGLE_CLOUD_SPEECH_TO_TEXT_API_KEY
            </ThemedText>
          )}
          
          <View style={styles.recorderContainer}>
            {recognitionMethod === 'native' && (
              <VoiceRecorder 
                onTextUpdate={handleTextUpdate}
                onError={handleVoiceError}
              />
            )}
            
            {recognitionMethod === 'web' && (
              <WebSpeechRecognition onTextUpdate={handleTextUpdate} />
            )}
            
            {recognitionMethod === 'google' && (
              <GoogleSpeechToText onTextUpdate={handleTextUpdate} />
            )}
            
            {recognitionMethod === 'google-stream' && (
              <GoogleSpeechStreamToText onTextUpdate={handleTextUpdate} />
            )}
          </View>
          
          {transcription && (
            <View style={styles.transcriptionActions}>
              <TouchableOpacity style={styles.saveButton} onPress={saveTranscription}>
                <FontAwesome name="save" size={18} color="white" />
                <ThemedText style={styles.buttonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          
          {transcriptionHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <ThemedText type="defaultSemiBold" style={styles.historyTitle}>
                  History
                </ThemedText>
                <TouchableOpacity onPress={clearHistory}>
                  <ThemedText style={styles.clearButton}>Clear All</ThemedText>
                </TouchableOpacity>
              </View>
              
              {transcriptionHistory.map((text, index) => (
                <View key={index} style={styles.historyItem}>
                  <ThemedText style={styles.historyText}>{text}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    flex: 1,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  methodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  selectedMethod: {
    backgroundColor: '#4285F4',
  },
  methodText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#4285F4',
  },
  selectedMethodText: {
    color: 'white',
  },
  apiKeyReminder: {
    fontSize: 12,
    color: '#EA4335',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  recorderContainer: {
    flex: 1,
  },
  transcriptionActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  historyContainer: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
  },
  clearButton: {
    color: '#EA4335',
    fontSize: 14,
  },
  historyItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 8,
    marginBottom: 10,
  },
  historyText: {
    fontSize: 16,
  },
}); 