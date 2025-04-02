import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessages } from '@/components/ChatMessages';
import { AIService } from '@/services/aiService';
import { ChatMessage } from '@/types/chat';

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiService] = useState(() => new AIService(process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY || ''));

  useEffect(() => {
    // Add initial greeting
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      content: "Hello! I'm here to help you find and book appointments at local businesses. What kind of service are you looking for?",
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.generateResponse(inputMessage);
      
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: Date.now() + 1,
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: Date.now() + 1,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput
          value={inputMessage}
          onChangeText={setInputMessage}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
}); 