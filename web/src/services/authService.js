import { backendApi } from './backendApi';
import * as firebaseAuth from './firebase';

/**
 * Hybrid Auth Service that can use either Firebase or Backend API
 * This service provides a unified interface for authentication operations
 */

// Configuration for service selection
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true';
const FALLBACK_TO_FIREBASE = import.meta.env.VITE_FALLBACK_TO_FIREBASE !== 'false';

class AuthService {
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
   * Get user profile
   */
  async getUserProfile() {
    const backendOperation = () => backendApi.getUserProfile();
    const firebaseOperation = () => {
      // Firebase auth doesn't have a direct getUserProfile, would need to get from Firestore
      throw new Error('Firebase getUserProfile not implemented');
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getUserProfile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    const backendOperation = () => backendApi.updateUserProfile(profileData);
    const firebaseOperation = () => {
      // Firebase auth doesn't have direct profile update, would need Firestore
      throw new Error('Firebase updateUserProfile not implemented');
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'updateUserProfile');
  }

  /**
   * Verify token (health check)
   */
  async verifyToken() {
    const backendOperation = () => backendApi.verifyToken();
    const firebaseOperation = async () => {
      // For Firebase, just check if user is authenticated
      const user = firebaseAuth.auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return { valid: true, token };
      } else {
        throw new Error('User not authenticated');
      }
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'verifyToken');
  }

  // ============= FIREBASE AUTH PASSTHROUGH =============
  // These methods directly use Firebase auth as it's the primary auth provider

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email, password) {
    console.log('Using Firebase for authentication: signIn');
    return firebaseAuth.signIn(email, password);
  }

  /**
   * Create user with email and password
   */
  async createUserWithEmailAndPassword(email, password, displayName) {
    console.log('Using Firebase for authentication: signUp');
    return firebaseAuth.signUp(email, password, displayName);
  }

  /**
   * Sign out
   */
  async signOut() {
    console.log('Using Firebase for authentication: logOut');
    return firebaseAuth.logOut();
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email) {
    console.log('Using Firebase for authentication: sendPasswordResetEmail');
    // Note: This might need to be implemented in Firebase module if not already available
    throw new Error('sendPasswordResetEmail not implemented in Firebase module');
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword) {
    console.log('Using Firebase for authentication: updatePassword');
    // Note: This might need to be implemented in Firebase module if not already available
    throw new Error('updatePassword not implemented in Firebase module');
  }

  /**
   * Update user email
   */
  async updateEmail(newEmail) {
    console.log('Using Firebase for authentication: updateEmail');
    // Note: This might need to be implemented in Firebase module if not already available
    throw new Error('updateEmail not implemented in Firebase module');
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return firebaseAuth.auth.currentUser;
  }

  /**
   * On auth state changed
   */
  onAuthStateChanged(callback) {
    return firebaseAuth.onAuthStateChanged(callback);
  }

  // ============= UTILITY METHODS =============

  /**
   * Force switch to backend mode
   */
  forceBackendMode() {
    this.useBackend = true;
    console.log('Auth service switched to backend mode');
  }

  /**
   * Force switch to Firebase mode
   */
  forceFirebaseMode() {
    this.useBackend = false;
    console.log('Auth service switched to Firebase mode');
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
export const authService = new AuthService();

// Re-export Firebase auth methods for backward compatibility
export {
  auth,
  signIn,
  signUp,
  logOut,
  onAuthStateChange as onAuthStateChanged,
} from './firebase';

export default authService;
