import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, getDocs, collectionGroup } from "firebase/firestore";
import { db } from "../firebase-config";
import { useAuth } from "./useAuth";

interface Chat {
  id: string;
  chatName: string;
  createdAt: Date;
  lastUpdated: Date;
}

const CHAT_NAMES = [
  "Cosmic Explorer",
  "Digital Dreamer",
  "Quantum Wanderer",
  "Neural Navigator",
  "Binary Bard",
  "Pixel Poet",
  "Data Druid",
  "Circuit Sage",
  "Code Conjurer",
  "Tech Titan",
];

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, "users", user.uid, "chats");
    const q = query(chatsRef, orderBy("lastUpdated", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        chatName: doc.data().chatName,
        createdAt: doc.data().createdAt?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      }));
      setChats(chatList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createNewChat = async () => {
    if (!user) {
      setError("User not found");
      return null;
    }

    try {
      setError(null);
      const randomName = CHAT_NAMES[Math.floor(Math.random() * CHAT_NAMES.length)];
      const chatsRef = collection(db, "users", user.uid, "chats");

      const docRef = await addDoc(chatsRef, {
        chatName: randomName,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });

      return docRef.id;
    } catch (err) {
      console.error("Error creating new chat:", err);
      setError(err instanceof Error ? err.message : "Failed to create new chat");
      return null;
    }
  };

  const initializeChatIfNeeded = async () => {
    if (!user || chats.length > 0) return;
    await createNewChat();
  };

  const deleteChat = async (chatId: string) => {
    if (!user) {
      setError("User not found");
      return;
    }

    try {
      setError(null);
      const chatRef = doc(db, "users", user.uid, "chats", chatId);
      
      // Delete all messages in the chat
      const messagesRef = collection(chatRef, "chat");
      const messagesSnapshot = await getDocs(messagesRef);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the chat document itself
      await deleteDoc(chatRef);
    } catch (err) {
      console.error("Error deleting chat:", err);
      setError(err instanceof Error ? err.message : "Failed to delete chat");
    }
  };

  return {
    chats,
    loading,
    error,
    createNewChat,
    initializeChatIfNeeded,
    deleteChat,
  };
} 