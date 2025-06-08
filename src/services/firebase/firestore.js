import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// Users collection operations
export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), userData);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { user: { id: userDoc.id, ...userDoc.data() }, error: null };
    } else {
      return { user: null, error: 'User profile not found in database' };
    }
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Helper function to get or create user profile
export const getOrCreateUser = async (userId, userAuth) => {
  try {
    // First try to get existing user
    const { user, error } = await getUser(userId);
    
    if (user) {
      // If user exists but has old date format, update it
      if (user.createdAt && !(user.createdAt.toDate)) {
        // Convert old Date to Firestore Timestamp
        const updatedData = {
          ...user,
          createdAt: Timestamp.fromDate(new Date(user.createdAt)),
        };
        
        // Update the user document with the new timestamp format
        await updateDoc(doc(db, 'users', userId), {
          createdAt: updatedData.createdAt,
        });
        
        return { user: updatedData, error: null };
      }
      
      return { user, error: null };
    }
    
    // If user doesn't exist, create one with basic info from auth
    const userData = {
      displayName: userAuth.displayName || 'Anonymous User',
      email: userAuth.email,
      createdAt: Timestamp.now(),
      bio: '',
      phoneNumber: '',
    };
    
    const createResult = await createUser(userId, userData);
    if (createResult.error) {
      return { user: null, error: createResult.error };
    }
    
    // Return the newly created user
    return { user: { id: userId, ...userData }, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const updateUser = async (userId, userData) => {
  try {
    await updateDoc(doc(db, 'users', userId), userData);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Messages collection operations
export const sendMessage = async (messageData) => {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      timestamp: Timestamp.now(),
    });
    return { messageId: docRef.id, error: null };
  } catch (error) {
    return { messageId: null, error: error.message };
  }
};

export const getMessages = async (userId, partnerId) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains-any', [userId, partnerId]),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    return { messages, error: null };
  } catch (error) {
    return { messages: [], error: error.message };
  }
};

// Real-time message listener
export const subscribeToMessages = (userId, partnerId, callback) => {
  const q = query(
    collection(db, 'messages'),
    where('participants', 'array-contains-any', [userId, partnerId]),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

// Couple operations
export const createCouple = async (coupleData) => {
  try {
    const docRef = await addDoc(collection(db, 'couples'), {
      ...coupleData,
      createdAt: Timestamp.now(),
    });
    return { coupleId: docRef.id, error: null };
  } catch (error) {
    return { coupleId: null, error: error.message };
  }
};

export const getCouple = async (userId) => {
  try {
    const q = query(
      collection(db, 'couples'),
      where('members', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { couple: { id: doc.id, ...doc.data() }, error: null };
    } else {
      return { couple: null, error: 'Couple not found' };
    }
  } catch (error) {
    return { couple: null, error: error.message };
  }
};

export const updateCouple = async (coupleId, coupleData) => {
  try {
    await updateDoc(doc(db, 'couples', coupleId), coupleData);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Alias for getUserProfile (for compatibility)
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};