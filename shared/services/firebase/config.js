import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, clearIndexedDbPersistence, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - use environment variables in production
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyBzQwGg_Hh9dDVNbkVZR3da0pmKjInpHE0",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "loveapp-30-5.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "loveapp-30-5",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "loveapp-30-5.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "983282809749",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:983282809749:android:b03d92d5f2c8fb4c50149c",
};

// MinIO configuration - for future storage integration
export const minioConfig = {
  endPoint: import.meta.env?.VITE_MINIO_ENDPOINT || 'localhost',
  port: parseInt(import.meta.env?.VITE_MINIO_PORT) || 8080,
  useSSL: import.meta.env?.VITE_MINIO_USE_SSL === 'true' || false,
  accessKey: import.meta.env?.VITE_MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: import.meta.env?.VITE_MINIO_SECRET_KEY || 'minioadmin123',
  bucketName: import.meta.env?.VITE_MINIO_BUCKET_NAME || 'loveapp',
  region: import.meta.env?.VITE_MINIO_REGION || 'us-east-1',
  // MinIO Console URL for management
  consoleUrl: import.meta.env?.VITE_MINIO_CONSOLE_URL || 'http://localhost:8080/browser/loveapp'
};

// Storage provider configuration
export const storageConfig = {
  provider: import.meta.env?.VITE_STORAGE_PROVIDER || 'firebase', // 'firebase' | 'minio' | 'hybrid'
  enableFallback: import.meta.env?.VITE_STORAGE_FALLBACK !== 'false',
  preferredProvider: import.meta.env?.VITE_PREFERRED_STORAGE_PROVIDER || 'firebase',
  autoFailover: import.meta.env?.VITE_STORAGE_AUTO_FAILOVER !== 'false',
  healthCheckInterval: parseInt(import.meta.env?.VITE_STORAGE_HEALTH_CHECK_INTERVAL) || 60000
};

// Log configuration in development
if (import.meta.env?.DEV || (typeof window !== 'undefined' && window.ENV === 'development')) {
  console.log('Firebase Config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    usingEnvVars: !!import.meta.env?.VITE_FIREBASE_API_KEY
  });
  
  console.log('MinIO Config:', {
    endPoint: minioConfig.endPoint,
    port: minioConfig.port,
    useSSL: minioConfig.useSSL,
    bucketName: minioConfig.bucketName,
    consoleUrl: minioConfig.consoleUrl,
    usingEnvVars: !!import.meta.env?.VITE_MINIO_ENDPOINT
  });
  
  console.log('Storage Config:', {
    provider: storageConfig.provider,
    enableFallback: storageConfig.enableFallback,
    preferredProvider: storageConfig.preferredProvider,
    autoFailover: storageConfig.autoFailover,
    healthCheckInterval: storageConfig.healthCheckInterval
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth - Firebase v11+ handles React Native persistence automatically
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

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
