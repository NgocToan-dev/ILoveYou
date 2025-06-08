import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, clearIndexedDbPersistence, enableNetwork, disableNetwork } from 'firebase/firestore';
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

// Function to clear Firestore cache when BloomFilter errors occur
export const clearFirestoreCache = async () => {
  try {
    console.log('Clearing Firestore cache due to BloomFilter error...');
    
    // Disable network first
    await disableNetwork(db);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to clear IndexedDB persistence (may not work in React Native, but worth trying)
    try {
      await clearIndexedDbPersistence(db);
      console.log('IndexedDB persistence cleared');
    } catch (error) {
      console.log('IndexedDB clear not available in React Native:', error.message);
    }
    
    // Re-enable network
    await enableNetwork(db);
    
    console.log('Firestore cache cleared and network re-enabled');
    return true;
  } catch (error) {
    console.error('Error clearing Firestore cache:', error);
    
    // Try to re-enable network if it failed
    try {
      await enableNetwork(db);
    } catch (enableError) {
      console.error('Failed to re-enable network:', enableError);
    }
    
    return false;
  }
};

// Function to restart Firestore connection
export const restartFirestoreConnection = async () => {
  try {
    console.log('Restarting Firestore connection...');
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await enableNetwork(db);
    console.log('Firestore connection restarted');
    return true;
  } catch (error) {
    console.error('Error restarting Firestore connection:', error);
    return false;
  }
};

export default app;