import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { useChats } from "../../../hooks/useChats";
import { useChatMessages } from "../../../hooks/useChatMessages";
import { formatDistanceToNow } from "date-fns";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.8;

export function ChatScreen() {
  const { 
    chats, 
    loading: chatsLoading, 
    error: chatsError, 
    createNewChat, 
    initializeChatIfNeeded,
    deleteChat 
  } = useChats();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerAnimation] = useState(new Animated.Value(0));
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const { messages, loading: messagesLoading, error: messagesError, sendMessage } = useChatMessages(selectedChatId);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  useEffect(() => {
    initializeChatIfNeeded();
  }, []);

  useEffect(() => {
    Animated.timing(drawerAnimation, {
      toValue: isDrawerOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isDrawerOpen]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const drawerTranslateX = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const overlayOpacity = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;
    const hasProcessingMessage = messages.some(msg => msg.status.state === "PROCESSING");

    if (hasProcessingMessage && timeSinceLastMessage < 30000) {
      return;
    }

    setIsSending(true);
    setLastMessageTime(now);
    await sendMessage(inputText.trim());
    setInputText("");
    setIsSending(false);
  };

  const handleNewChat = async () => {
    try {
      const newChatId = await createNewChat();
      if (newChatId) {
        setSelectedChatId(newChatId);
        setIsDrawerOpen(false);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChatToDelete(chatId);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    
    await deleteChat(chatToDelete);
    if (selectedChatId === chatToDelete) {
      setSelectedChatId(null);
    }
    setChatToDelete(null);
  };

  const renderMessage = ({ item }: { item: any }) => (
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
      ) : null}
    </View>
  );

  const renderChatItem = ({ item }: { item: any }) => {
    const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
      const scale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      });

      return (
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteChat(item.id)}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Swipeable
        renderLeftActions={renderLeftActions}
        leftThreshold={20}
        overshootLeft={false}
        friction={2}
        enableTrackpadTwoFingerGesture
        shouldCancelWhenOutside
      >
        <TouchableOpacity 
          style={[
            styles.chatItem,
            selectedChatId === item.id && styles.selectedChatItem
          ]}
          onPress={() => {
            setSelectedChatId(item.id);
            setIsDrawerOpen(false);
          }}
        >
          <View style={styles.chatItemContent}>
            <Text style={styles.chatName}>{item.chatName}</Text>
            <Text style={styles.chatDate}>
              {item.lastUpdated ? formatDistanceToNow(item.lastUpdated, { addSuffix: true }) : "Just now"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#717171" />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsDrawerOpen(true)}
          >
            <Ionicons name="menu" size={24} color="#222222" />
          </TouchableOpacity>
          {selectedChatId ? (
            <Text style={styles.headerTitle}>
              {chats.find(chat => chat.id === selectedChatId)?.chatName || "Chat"}
            </Text>
          ) : (
            <Text style={styles.headerTitle}>Select a Chat</Text>
          )}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={24} color="#222222" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {selectedChatId ? (
            <>
              {messagesError && <ErrorMessage error={messagesError} />}
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
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              {chatsError && <ErrorMessage error={chatsError} />}
              <Text style={styles.placeholderText}>
                Select a chat or create a new one
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>

        {isDrawerOpen && (
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.overlayTouchable}
              onPress={() => setIsDrawerOpen(false)}
            />
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: drawerTranslateX }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Chats</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsDrawerOpen(false)}
            >
              <Ionicons name="close" size={24} color="#222222" />
            </TouchableOpacity>
          </View>
          {chatsLoading ? (
            <ActivityIndicator style={styles.loader} color="#4A90E2" />
          ) : (
            <FlatList
              data={chats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
            />
          )}
        </Animated.View>
      </View>

      <Modal
        visible={!!chatToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setChatToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Chat</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this chat? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setChatToDelete(null)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={confirmDeleteChat}
              >
                <Text style={styles.modalDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    zIndex: 1001,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  menuButton: {
    padding: 8,
  },
  newChatButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
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
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  botMessageText: {
    color: "#222222",
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
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#fff",
    zIndex: 1002,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },
  closeButton: {
    padding: 8,
  },
  chatList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedChatItem: {
    backgroundColor: "#E5E5EA",
  },
  chatItemContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
  },
  chatDate: {
    fontSize: 14,
    color: "#717171",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 1001,
  },
  overlayTouchable: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  deleteButtonContainer: {
    height: 76,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#717171",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F0F0F0",
  },
  modalDeleteButton: {
    backgroundColor: "#FF3B30",
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "600",
  },
  modalDeleteButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
}); 