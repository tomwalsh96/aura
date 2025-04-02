import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated, PanResponder } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AIService } from '@/services/aiService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocationService } from "@/services/locationService";

interface Message {
  id: string;
  prompt: string;
  response?: string;
  status: {
    state: "PROCESSING" | "COMPLETED" | "ERROR";
  };
  error?: string;
  audioUri?: string;
  duration?: number;
  role: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const aiServiceRef = useRef<AIService | null>(null);
  const locationService = useRef(LocationService.getInstance()).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<Record<string, string>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const buttonDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showCancelUI, setShowCancelUI] = useState(false);
  const cancelThreshold = 100; // pixels to slide before canceling
  const [playbackPosition, setPlaybackPosition] = useState<Record<string, number>>({});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isRecording,
      onMoveShouldSetPanResponder: () => isRecording,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -cancelThreshold) {
          // Cancel recording
          stopRecording(true);
        } else {
          // Send the recording
          stopRecording(false);
        }
        // Reset position
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    // Initialize AI service with your API key
    aiServiceRef.current = new AIService(process.env.GOOGLE_AI_KEY || "");
    setupAudio();

    // Cleanup function
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = async () => {
    try {
      // Stop any ongoing recording
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      
      // Stop any playing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      if (isButtonDisabled) return;
      if (isRecording || recordingRef.current) return;

      // Set recording state immediately for visual feedback
      setIsRecording(true);
      setShowCancelUI(true);
      setIsButtonDisabled(true);

      // Then set up the recording
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access to record voice messages.');
        setIsRecording(false);
        setShowCancelUI(false);
        setIsButtonDisabled(false);
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
      setShowCancelUI(false);
      recordingRef.current = null;
      setIsButtonDisabled(false);
    }
  };

  const convertAudioToText = async (audioUri: string): Promise<string> => {
    try {
      // Read the audio file
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to Google Cloud Speech-to-Text API
      const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GOOGLE_AI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 44100,
            languageCode: 'en-IE',
            model: 'default',
            useEnhanced: true,
          },
          audio: {
            content: audioBase64,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Speech-to-text API error:', errorData);
        throw new Error(errorData.error?.message || 'Speech-to-text conversion failed');
      }

      const data = await response.json();
      if (data.results && data.results[0] && data.results[0].alternatives) {
        return data.results[0].alternatives[0].transcript;
      }

      throw new Error('No transcription found');
    } catch (error) {
      console.error('Error converting audio to text:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !aiServiceRef.current) return;
    
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;
    const hasProcessingMessage = messages.some(msg => msg.status.state === "PROCESSING");

    if (hasProcessingMessage && timeSinceLastMessage < 30000) {
      return;
    }

    setIsSending(true);
    setIsButtonDisabled(true);
    setLastMessageTime(now);

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      prompt: inputText.trim(),
      status: { state: "COMPLETED" },
      role: "user",
    };

    // Add AI loading message immediately
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      prompt: "",
      status: { state: "PROCESSING" },
      role: "model",
    };

    // Add both messages to the UI immediately
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInputText("");

    try {
      const response = await aiServiceRef.current.generateResponse(inputText.trim());
      
      // Update the AI message with the response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, prompt: response, status: { state: "COMPLETED" } }
            : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { 
                ...msg, 
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
                status: { state: "ERROR" } 
              }
            : msg
        )
      );
    } finally {
      setIsSending(false);
      setIsButtonDisabled(false);
    }
  };

  const stopRecording = async (cancel: boolean = false) => {
    try {
      if (!isRecording || !recordingRef.current) return;

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const recording = recordingRef.current;
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      if (!cancel) {
        const { durationMillis } = await recording.getStatusAsync();
        const duration = durationMillis ? durationMillis / 1000 : undefined;

        // Add user audio message immediately
        const userMessage: Message = {
          id: Date.now().toString(),
          prompt: "[Audio Message]",
          status: { state: "COMPLETED" },
          audioUri: uri,
          duration,
          role: "user",
        };

        // Add AI loading message immediately
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          prompt: "",
          status: { state: "PROCESSING" },
          role: "model",
        };

        // Add both messages to the UI immediately
        setMessages(prev => [...prev, userMessage, aiMessage]);

        setIsButtonDisabled(true);
        if (buttonDebounceTimeout.current) {
          clearTimeout(buttonDebounceTimeout.current);
        }
        buttonDebounceTimeout.current = setTimeout(() => {
          setIsButtonDisabled(false);
        }, 1000);

        try {
          const response = await aiServiceRef.current?.generateResponse(uri, true);
          if (response) {
            // Update the AI message with the response
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessage.id 
                  ? { ...msg, prompt: response, status: { state: "COMPLETED" } }
                  : msg
              )
            );
          }
        } catch (error) {
          console.error('Error processing voice message:', error);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { 
                    ...msg, 
                    error: error instanceof Error ? error.message : 'Failed to process voice message',
                    status: { state: "ERROR" } 
                  }
                : msg
            )
          );
        }
      }

      setShowCancelUI(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
      recordingRef.current = null;
      setIsButtonDisabled(false);
    }
  };

  const handleRefresh = async () => {
    // Reset messages
    setMessages([]);
    
    // Reset AI service
    aiServiceRef.current?.resetChat();
    
    // Reset all states
    setInputText("");
    setIsSending(false);
    setIsRecording(false);
    setIsButtonDisabled(false);
    setShowCancelUI(false);
    setPlaybackPosition({});
    setIsPlaying(null);
    
    // Clean up any ongoing audio
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up audio during refresh:', error);
    }
  };

  const handlePlayAudio = async (uri: string) => {
    try {
      // Stop any ongoing recording first
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
        setIsRecording(false);
      }

      // Stop current playback if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If trying to play the same audio that's already playing, stop it
      if (isPlaying === uri) {
        setIsPlaying(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setIsPlaying(uri);

      // Listen for playback status
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(null);
            soundRef.current = null;
            setPlaybackPosition(prev => ({ ...prev, [uri]: 0 }));
          } else {
            setPlaybackPosition(prev => ({ 
              ...prev, 
              [uri]: status.positionMillis ? status.positionMillis / 1000 : 0 
            }));
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio message');
      setIsPlaying(null);
      soundRef.current = null;
    }
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(null);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const isAudio = item.audioUri !== undefined;
    const isProcessing = item.status?.state === "PROCESSING";
    const isPlayingThis = isPlaying === item.audioUri;
    const currentPosition = playbackPosition[item.audioUri || ''] || 0;

    return (
      <View key={item.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage,
        { alignSelf: isUser ? 'flex-end' : 'flex-start' }
      ]}>
        {isAudio ? (
          <View style={styles.audioMessageContainer}>
            <TouchableOpacity 
              style={styles.audioPlayButton}
              onPress={() => handlePlayAudio(item.audioUri!)}
            >
              <Ionicons 
                name={isPlayingThis ? "pause-circle" : "play-circle"} 
                size={24} 
                color={isUser ? "#FFFFFF" : "#007AFF"} 
              />
            </TouchableOpacity>
            <View style={styles.audioMessageContent}>
              <View style={styles.audioMessageHeader}>
                <Text style={[styles.audioMessageText, { color: isUser ? "#FFFFFF" : "#000000" }]}>
                  Voice Message
                </Text>
                <Text style={[styles.audioDuration, { color: isUser ? "#FFFFFF" : "#666666" }]}>
                  {isPlayingThis 
                    ? `${Math.round(currentPosition)}s / ${Math.round(item.duration || 0)}s`
                    : `${Math.round(item.duration || 0)}s`
                  }
                </Text>
              </View>
              <View style={styles.audioWaveform}>
                <View style={[styles.waveformBar, { height: 4 }]} />
                <View style={[styles.waveformBar, { height: 8 }]} />
                <View style={[styles.waveformBar, { height: 4 }]} />
                <View style={[styles.waveformBar, { height: 12 }]} />
                <View style={[styles.waveformBar, { height: 4 }]} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.textMessageContainer}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color={isUser ? "#FFFFFF" : "#007AFF"} />
                <Text style={[styles.processingText, isUser ? styles.userMessageText : styles.aiMessageText]}>
                  {isUser ? "Processing voice message..." : "Thinking..."}
                </Text>
              </View>
            ) : (
              <Text style={[isUser ? styles.userMessageText : styles.aiMessageText, { flexWrap: 'wrap' }]}>
                {item.prompt}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (buttonDebounceTimeout.current) {
        clearTimeout(buttonDebounceTimeout.current);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={24} color="#222222" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
            />
            <Animated.View 
              style={[
                styles.actionButtonContainer,
                {
                  transform: [{ translateX: slideAnim }]
                }
              ]}
              {...(isRecording ? panResponder.panHandlers : {})}
            >
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isButtonDisabled && !isRecording && styles.actionButtonDisabled,
                  isRecording && styles.actionButtonRecording
                ]}
                onPress={inputText.trim() ? handleSend : undefined}
                onLongPress={startRecording}
                onPressOut={() => {
                  if (isRecording) {
                    stopRecording(false);
                  }
                }}
                disabled={isButtonDisabled}
              >
                {isRecording ? (
                  <View style={styles.recordingIndicator}>
                    <Ionicons
                      name="mic"
                      size={24}
                      color="#FFFFFF"
                    />
                    <View style={styles.recordingDot} />
                  </View>
                ) : (
                  <Ionicons
                    name={inputText.trim() ? "send" : "mic-outline"}
                    size={24}
                    color={isButtonDisabled ? "#999999" : "#007AFF"}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
          {showCancelUI && (
            <Animated.View 
              style={[
                styles.cancelUI,
                {
                  opacity: slideAnim.interpolate({
                    inputRange: [-cancelThreshold, 0],
                    outputRange: [1, 0],
                  }),
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [-cancelThreshold, 0],
                        outputRange: [0, 50],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.cancelText}>Slide to cancel</Text>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#222222",
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageGroup: {
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
  },
  errorMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE5E5",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  aiMessageText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000000",
  },
  messageLoader: {
    marginVertical: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    marginLeft: 12,
    fontSize: 16,
  },
  actionButtonContainer: {
    marginRight: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonRecording: {
    backgroundColor: "#FF0000",
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: "#FF0000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: "#E5E5EA",
  },
  boldText: {
    fontWeight: "bold",
  },
  italicText: {
    fontStyle: "italic",
  },
  bulletList: {
    marginLeft: 16,
    flexShrink: 1,
  },
  bulletListIcon: {
    marginRight: 8,
  },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#F5F5F5",
    padding: 4,
    borderRadius: 4,
    flexShrink: 1,
  },
  codeInline: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#F5F5F5",
    padding: 2,
    borderRadius: 4,
    flexShrink: 1,
  },
  codeBlock: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
    flexShrink: 1,
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    minWidth: 200,
  },
  audioPlayButton: {
    marginRight: 8,
    padding: 2,
  },
  audioMessageContent: {
    flex: 1,
    minWidth: 0,
  },
  audioMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  audioMessageText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 8,
  },
  audioDuration: {
    fontSize: 12,
    opacity: 0.8,
    flexShrink: 0,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 12,
    gap: 1,
  },
  waveformBar: {
    width: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  messageContent: {
    flex: 1,
  },
  userMessageContent: {
    alignItems: 'flex-end',
  },
  aiMessageContent: {
    alignItems: 'flex-start',
  },
  textMessageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    minWidth: 100,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 16,
  },
  markdownContainer: {
    flex: 1,
    width: '100%',
  },
  markdownText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    flexWrap: 'wrap',
  },
  markdownParagraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    marginVertical: 4,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  markdownStrong: {
    fontWeight: 'bold',
  },
  markdownEm: {
    fontStyle: 'italic',
  },
  markdownCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#e0e0e0',
    padding: 4,
    borderRadius: 4,
  },
  markdownBulletList: {
    marginVertical: 4,
    paddingLeft: 16,
  },
  markdownOrderedList: {
    marginVertical: 4,
    paddingLeft: 16,
  },
  markdownListItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    marginVertical: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  markdownHeading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  markdownHeading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  markdownHeading3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  markdownLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  markdownBlockQuote: {
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
    paddingLeft: 8,
    marginVertical: 4,
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
  },
  cancelUI: {
    position: 'absolute',
    right: 60,
    bottom: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginLeft: 4,
  },
}); 