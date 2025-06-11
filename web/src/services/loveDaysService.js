import { backendApi } from './backendApi';
import * as firebaseLoveDays from './firebase';

/**
 * Hybrid Love Days Service that can use either Firebase or Backend API
 * This service provides a unified interface for love days operations
 */

// Configuration for service selection
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true';
const FALLBACK_TO_FIREBASE = import.meta.env.VITE_FALLBACK_TO_FIREBASE !== 'false';

class LoveDaysService {
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
   * Get love days data
   */
  async getLoveDays() {
    const backendOperation = () => backendApi.getLoveDays();
    const firebaseOperation = async () => {
      // Firebase requires coupleId, but backend handles this automatically
      // For now, throw error if no coupleId available
      throw new Error('Firebase getLoveDays requires coupleId parameter');
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getLoveDays');
  }

  /**
   * Get love days for specific couple (Firebase compatibility)
   */
  async getLoveDaysForCouple(coupleId) {
    const backendOperation = () => backendApi.getLoveDays();
    const firebaseOperation = () => firebaseLoveDays.getLoveDays(coupleId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getLoveDaysForCouple');
  }

  /**
   * Create a new love day
   */
  async createLoveDay(loveDayData) {
    const backendOperation = () => backendApi.createLoveDay(loveDayData);
    const firebaseOperation = () => firebaseLoveDays.initializeLoveDays(
      loveDayData.coupleId,
      loveDayData.startDate || loveDayData.date
    );
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'createLoveDay');
  }

  /**
   * Update an existing love day
   */
  async updateLoveDay(loveDayId, updateData) {
    const backendOperation = () => backendApi.updateLoveDay(loveDayId, updateData);
    const firebaseOperation = () => {
      if (updateData.startDate) {
        return firebaseLoveDays.updateLoveDaysStartDate(loveDayId, updateData.startDate);
      } else {
        throw new Error('Firebase updateLoveDay only supports startDate updates');
      }
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'updateLoveDay');
  }

  /**
   * Delete a love day
   */
  async deleteLoveDay(loveDayId) {
    const backendOperation = () => backendApi.deleteLoveDay(loveDayId);
    const firebaseOperation = () => {
      throw new Error('Firebase deleteLoveDay not implemented');
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'deleteLoveDay');
  }

  /**
   * Initialize love days for a couple
   */
  async initializeLoveDays(coupleId, startDate) {
    const backendOperation = () => backendApi.createLoveDay({ 
      coupleId, 
      startDate,
      title: 'Ngày bắt đầu yêu',
      type: 'start_date'
    });
    const firebaseOperation = () => firebaseLoveDays.initializeLoveDays(coupleId, startDate);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'initializeLoveDays');
  }

  /**
   * Update love days start date
   */
  async updateLoveDaysStartDate(coupleId, newStartDate) {
    const backendOperation = async () => {
      // Backend might need a specific endpoint or find the start date love day to update
      const loveDays = await backendApi.getLoveDays();
      const startDateLoveDay = loveDays.data?.find(day => day.type === 'start_date');
      
      if (startDateLoveDay) {
        return backendApi.updateLoveDay(startDateLoveDay.id, { date: newStartDate });
      } else {
        return backendApi.createLoveDay({
          title: 'Ngày bắt đầu yêu',
          date: newStartDate,
          type: 'start_date'
        });
      }
    };
    const firebaseOperation = () => firebaseLoveDays.updateLoveDaysStartDate(coupleId, newStartDate);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'updateLoveDaysStartDate');
  }

  // ============= REAL-TIME SUBSCRIPTIONS =============
  // Note: Backend API doesn't support real-time subscriptions yet
  // These methods will always use Firebase for now

  /**
   * Subscribe to love days updates
   */
  subscribeToLoveDays(coupleId, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToLoveDays');
    return firebaseLoveDays.subscribeToLoveDays(coupleId, callback);
  }

  // ============= UTILITY METHODS =============

  /**
   * Calculate days together
   */
  calculateDaysTogether(startDate) {
    return firebaseLoveDays.calculateDaysTogether(startDate);
  }

  /**
   * Calculate months together
   */
  calculateMonthsTogether(startDate) {
    return firebaseLoveDays.calculateMonthsTogether(startDate);
  }

  /**
   * Calculate years together
   */
  calculateYearsTogether(startDate) {
    return firebaseLoveDays.calculateYearsTogether(startDate);
  }

  /**
   * Get milestone information
   */
  getLoveMilestones(daysTogether) {
    return firebaseLoveDays.getLoveMilestones(daysTogether);
  }

  /**
   * Get next milestone
   */
  getNextMilestone(daysTogether) {
    return firebaseLoveDays.getNextMilestone(daysTogether);
  }

  /**
   * Format love duration
   */
  formatLoveDuration(daysTogether) {
    return firebaseLoveDays.formatLoveDuration(daysTogether);
  }

  /**
   * Force switch to backend mode
   */
  forceBackendMode() {
    this.useBackend = true;
    console.log('Love days service switched to backend mode');
  }

  /**
   * Force switch to Firebase mode
   */
  forceFirebaseMode() {
    this.useBackend = false;
    console.log('Love days service switched to Firebase mode');
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
export const loveDaysService = new LoveDaysService();

// Re-export utility functions for backward compatibility
export {
  calculateDaysTogether,
  calculateMonthsTogether,
  calculateYearsTogether,
  getLoveMilestones,
  getNextMilestone,
  formatLoveDuration,
} from './firebase';

export default loveDaysService;