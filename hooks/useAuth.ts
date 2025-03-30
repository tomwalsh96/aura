import { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  User,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.FIREBASE_API_KEY,
    iosClientId: process.env.FIREBASE_APP_ID,
    androidClientId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    webClientId: process.env.FIREBASE_AUTH_DOMAIN,
  });

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

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      await deleteUser(user);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async ({ displayName, photoURL }: { displayName?: string; photoURL?: string }) => {
    if (!user) throw new Error('No user logged in');

    // Update Firebase Auth profile
    await firebaseUpdateProfile(user, {
      displayName,
      photoURL: photoURL ? `assets/avatars/${photoURL}` : user.photoURL
    });

    // Update user data in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      displayName: displayName || user.displayName,
      avatarLocation: photoURL || user.photoURL?.split('/').pop(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    deleteAccount,
    updateProfile,
  };
} 