import { backendApi } from './backendApi';
import * as firebaseCouples from './firebase';

/**
 * Hybrid Couples Service that can use either Firebase or Backend API
 * This service provides a unified interface for couples operations
 */

// Configuration for service selection
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true';
const FALLBACK_TO_FIREBASE = import.meta.env.VITE_FALLBACK_TO_FIREBASE !== 'false';

class CouplesService {
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
   * Get couple profile
   */
  async getCoupleProfile() {
    const backendOperation = () => backendApi.getCoupleProfile();
    const firebaseOperation = async () => {
      // Firebase doesn't have a direct profile endpoint, need to implement
      // For now, return null to indicate no profile exists
      return null;
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getCoupleProfile');
  }

  /**
   * Update couple profile
   */
  async updateCoupleProfile(coupleData) {
    const backendOperation = () => backendApi.updateCoupleProfile(coupleData);
    const firebaseOperation = async () => {
      // Firebase doesn't have direct profile update, could implement with couple document
      throw new Error('Profile update not implemented for Firebase couples service');
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'updateCoupleProfile');
  }

  /**
   * Send couple invitation
   */
  async sendCoupleInvitation(invitationData) {
    const backendOperation = () => backendApi.sendCoupleInvitation(invitationData);
    const firebaseOperation = () => firebaseCouples.createCoupleInvitation(
      invitationData.userId || invitationData.createdBy, 
      invitationData.userDisplayName || invitationData.createdByName
    );
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'sendCoupleInvitation');
  }

  /**
   * Accept couple invitation
   */
  async acceptCoupleInvitation(invitationData) {
    const backendOperation = () => backendApi.acceptCoupleInvitation(invitationData);
    const firebaseOperation = () => firebaseCouples.acceptCoupleInvitation(
      invitationData.invitationId,
      invitationData.acceptingUserId,
      invitationData.acceptingUserName
    );
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'acceptCoupleInvitation');
  }

  /**
   * Get couple data
   */
  async getCoupleData(coupleId = null) {
    const backendOperation = () => backendApi.getCoupleData();
    const firebaseOperation = () => {
      if (coupleId) {
        return firebaseCouples.getCoupleData(coupleId);
      } else {
        throw new Error('Firebase getCoupleData requires coupleId parameter');
      }
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getCoupleData');
  }

  /**
   * Get couple invitation by code
   */
  async getCoupleInvitationByCode(code) {
    const backendOperation = async () => {
      // Backend doesn't have this endpoint yet, simulate
      throw new Error('Backend getCoupleInvitationByCode not implemented');
    };
    const firebaseOperation = () => firebaseCouples.getCoupleInvitationByCode(code);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getCoupleInvitationByCode');
  }

  /**
   * Generate couple code
   */
  generateCoupleCode() {
    return firebaseCouples.generateCoupleCode();
  }

  /**
   * Get user's pending invitations
   */
  async getUserPendingInvitations(userId) {
    const backendOperation = async () => {
      // Backend doesn't have this endpoint yet, simulate
      throw new Error('Backend getUserPendingInvitations not implemented');
    };
    const firebaseOperation = () => firebaseCouples.getUserPendingInvitations(userId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getUserPendingInvitations');
  }

  /**
   * Cancel couple invitation
   */
  async cancelCoupleInvitation(invitationId) {
    const backendOperation = async () => {
      // Backend doesn't have this endpoint yet, simulate
      throw new Error('Backend cancelCoupleInvitation not implemented');
    };
    const firebaseOperation = () => firebaseCouples.cancelCoupleInvitation(invitationId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'cancelCoupleInvitation');
  }

  /**
   * Disconnect couple
   */
  async disconnectCouple(coupleId, userId) {
    const backendOperation = async () => {
      // Backend doesn't have this endpoint yet, simulate
      throw new Error('Backend disconnectCouple not implemented');
    };
    const firebaseOperation = () => firebaseCouples.disconnectCouple(coupleId, userId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'disconnectCouple');
  }

  // ============= REAL-TIME SUBSCRIPTIONS =============
  // Note: Backend API doesn't support real-time subscriptions yet
  // These methods will always use Firebase for now

  /**
   * Subscribe to couple data changes
   */
  subscribeToCoupleData(coupleId, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToCoupleData');
    return firebaseCouples.subscribeToCoupleData(coupleId, callback);
  }

  // ============= UTILITY METHODS =============

  /**
   * Force switch to backend mode
   */
  forceBackendMode() {
    this.useBackend = true;
    console.log('Couples service switched to backend mode');
  }

  /**
   * Force switch to Firebase mode
   */
  forceFirebaseMode() {
    this.useBackend = false;
    console.log('Couples service switched to Firebase mode');
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
export const couplesService = new CouplesService();

// Re-export utility functions for backward compatibility
export {
  generateCoupleCode,
} from './firebase';

export default couplesService;