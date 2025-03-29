import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface WebSpeechRecognitionProps {
  onTextUpdate?: (text: string) => void;
}

export const WebSpeechRecognition: React.FC<WebSpeechRecognitionProps> = ({ onTextUpdate }) => {
  const webViewRef = useRef<WebView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // HTML content with speech recognition logic
  const webViewHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        #status { text-align: center; font-size: 18px; }
      </style>
    </head>
    <body>
      <div id="status">Web Speech Recognition Ready</div>
      
      <script>
        let recognition;
        let isRecognizing = false;
        
        function setupSpeechRecognition() {
          try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
              document.getElementById('status').innerText = 'Speech recognition not supported in this browser';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Speech recognition not supported' }));
              return false;
            }
            
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => {
              document.getElementById('status').innerText = 'Listening...';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'started' }));
            };
            
            recognition.onresult = (event) => {
              let interimTranscript = '';
              let finalTranscript = '';
              
              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                  finalTranscript += transcript;
                } else {
                  interimTranscript += transcript;
                }
              }
              
              if (finalTranscript) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'finalResult', 
                  text: finalTranscript 
                }));
              } else if (interimTranscript) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'interimResult', 
                  text: interimTranscript 
                }));
              }
            };
            
            recognition.onerror = (event) => {
              document.getElementById('status').innerText = 'Error: ' + event.error;
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                message: event.error 
              }));
            };
            
            recognition.onend = () => {
              if (isRecognizing) {
                // If we're supposed to be recording but recognition ended, restart it
                recognition.start();
              } else {
                document.getElementById('status').innerText = 'Recognition stopped';
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stopped' }));
              }
            };
            
            return true;
          } catch (error) {
            document.getElementById('status').innerText = 'Error setting up speech recognition: ' + error.message;
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'error', 
              message: 'Setup error: ' + error.message 
            }));
            return false;
          }
        }
        
        function startRecognition() {
          if (!recognition && !setupSpeechRecognition()) {
            return;
          }
          
          try {
            isRecognizing = true;
            recognition.start();
          } catch (error) {
            document.getElementById('status').innerText = 'Error starting: ' + error.message;
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'error', 
              message: 'Start error: ' + error.message 
            }));
          }
        }
        
        function stopRecognition() {
          if (!recognition) return;
          
          try {
            isRecognizing = false;
            recognition.stop();
          } catch (error) {
            document.getElementById('status').innerText = 'Error stopping: ' + error.message;
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'error', 
              message: 'Stop error: ' + error.message 
            }));
          }
        }
        
        // Signal that the page is ready
        window.addEventListener('load', () => {
          setupSpeechRecognition();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        });
        
        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          const data = JSON.parse(event.data);
          if (data.command === 'start') {
            startRecognition();
          } else if (data.command === 'stop') {
            stopRecognition();
          }
        });
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'ready':
          setIsProcessing(false);
          break;
        case 'started':
          setIsRecording(true);
          setIsProcessing(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'stopped':
          setIsRecording(false);
          setIsProcessing(false);
          break;
        case 'finalResult':
          setRecognizedText(data.text);
          if (onTextUpdate) {
            onTextUpdate(data.text);
          }
          break;
        case 'interimResult':
          // You can handle interim results if needed
          break;
        case 'error':
          console.error('Web Speech Recognition error:', data.message);
          setError(data.message);
          setIsProcessing(false);
          setIsRecording(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const startRecording = () => {
    setError('');
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Send command to WebView
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        'window.postMessage(JSON.stringify({ command: "start" }), "*"); true;'
      );
    }
  };

  const stopRecording = () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Send command to WebView
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        'window.postMessage(JSON.stringify({ command: "stop" }), "*"); true;'
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: webViewHtml }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          style={styles.webView}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>

      <View style={styles.textContainer}>
        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
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
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <FontAwesome
            name={isRecording ? "stop-circle" : "microphone"}
            size={24}
            color="white"
          />
        )}
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
  webViewContainer: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
  },
  webView: {
    width: 1,
    height: 1,
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
}); 