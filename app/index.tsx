import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert, TouchableOpacity, TextInput, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome } from '@expo/vector-icons';
import { AIService } from '@/services/aiService';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useSpeech } from '@/hooks/useSpeech';
import { ChatMessage } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';

/**
 * Main chat screen component
 */
export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpokenMessage, setCurrentSpokenMessage] = useState<string | null>(null);
  const { speak, stop, togglePause, isSpeaking, isPaused, currentWord } = useSpeech();
  const keyboardHeight = useKeyboard();

  // Cleanup voice reader when component unmounts
  useEffect(() => {
    return () => {
      stop();
      setCurrentSpokenMessage(null);
    };
  }, []);

  // Initialize AI service
  const aiService = new AIService(process.env.EXPO_PUBLIC_GOOGLE_AI_KEY || '');

  /**
   * Handles sending a message to the AI
   */
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      Alert.alert("Error", "Please enter a message.");
      return;
    }

    setIsLoading(true);
    try {
      // Add user message
      const userMessage = aiService.createMessage('user', inputText);
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await aiService.generateResponse(inputText);
      const assistantMessage = aiService.createMessage('assistant', response);
      setMessages(prev => [...prev, assistantMessage]);
      setInputText('');
    } catch (error) {
      Alert.alert("Error", "Failed to generate response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles speaking a message
   * @param message - The message to speak
   */
  const handleSpeak = async (message: ChatMessage) => {
    if (isSpeaking) {
      if (currentSpokenMessage === message.id) {
        await togglePause();
      } else {
        await stop();
        setCurrentSpokenMessage(message.id);
        await speak(message.content, {
          onComplete: () => setCurrentSpokenMessage(null)
        });
      }
    } else {
      setCurrentSpokenMessage(message.id);
      await speak(message.content, {
        onComplete: () => setCurrentSpokenMessage(null)
      });
    }
  };

  /**
   * Highlights the current word in the message text
   * @param text - The message text
   * @param currentWord - The word currently being spoken
   * @returns Array of text segments with highlighted word
   */
  const highlightCurrentWord = (text: string, currentWord: string | null) => {
    if (!currentWord) return <ThemedText style={styles.messageText}>{text}</ThemedText>;
    
    const parts = text.split(new RegExp(`(${currentWord})`, 'gi'));
    return (
      <ThemedText style={styles.messageText}>
        {parts.map((part, index) => 
          part.toLowerCase() === currentWord?.toLowerCase() ? (
            <ThemedText key={index} style={[styles.messageText, styles.highlightedWord]}>
              {part}
            </ThemedText>
          ) : (
            part
          )
        )}
      </ThemedText>
    );
  };

  /**
   * Clears the chat history
   */
  const clearChat = () => {
    stop();
    setMessages([]);
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>AURA</ThemedText>
          <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
            <FontAwesome name="trash" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {messages.map((message, index) => (
            <View 
              key={index} 
              style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}
            >
              <View style={styles.messageContent}>
                {highlightCurrentWord(message.content, currentSpokenMessage === message.id ? currentWord : null)}
                <View style={styles.messageFooter}>
                  <View style={styles.messageActions}>
                    {isSpeaking && currentSpokenMessage === message.id ? (
                      <>
                        <TouchableOpacity
                          style={styles.speakButton}
                          onPress={togglePause}
                        >
                          <Ionicons
                            name={isPaused ? "play" : "pause"}
                            size={20}
                            color="#007AFF"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.speakButton}
                          onPress={stop}
                        >
                          <Ionicons
                            name="stop"
                            size={20}
                            color="#007AFF"
                          />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => handleSpeak(message)}
                      >
                        <Ionicons
                          name="volume-high"
                          size={20}
                          color="#007AFF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <ThemedText style={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingMessage}>
              <View style={styles.loadingDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <ThemedText style={styles.loadingText}>AI is thinking...</ThemedText>
            </View>
          )}
        </ScrollView>

        <View style={[
          styles.inputContainer,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20 }
        ]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
              maxLength={1000}
              onSubmitEditing={handleGenerate}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleGenerate}
              disabled={isLoading || !inputText.trim()}
            >
              <FontAwesome name="send" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  highlightedWord: {
    backgroundColor: '#E8F0FE',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sendButton: {
    backgroundColor: '#4285F4',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    padding: 8,
  },
}); 