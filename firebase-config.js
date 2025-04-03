// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCqQR6fCgUMH28LXmAvno_fFbVb7VzHz-k",
    authDomain: "aura-6d880.firebaseapp.com",
    projectId: "aura-6d880",
    storageBucket: "aura-6d880.firebasestorage.app",
    messagingSenderId: "268033800249",
    appId: "1:268033800249:web:861c347b25819fdb6775e8",
    measurementId: "G-WJTFWZ235N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);