import { backendApi } from './backendApi';
import * as firebaseNotes from './firebase';

/**
 * Hybrid Notes Service that can use either Firebase or Backend API
 * This service provides a unified interface for notes operations
 */

// Configuration for service selection
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true';
const FALLBACK_TO_FIREBASE = import.meta.env.VITE_FALLBACK_TO_FIREBASE !== 'false';

class NotesService {
  constructor() {
    this.useBackend = USE_BACKEND_API;
    this.fallbackEnabled = FALLBACK_TO_FIREBASE;
  }

  /**
   * Check if backend is available and switch service accordingly
   */
  async checkBackendAvailability() {
    if (!this.useBackend) return false;
    
    try {
      const isAvailable = await backendApi.isBackendAvailable();
      if (!isAvailable && this.fallbackEnabled) {
        console.warn('Backend API unavailable, falling back to Firebase');
        return false;
      }
      return isAvailable;
    } catch (error) {
      console.error('Error checking backend availability:', error);
      if (this.fallbackEnabled) {
        console.warn('Backend check failed, falling back to Firebase');
        return false;
      }
      throw error;
    }
  }

  /**
   * Execute operation with fallback support
   */
  async executeWithFallback(backendOperation, firebaseOperation, operationName) {
    const shouldUseBackend = await this.checkBackendAvailability();
    
    if (shouldUseBackend) {
      try {
        console.log(`Executing ${operationName} via Backend API`);
        const result = await backendOperation();
        return { source: 'backend', data: result };
      } catch (error) {
        console.error(`Backend ${operationName} failed:`, error);
        
        if (this.fallbackEnabled) {
          console.log(`Falling back to Firebase for ${operationName}`);
          const result = await firebaseOperation();
          return { source: 'firebase', data: result };
        }
        throw error;
      }
    } else {
      console.log(`Executing ${operationName} via Firebase`);
      const result = await firebaseOperation();
      return { source: 'firebase', data: result };
    }
  }

  /**
   * Create a new note
   */
  async createNote(noteData) {
    const backendOperation = () => backendApi.createNote(noteData);
    const firebaseOperation = () => firebaseNotes.createNote(noteData);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'createNote');
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId, updateData) {
    const backendOperation = () => backendApi.updateNote(noteId, updateData);
    const firebaseOperation = () => firebaseNotes.updateNote(noteId, updateData);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'updateNote');
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId) {
    const backendOperation = () => backendApi.deleteNote(noteId);
    const firebaseOperation = () => firebaseNotes.deleteNote(noteId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'deleteNote');
  }

  /**
   * Get a specific note by ID
   */
  async getNoteById(noteId) {
    const backendOperation = () => backendApi.getNoteById(noteId);
    const firebaseOperation = () => firebaseNotes.getNoteById(noteId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getNoteById');
  }

  /**
   * Get user's private notes
   */
  async getUserPrivateNotes(userId, category = null) {
    const backendOperation = async () => {
      const params = { category };
      const response = await backendApi.getNotes(params);
      // Transform backend response to match Firebase format
      return response.data || response;
    };
    
    const firebaseOperation = () => firebaseNotes.getUserPrivateNotes(userId, category);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getUserPrivateNotes');
  }

  /**
   * Get couple's shared notes
   */
  async getCoupleSharedNotes(coupleId, category = null) {
    const backendOperation = async () => {
      const params = { coupleId, category };
      const response = await backendApi.getNotes(params);
      // Transform backend response to match Firebase format
      return response.data || response;
    };
    
    const firebaseOperation = () => firebaseNotes.getCoupleSharedNotes(coupleId, category);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getCoupleSharedNotes');
  }

  /**
   * Search notes
   */
  async searchNotes(userId, coupleId, searchTerm, noteType = null) {
    const backendOperation = async () => {
      const params = { 
        search: searchTerm,
        coupleId: noteType === firebaseNotes.NOTE_TYPES.SHARED ? coupleId : undefined
      };
      const response = await backendApi.getNotes(params);
      return response.data || response;
    };
    
    const firebaseOperation = () => firebaseNotes.searchNotes(userId, coupleId, searchTerm, noteType);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'searchNotes');
  }

  /**
   * Get notes count by category for user
   */
  async getUserNotesCountByCategory(userId) {
    const backendOperation = async () => {
      // Backend might need separate endpoint for counts, for now use regular notes
      const response = await backendApi.getNotes({ limit: 1000 });
      const notes = response.data || response;
      
      // Count by category
      const counts = {};
      Object.values(firebaseNotes.NOTE_CATEGORIES).forEach(category => {
        counts[category] = notes.filter(note => note.category === category).length;
      });
      
      return counts;
    };
    
    const firebaseOperation = () => firebaseNotes.getUserNotesCountByCategory(userId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getUserNotesCountByCategory');
  }

  /**
   * Get shared notes count by category for couple
   */
  async getCoupleNotesCountByCategory(coupleId) {
    const backendOperation = async () => {
      // Backend might need separate endpoint for counts, for now use regular notes
      const response = await backendApi.getNotes({ coupleId, limit: 1000 });
      const notes = response.data || response;
      
      // Count by category
      const counts = {};
      Object.values(firebaseNotes.NOTE_CATEGORIES).forEach(category => {
        counts[category] = notes.filter(note => note.category === category).length;
      });
      
      return counts;
    };
    
    const firebaseOperation = () => firebaseNotes.getCoupleNotesCountByCategory(coupleId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getCoupleNotesCountByCategory');
  }

  // ============= REAL-TIME SUBSCRIPTIONS =============
  // Note: Backend API doesn't support real-time subscriptions yet
  // These methods will always use Firebase for now

  /**
   * Subscribe to user's private notes
   */
  subscribeToUserPrivateNotes(userId, category, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToUserPrivateNotes');
    return firebaseNotes.subscribeToUserPrivateNotes(userId, category, callback);
  }

  /**
   * Subscribe to couple's shared notes
   */
  subscribeToCoupleSharedNotes(coupleId, category, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToCoupleSharedNotes');
    return firebaseNotes.subscribeToCoupleSharedNotes(coupleId, category, callback);
  }

  /**
   * Subscribe to user's notes by category
   */
  subscribeToUserNotesByCategory(userId, category, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToUserNotesByCategory');
    return firebaseNotes.subscribeToUserNotesByCategory(userId, category, callback);
  }

  /**
   * Subscribe to couple's notes by category
   */
  subscribeToCoupleNotesByCategory(coupleId, category, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToCoupleNotesByCategory');
    return firebaseNotes.subscribeToCoupleNotesByCategory(coupleId, category, callback);
  }

  // ============= UTILITY METHODS =============

  /**
   * Force switch to backend mode
   */
  forceBackendMode() {
    this.useBackend = true;
    console.log('Notes service switched to backend mode');
  }

  /**
   * Force switch to Firebase mode
   */
  forceFirebaseMode() {
    this.useBackend = false;
    console.log('Notes service switched to Firebase mode');
  }

  /**
   * Get current service mode
   */
  getCurrentMode() {
    return {
      useBackend: this.useBackend,
      fallbackEnabled: this.fallbackEnabled,
    };
  }
}

// Create and export singleton instance
export const notesService = new NotesService();

// Re-export constants for backward compatibility
export {
  NOTE_CATEGORIES,
  NOTE_TYPES,
  getNoteCategoryDisplayInfo,
} from './firebase';

export default notesService;
