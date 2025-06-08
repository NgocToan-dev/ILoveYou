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
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

// Note categories
export const NOTE_CATEGORIES = {
  LOVE_LETTERS: 'loveLetters',
  MEMORIES: 'memories',
  DREAMS: 'dreams',
  GRATITUDE: 'gratitude'
};

// Note types
export const NOTE_TYPES = {
  PRIVATE: 'private',
  SHARED: 'shared'
};

// Create a new note
export const createNote = async (noteData) => {
  try {
    const note = {
      ...noteData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'notes'), note);
    
    return {
      id: docRef.id,
      ...note
    };
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Update an existing note
export const updateNote = async (noteId, updateData) => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId) => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Get a single note by ID
export const getNoteById = async (noteId) => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);
    
    if (!noteDoc.exists()) {
      return null;
    }

    return {
      id: noteDoc.id,
      ...noteDoc.data()
    };
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

// Get user's private notes
export const getUserPrivateNotes = async (userId, category = null) => {
  try {
    let q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      where('type', '==', NOTE_TYPES.PRIVATE),
      orderBy('updatedAt', 'desc')
    );

    if (category) {
      q = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('type', '==', NOTE_TYPES.PRIVATE),
        where('category', '==', category),
        orderBy('updatedAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const notes = [];

    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return notes;
  } catch (error) {
    console.error('Error getting user private notes:', error);
    throw error;
  }
};

// Get couple's shared notes
export const getCoupleSharedNotes = async (coupleId, category = null) => {
  try {
    let q = query(
      collection(db, 'notes'),
      where('coupleId', '==', coupleId),
      where('type', '==', NOTE_TYPES.SHARED),
      orderBy('updatedAt', 'desc')
    );

    if (category) {
      q = query(
        collection(db, 'notes'),
        where('coupleId', '==', coupleId),
        where('type', '==', NOTE_TYPES.SHARED),
        where('category', '==', category),
        orderBy('updatedAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const notes = [];

    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return notes;
  } catch (error) {
    console.error('Error getting couple shared notes:', error);
    throw error;
  }
};

// Subscribe to user's private notes
export const subscribeToUserPrivateNotes = (userId, category, callback) => {
  let q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    where('type', '==', NOTE_TYPES.PRIVATE),
    orderBy('updatedAt', 'desc')
  );

  if (category) {
    q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      where('type', '==', NOTE_TYPES.PRIVATE),
      where('category', '==', category),
      orderBy('updatedAt', 'desc')
    );
  }

  return onSnapshot(q, (querySnapshot) => {
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(notes);
  }, (error) => {
    console.error('Error in private notes subscription:', error);
    callback([]);
  });
};

// Subscribe to couple's shared notes
export const subscribeToCoupleSharedNotes = (coupleId, category, callback) => {
  let q = query(
    collection(db, 'notes'),
    where('coupleId', '==', coupleId),
    where('type', '==', NOTE_TYPES.SHARED),
    orderBy('updatedAt', 'desc')
  );

  if (category) {
    q = query(
      collection(db, 'notes'),
      where('coupleId', '==', coupleId),
      where('type', '==', NOTE_TYPES.SHARED),
      where('category', '==', category),
      orderBy('updatedAt', 'desc')
    );
  }

  return onSnapshot(q, (querySnapshot) => {
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(notes);
  }, (error) => {
    console.error('Error in shared notes subscription:', error);
    callback([]);
  });
};

// Get notes count by category for user
export const getUserNotesCountByCategory = async (userId) => {
  try {
    const counts = {};
    
    for (const category of Object.values(NOTE_CATEGORIES)) {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('type', '==', NOTE_TYPES.PRIVATE),
        where('category', '==', category)
      );
      
      const querySnapshot = await getDocs(q);
      counts[category] = querySnapshot.size;
    }
    
    return counts;
  } catch (error) {
    console.error('Error getting notes count:', error);
    throw error;
  }
};

// Get shared notes count by category for couple
export const getCoupleNotesCountByCategory = async (coupleId) => {
  try {
    const counts = {};
    
    for (const category of Object.values(NOTE_CATEGORIES)) {
      const q = query(
        collection(db, 'notes'),
        where('coupleId', '==', coupleId),
        where('type', '==', NOTE_TYPES.SHARED),
        where('category', '==', category)
      );
      
      const querySnapshot = await getDocs(q);
      counts[category] = querySnapshot.size;
    }
    
    return counts;
  } catch (error) {
    console.error('Error getting couple notes count:', error);
    throw error;
  }
};

// Search notes
export const searchNotes = async (userId, coupleId, searchTerm, noteType = null) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that searches in title and content
    // For production, consider using Algolia or similar service
    
    const notes = [];
    
    // Get user's private notes if noteType is null or private
    if (!noteType || noteType === NOTE_TYPES.PRIVATE) {
      const privateNotes = await getUserPrivateNotes(userId);
      notes.push(...privateNotes);
    }
    
    // Get couple's shared notes if noteType is null or shared and coupleId exists
    if ((!noteType || noteType === NOTE_TYPES.SHARED) && coupleId) {
      const sharedNotes = await getCoupleSharedNotes(coupleId);
      notes.push(...sharedNotes);
    }
    
    // Filter notes by search term
    const searchTermLower = searchTerm.toLowerCase();
    const filteredNotes = notes.filter(note => 
      note.title?.toLowerCase().includes(searchTermLower) ||
      note.content?.toLowerCase().includes(searchTermLower)
    );
    
    return filteredNotes;
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
};

// Get category display info
export const getCategoryDisplayInfo = (category) => {
  const categoryInfo = {
    [NOTE_CATEGORIES.LOVE_LETTERS]: {
      name: 'Thư tình',
      icon: 'mail',
      color: '#E91E63',
      description: 'Những lời yêu thương ngọt ngào'
    },
    [NOTE_CATEGORIES.MEMORIES]: {
      name: 'Kỷ niệm',
      icon: 'camera',
      color: '#8E24AA',
      description: 'Lưu giữ những khoảnh khắc đáng nhớ'
    },
    [NOTE_CATEGORIES.DREAMS]: {
      name: 'Ước mơ',
      icon: 'star',
      color: '#FF6F00',
      description: 'Những giấc mơ và kế hoạch tương lai'
    },
    [NOTE_CATEGORIES.GRATITUDE]: {
      name: 'Biết ơn',
      icon: 'heart',
      color: '#4CAF50',
      description: 'Những điều biết ơn và trân trọng'
    }
  };
  
  return categoryInfo[category] || categoryInfo[NOTE_CATEGORIES.LOVE_LETTERS];
};