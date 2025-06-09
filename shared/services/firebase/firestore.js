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

// Enhanced function to update user and sync with related collections
export const updateUserWithSync = async (userId, userData) => {
  try {
    // Update user document
    await updateDoc(doc(db, 'users', userId), userData);
    
    // Sync with related collections
    await syncUserDataToRelatedCollections(userId, userData);
    
    return { error: null };
  } catch (error) {
    console.error('Error updating user with sync:', error);
    return { error: error.message };
  }
};

// Function to sync user data to related collections
const syncUserDataToRelatedCollections = async (userId, userData) => {
  try {
    const batch = [];
    
    // 1. Update couple collection if user is in a couple
    if (userData.coupleId || userData.displayName) {
      await syncUserDataToCouple(userId, userData);
    }
    
    console.log('Successfully synced user data to related collections');
  } catch (error) {
    console.error('Error syncing user data to related collections:', error);
    throw error;
  }
};

// Sync user data to couple collection
const syncUserDataToCouple = async (userId, userData) => {
  try {
    // First get user's current coupleId
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;
    
    const userProfile = userDoc.data();
    const coupleId = userProfile.coupleId;
    
    if (!coupleId) return; // User is not in a couple
    
    // Get couple document
    const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
    if (!coupleDoc.exists()) return;
    
    const coupleData = coupleDoc.data();
    const updateData = {};
    
    // Update user information in couple document
    if (coupleData.user1?.id === userId) {
      if (userData.displayName) {
        updateData['user1.name'] = userData.displayName;
      }
      updateData['user1.updatedAt'] = Timestamp.now();
    } else if (coupleData.user2?.id === userId) {
      if (userData.displayName) {
        updateData['user2.name'] = userData.displayName;
      }
      updateData['user2.updatedAt'] = Timestamp.now();
    }
    
    if (Object.keys(updateData).length > 0) {
      await updateDoc(doc(db, 'couples', coupleId), updateData);
      console.log('Updated user data in couple collection');
    }
  } catch (error) {
    console.error('Error syncing user data to couple:', error);
    // Don't throw error to prevent blocking the main update
  }
};

// Helper function to get partner information from couple data
const getPartnerInfo = (userId, coupleData) => {
  if (!coupleData) return null;
  
  // Determine which user is the partner
  if (coupleData.user1?.id === userId) {
    return coupleData.user2;
  } else if (coupleData.user2?.id === userId) {
    return coupleData.user1;
  }
  
  return null;
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
    // First get user's coupleId from user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { couple: null, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const coupleId = userData.coupleId;
    
    if (!coupleId) {
      return { couple: null, error: null }; // User is not in a couple
    }
    
    // Get couple document
    const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
    if (!coupleDoc.exists()) {
      return { couple: null, error: 'Couple not found' };
    }
    
    const coupleData = {
      id: coupleDoc.id,
      ...coupleDoc.data()
    };
    
    return { couple: coupleData, error: null };
  } catch (error) {
    console.error('Error getting couple:', error);
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

// Enhanced getUserProfile function with couple information
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    const userData = userDoc.data();
    const profile = {
      id: userDoc.id,
      ...userData
    };
    
    // If user has a coupleId, fetch couple information
    if (userData.coupleId) {
      try {
        const coupleDoc = await getDoc(doc(db, 'couples', userData.coupleId));
        if (coupleDoc.exists()) {
          const coupleData = coupleDoc.data();
          profile.coupleInfo = {
            id: userData.coupleId,
            ...coupleData,
            // Add partner information
            partner: getPartnerInfo(userId, coupleData)
          };
        }
      } catch (coupleError) {
        console.warn('Error fetching couple info for user:', coupleError);
        // Continue without couple info
      }
    }
    
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};