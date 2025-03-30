import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { AIService } from "@/services/aiService";
import { ChatMessage } from "@/types/chat";
import { LocationService } from "@/services/locationService";

interface Message {
  id: string;
  prompt: string;
  response?: string;
  status: {
    state: "PROCESSING" | "COMPLETED" | "ERROR";
  };
}

export default function ChatV2Screen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const aiServiceRef = useRef<AIService | null>(null);
  const locationService = useRef(LocationService.getInstance()).current;

  useEffect(() => {
    // Initialize AI service with your API key
    aiServiceRef.current = new AIService(process.env.GOOGLE_AI_KEY || "");
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !aiServiceRef.current) return;
    
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;
    const hasProcessingMessage = messages.some(msg => msg.status.state === "PROCESSING");

    if (hasProcessingMessage && timeSinceLastMessage < 30000) {
      return;
    }

    setIsSending(true);
    setLastMessageTime(now);

    const newMessage: Message = {
      id: Date.now().toString(),
      prompt: inputText.trim(),
      status: { state: "PROCESSING" }
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    try {
      // Add user message to chat history
      aiServiceRef.current.addMessage('user', inputText.trim());
      
      const response = await aiServiceRef.current.generateResponse(inputText.trim());
      
      // Add assistant response to chat history
      aiServiceRef.current.addMessage('model', response);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, response, status: { state: "COMPLETED" } }
            : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: { state: "ERROR" } }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = () => {
    setMessages([]);
    aiServiceRef.current?.resetChat();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageGroup}>
      <View style={[styles.messageContainer, styles.userMessage]}>
        <Text style={[styles.messageText, styles.userMessageText]}>
          {item.prompt}
        </Text>
      </View>
      {item.response ? (
        <View style={[styles.messageContainer, styles.botMessage]}>
          <Markdown 
            style={{
              body: styles.messageText,
              strong: styles.boldText,
              em: styles.italicText,
              bullet_list: styles.bulletList,
              bullet_list_icon: styles.bulletListIcon,
              code: styles.codeText,
              code_inline: styles.codeInline,
              fence: styles.codeBlock,
            }}
          >
            {item.response}
          </Markdown>
        </View>
      ) : item.status.state === "PROCESSING" ? (
        <View style={[styles.messageContainer, styles.botMessage]}>
          <ActivityIndicator style={styles.messageLoader} color="#4A90E2" />
        </View>
      ) : item.status.state === "ERROR" ? (
        <View style={[styles.messageContainer, styles.errorMessage]}>
          <Text style={styles.errorText}>Failed to send message. Please try again.</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat V2</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="#222222" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#717171"
            multiline
            maxLength={1000}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              <Ionicons 
                name="send" 
                size={24} 
                color={inputText.trim() ? "#4A90E2" : "#717171"} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
  },
  refreshButton: {
    padding: 8,
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
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
  },
  errorMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE5E5",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
  },
  messageLoader: {
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    paddingLeft: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
    paddingTop: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  boldText: {
    fontWeight: "700",
  },
  italicText: {
    fontStyle: "italic",
  },
  bulletList: {
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  bulletListIcon: {
    marginRight: 8,
  },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#F5F5F5",
    padding: 4,
    borderRadius: 4,
  },
  codeInline: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#F5F5F5",
    padding: 2,
    borderRadius: 4,
  },
  codeBlock: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 4,
    marginVertical: 4,
  },
}); 