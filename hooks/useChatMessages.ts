import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase-config";
import { useAuth } from "./useAuth";

interface MessageStatus {
  completeTime: Date | null;
  startTime: Date | null;
  updateTime: Date | null;
  state: "PROCESSING" | "COMPLETED";
}

interface ChatMessage {
  id: string;
  prompt: string;
  response: string;
  createTime: Date;
  status: MessageStatus;
}

export function useChatMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, "users", user.uid, "chats", chatId, "chat");
    const q = query(messagesRef, orderBy("createTime", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          prompt: data.prompt,
          response: data.response,
          createTime: data.createTime?.toDate(),
          status: {
            completeTime: data.status?.completeTime?.toDate() || null,
            startTime: data.status?.startTime?.toDate() || null,
            updateTime: data.status?.updateTime?.toDate() || null,
            state: data.status?.state || "PROCESSING",
          },
        };
      });
      setMessages(messageList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, chatId]);

  const sendMessage = async (prompt: string) => {
    if (!user || !chatId) {
      setError("User or chat not found");
      return;
    }

    try {
      setError(null);
      const messagesRef = collection(db, "users", user.uid, "chats", chatId, "chat");

      await addDoc(messagesRef, {
        prompt,
        createTime: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
} 