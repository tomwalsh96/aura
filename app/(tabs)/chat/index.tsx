import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIService } from '@/services/aiService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocationService } from "@/services/locationService";
import PaymentModal from '@/components/ui/PaymentModal';
import { useRouter } from 'expo-router';
import { GOOGLE_AI_KEY } from '@env';
import * as Speech from 'expo-speech';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  duration?: number;
  audioUri?: string;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

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
    aiServiceRef.current = new AIService(GOOGLE_AI_KEY || "");
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

  const handleSendMessage = async () => {
    if (!inputText.trim() && !isRecording) return;

    try {
      setIsSending(true);
      const userMessage = inputText.trim();
      setInputText("");

      // Add user message to chat immediately
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: userMessage,
        sender: 'user'
      }]);

      // Add a temporary loading message
      const loadingMessageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: loadingMessageId,
        text: "Thinking...",
        sender: 'ai'
      }]);

      // Scroll to the bottom to show the loading message
      flatListRef.current?.scrollToEnd({ animated: true });

      const response = await aiServiceRef.current?.generateResponse(userMessage);

      // Remove the loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      if (response) {
        // Check if the response contains a booking confirmation with payment status
        if (response.includes("booking") && response.includes("not yet paid")) {
          // Extract booking details from the response
          const bookingMatch = response.match(/booking for (.*?) at (.*?) on (.*?) at (.*?)\. This booking is not yet paid/);
          if (bookingMatch) {
            const [_, serviceName, businessName, date, startTime] = bookingMatch;
            
            // Create a booking object
            const booking = {
              serviceName,
              businessName,
              date,
              startTime,
              isPaid: false // AI-created bookings are not paid
            };
            
            // Handle the unpaid booking
            handleUnpaidBooking(booking);
          }
        }
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: response,
          sender: 'ai'
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Sorry, there was an error processing your message. Please try again.',
        sender: 'system'
      }]);
    } finally {
      setIsSending(false);
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
          text: "[Audio Message]",
          sender: "user",
          duration: duration,
          audioUri: uri,
        };

        // Add AI loading message immediately
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "",
          sender: "ai",
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
                  ? { ...msg, text: response, sender: "ai" }
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
                    text: error instanceof Error ? error.message : 'Failed to process voice message',
                    sender: "system"
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
    setSpeakingMessageId(null); // Reset speaking state
    
    // Stop any ongoing speech synthesis
    Speech.stop();
    
    // Clean up any ongoing audio playback or recording
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

  const handlePlayAudio = async (audioIdentifier: string) => {
    // Stop any text-to-speech first
    Speech.stop();
    setSpeakingMessageId(null);

    if (isPlaying === audioIdentifier) {
      // Pause current playback
      await soundRef.current?.pauseAsync();
      setIsPlaying(null);
    } else {
      // Stop previous playback if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(audioIdentifier); // Set playing state to current audio
      setPlaybackPosition(prev => ({ ...prev, [audioIdentifier]: 0 })); // Reset position

      try {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioIdentifier },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPlaybackPosition(prev => ({
                ...prev,
                [audioIdentifier]: status.positionMillis / 1000
              }));
              if (status.didJustFinish) {
                setIsPlaying(null);
                soundRef.current?.unloadAsync(); // Unload when finished
                soundRef.current = null;
              }
            }
          }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error('Error playing audio:', error);
        Alert.alert('Error', 'Could not play audio file.');
        setIsPlaying(null); // Reset playing state on error
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }
    }
  };

  const handleSpeakMessage = async (messageId: string, text: string) => {
    // Stop any audio playback first
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(null);
    }

    if (speakingMessageId === messageId) {
      // If already speaking this message, stop it
      Speech.stop();
      setSpeakingMessageId(null);
    } else {
      // Stop any previous speech
      Speech.stop();
      // Speak the new message
      Speech.speak(text, {
        onDone: () => setSpeakingMessageId(null),
        onError: (error) => {
          console.error('Error speaking message:', error);
          setSpeakingMessageId(null);
          Alert.alert('Error', 'Could not read message aloud.');
        },
      });
      setSpeakingMessageId(messageId);
    }
  };

  const handlePaymentComplete = async (paymentDetails: any) => {
    try {
      if (!pendingBooking) return;

      const bookingConfirmation = await aiServiceRef.current?.confirmBooking(pendingBooking.id);
      
      if (bookingConfirmation?.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `Payment successful! Your booking for ${pendingBooking.serviceName} at ${pendingBooking.businessName} on ${pendingBooking.date} at ${pendingBooking.startTime} has been confirmed.`,
          sender: 'system'
        }]);
        
        setShowPaymentModal(false);
        setPendingBooking(null);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: 'Sorry, there was an error confirming your booking. Please try again.',
          sender: 'system'
        }]);
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Sorry, there was an error confirming your booking. Please try again.',
        sender: 'system'
      }]);
    }
  };

  const handleUnpaidBooking = (booking: any) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `Your booking for ${booking.serviceName} at ${booking.businessName} on ${booking.date} at ${booking.startTime} has been created but is not yet paid. Please go to the My Bookings page to complete your payment.`,
      sender: 'system'
    }]);
    
    // Add a button to navigate to My Bookings
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      text: "Go to My Bookings",
      sender: 'system'
    }]);
    
    // Navigate to My Bookings after a short delay
    setTimeout(() => {
      router.push('/(tabs)/my-bookings');
    }, 2000);
  };

  const handleMicPress = () => {
    if (isButtonDisabled) return;
    
    // Show tooltip
    setShowTooltip(true);
    
    // Hide tooltip after 2 seconds
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    
    tooltipTimeout.current = setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  const handleMicLongPress = () => {
    if (isButtonDisabled) return;
    startRecording();
  };

  const handleMicPressOut = () => {
    if (isRecording) {
      stopRecording(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    const isAudio = !!item.audioUri;
    const isProcessing = item.text === "Thinking...";
    const isPlayingThis = isPlaying === (item.audioUri || item.text);
    const currentPosition = playbackPosition[item.audioUri || item.text] || 0;
    const isSpeakingThis = speakingMessageId === item.id;

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
              onPress={() => handlePlayAudio(item.audioUri || item.text)}
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
            {isUser ? (
              <Text style={styles.userMessageText}>{item.text}</Text>
            ) : isProcessing ? (
              <View style={[styles.processingContainer, { backgroundColor: '#F0F0F0' }]}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.processingText}>
                  Thinking...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.aiMessageContentContainer}>
                  <Text style={styles.aiMessageText}>
                    {item.text}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => handleSpeakMessage(item.id, item.text)}
                >
                  <Ionicons
                    name={isSpeakingThis ? "stop-circle" : "volume-high"}
                    size={18}
                    color={"#FFFFFF"}
                  />
                </TouchableOpacity>
              </>
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
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
      // Stop any ongoing speech synthesis
      Speech.stop();
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
                onPress={inputText.trim() ? handleSendMessage : handleMicPress}
                onLongPress={handleMicLongPress}
                onPressOut={handleMicPressOut}
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
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>Hold to speak</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {showPaymentModal && pendingBooking && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPendingBooking(null);
          }}
          onPaymentComplete={handlePaymentComplete}
          bookingDetails={pendingBooking}
        />
      )}
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
  messagesList: {
    padding: 16,
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
    position: 'relative',
    padding: 0,
    overflow: 'visible',
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
  textMessageContainer: {
    width: '100%',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    minWidth: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
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
  tooltip: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 100,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  aiMessageContentContainer: {
    padding: 12,
    paddingRight: 30,
  },
  speakButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#4A90E2',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
}); 