import { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // You'll need to add this
        iosClientId: 'YOUR_IOS_CLIENT_ID', // You'll need to add this
        androidClientId: 'YOUR_ANDROID_CLIENT_ID', // You'll need to add this
        webClientId: 'YOUR_WEB_CLIENT_ID', // You'll need to add this
      });

      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const credential = GoogleAuthProvider.credential(result.authentication?.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };
} 