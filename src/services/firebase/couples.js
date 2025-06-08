import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

// Generate a unique 6-digit couple invitation code
export const generateCoupleCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create a couple invitation
export const createCoupleInvitation = async (userId, userDisplayName) => {
  try {
    const code = generateCoupleCode();
    
    // Check if code already exists (very unlikely but safety first)
    const existingInvitation = await getCoupleInvitationByCode(code);
    if (existingInvitation) {
      // Recursively try again with new code
      return createCoupleInvitation(userId, userDisplayName);
    }

    const invitationData = {
      code,
      createdBy: userId,
      createdByName: userDisplayName,
      status: 'pending', // pending, accepted, expired
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const docRef = await addDoc(collection(db, 'coupleInvitations'), invitationData);
    
    return {
      id: docRef.id,
      ...invitationData,
      code
    };
  } catch (error) {
    console.error('Error creating couple invitation:', error);
    throw error;
  }
};

// Get couple invitation by code
export const getCoupleInvitationByCode = async (code) => {
  try {
    const q = query(
      collection(db, 'coupleInvitations'), 
      where('code', '==', code.toUpperCase()),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    // Check if invitation is expired
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();
    
    if (now > expiresAt) {
      // Mark as expired
      await updateDoc(doc.ref, { status: 'expired' });
      return null;
    }

    return {
      id: doc.id,
      ...data
    };
  } catch (error) {
    console.error('Error getting couple invitation:', error);
    throw error;
  }
};

// Accept couple invitation and create couple
export const acceptCoupleInvitation = async (invitationId, acceptingUserId, acceptingUserName) => {
  try {
    // Get the invitation
    const invitationRef = doc(db, 'coupleInvitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitationData = invitationDoc.data();
    
    if (invitationData.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    // Create the couple document
    const coupleData = {
      user1: {
        id: invitationData.createdBy,
        name: invitationData.createdByName,
        joinedAt: invitationData.createdAt
      },
      user2: {
        id: acceptingUserId,
        name: acceptingUserName,
        joinedAt: serverTimestamp()
      },
      createdAt: serverTimestamp(),
      status: 'active'
    };

    const coupleRef = await addDoc(collection(db, 'couples'), coupleData);
    const coupleId = coupleRef.id;

    // Update both users' profiles with coupleId
    await updateUserCoupleId(invitationData.createdBy, coupleId);
    await updateUserCoupleId(acceptingUserId, coupleId);

    // Mark invitation as accepted
    await updateDoc(invitationRef, { 
      status: 'accepted',
      acceptedBy: acceptingUserId,
      acceptedAt: serverTimestamp(),
      coupleId: coupleId
    });

    return {
      coupleId,
      couple: {
        id: coupleId,
        ...coupleData
      }
    };
  } catch (error) {
    console.error('Error accepting couple invitation:', error);
    throw error;
  }
};

// Update user profile with coupleId
const updateUserCoupleId = async (userId, coupleId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      coupleId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user coupleId:', error);
    throw error;
  }
};

// Get couple data by ID
export const getCoupleData = async (coupleId) => {
  try {
    const coupleRef = doc(db, 'couples', coupleId);
    const coupleDoc = await getDoc(coupleRef);
    
    if (!coupleDoc.exists()) {
      return null;
    }

    return {
      id: coupleDoc.id,
      ...coupleDoc.data()
    };
  } catch (error) {
    console.error('Error getting couple data:', error);
    throw error;
  }
};

// Subscribe to couple data changes
export const subscribeToCoupleData = (coupleId, callback) => {
  const coupleRef = doc(db, 'couples', coupleId);
  
  return onSnapshot(coupleRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in couple subscription:', error);
    callback(null);
  });
};

// Disconnect couple (break up)
export const disconnectCouple = async (coupleId, userId) => {
  try {
    // Get couple data first
    const coupleData = await getCoupleData(coupleId);
    
    if (!coupleData) {
      throw new Error('Couple not found');
    }

    // Remove coupleId from both users
    await updateUserCoupleId(coupleData.user1.id, null);
    await updateUserCoupleId(coupleData.user2.id, null);

    // Update couple status to disconnected
    const coupleRef = doc(db, 'couples', coupleId);
    await updateDoc(coupleRef, {
      status: 'disconnected',
      disconnectedBy: userId,
      disconnectedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error disconnecting couple:', error);
    throw error;
  }
};

// Get user's pending invitations (sent by them)
export const getUserPendingInvitations = async (userId) => {
  try {
    const q = query(
      collection(db, 'coupleInvitations'),
      where('createdBy', '==', userId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const invitations = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if expired
      const now = new Date();
      const expiresAt = data.expiresAt.toDate();
      
      if (now <= expiresAt) {
        invitations.push({
          id: doc.id,
          ...data
        });
      }
    });

    return invitations;
  } catch (error) {
    console.error('Error getting user pending invitations:', error);
    throw error;
  }
};

// Cancel couple invitation
export const cancelCoupleInvitation = async (invitationId) => {
  try {
    const invitationRef = doc(db, 'coupleInvitations', invitationId);
    await updateDoc(invitationRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error cancelling couple invitation:', error);
    throw error;
  }
};