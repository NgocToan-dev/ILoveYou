import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBzQwGg_Hh9dDVNbkVZR3da0pmKjInpHE0",
  authDomain: "loveapp-30-5.firebaseapp.com",
  projectId: "loveapp-30-5",
  storageBucket: "loveapp-30-5.firebasestorage.app",
  messagingSenderId: "983282809749",
  appId: "1:983282809749:android:b03d92d5f2c8fb4c50149c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;