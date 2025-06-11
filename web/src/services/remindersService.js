import { backendApi } from './backendApi';
import * as firebaseReminders from './firebase';

/**
 * Hybrid Reminders Service that can use either Firebase or Backend API
 * This service provides a unified interface for reminders operations
 */

// Configuration for service selection
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true';
const FALLBACK_TO_FIREBASE = import.meta.env.VITE_FALLBACK_TO_FIREBASE !== 'false';

class RemindersService {
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
   * Create a new reminder
   */
  async createReminder(reminderData) {
    const backendOperation = () => backendApi.createReminder(reminderData);
    const firebaseOperation = () => firebaseReminders.createReminder(reminderData);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'createReminder');
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(reminderId, updateData) {
    const backendOperation = () => backendApi.updateReminder(reminderId, updateData);
    const firebaseOperation = () => firebaseReminders.updateReminder(reminderId, updateData);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'updateReminder');
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId) {
    const backendOperation = () => backendApi.deleteReminder(reminderId);
    const firebaseOperation = () => firebaseReminders.deleteReminder(reminderId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'deleteReminder');
  }

  /**
   * Get a specific reminder by ID
   */
  async getReminderById(reminderId) {
    const backendOperation = () => backendApi.getReminderById(reminderId);
    const firebaseOperation = () => firebaseReminders.getReminderById(reminderId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getReminderById');
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId) {
    const backendOperation = () => backendApi.completeReminder(reminderId);
    const firebaseOperation = () => firebaseReminders.completeReminder(reminderId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'completeReminder');
  }

  /**
   * Mark reminder as uncompleted
   */
  async uncompleteReminder(reminderId) {
    const backendOperation = async () => {
      // Backend doesn't have uncomplete endpoint yet, simulate with update
      const result = await backendApi.updateReminder(reminderId, { 
        completed: false, 
        completedAt: null 
      });
      return result;
    };
    const firebaseOperation = () => firebaseReminders.uncompleteReminder(reminderId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'uncompleteReminder');
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId, snoozeData) {
    const backendOperation = () => backendApi.snoozeReminder(reminderId, snoozeData);
    const firebaseOperation = async () => {
      // Firebase doesn't have snooze endpoint, simulate with update
      const newDueDate = new Date(Date.now() + (snoozeData.minutes || 15) * 60 * 1000);
      return firebaseReminders.updateReminder(reminderId, { 
        dueDate: newDueDate,
        snoozedCount: (snoozeData.snoozedCount || 0) + 1
      });
    };
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'snoozeReminder');
  }

  /**
   * Get user's personal reminders
   */
  async getUserPersonalReminders(userId, includeCompleted = false) {
    const backendOperation = async () => {
      const params = { 
        type: firebaseReminders.REMINDER_TYPES.PERSONAL,
        includeCompleted 
      };
      const response = await backendApi.getReminders(params);
      return response.data || response;
    };
    
    const firebaseOperation = () => firebaseReminders.getUserPersonalReminders(userId, includeCompleted);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getUserPersonalReminders');
  }

  /**
   * Get couple's shared reminders
   */
  async getCoupleReminders(coupleId, includeCompleted = false) {
    const backendOperation = async () => {
      const params = { 
        coupleId,
        type: firebaseReminders.REMINDER_TYPES.COUPLE,
        includeCompleted 
      };
      const response = await backendApi.getReminders(params);
      return response.data || response;
    };
    
    const firebaseOperation = () => firebaseReminders.getCoupleReminders(coupleId, includeCompleted);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getCoupleReminders');
  }

  /**
   * Get upcoming reminders (due within next 7 days)
   */
  async getUpcomingReminders(userId, coupleId) {
    const backendOperation = async () => {
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const params = { 
        upcoming: true,
        endDate: endDate.toISOString(),
        coupleId
      };
      const response = await backendApi.getReminders(params);
      return response.data || response;
    };
    
    const firebaseOperation = () => firebaseReminders.getUpcomingReminders(userId, coupleId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getUpcomingReminders');
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(userId, coupleId) {
    const backendOperation = async () => {
      const params = { 
        overdue: true,
        coupleId
      };
      const response = await backendApi.getReminders(params);
      return response.data || response;
    };
    
    const firebaseOperation = () => firebaseReminders.getOverdueReminders(userId, coupleId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getOverdueReminders');
  }

  /**
   * Get reminders statistics
   */
  async getRemindersStats(userId, coupleId) {
    const backendOperation = async () => {
      // Backend might need separate endpoint for stats, for now calculate from reminders
      const personalReminders = await this.getUserPersonalReminders(userId, true);
      const coupleReminders = coupleId ? await this.getCoupleReminders(coupleId, true) : [];
      
      const now = new Date();
      
      const stats = {
        personal: {
          total: personalReminders.data?.length || 0,
          completed: personalReminders.data?.filter(r => r.completed).length || 0,
          pending: personalReminders.data?.filter(r => !r.completed).length || 0,
          overdue: personalReminders.data?.filter(r => !r.completed && new Date(r.dueDate) < now).length || 0,
        },
        couple: {
          total: coupleReminders.data?.length || 0,
          completed: coupleReminders.data?.filter(r => r.completed).length || 0,
          pending: coupleReminders.data?.filter(r => !r.completed).length || 0,
          overdue: coupleReminders.data?.filter(r => !r.completed && new Date(r.dueDate) < now).length || 0,
        },
      };
      
      return stats;
    };
    
    const firebaseOperation = () => firebaseReminders.getRemindersStats(userId, coupleId);
    
    return this.executeWithFallback(backendOperation, firebaseOperation, 'getRemindersStats');
  }

  // ============= REAL-TIME SUBSCRIPTIONS =============
  // Note: Backend API doesn't support real-time subscriptions yet
  // These methods will always use Firebase for now

  /**
   * Subscribe to user's personal reminders
   */
  subscribeToUserPersonalReminders(userId, includeCompleted, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToUserPersonalReminders');
    return firebaseReminders.subscribeToUserPersonalReminders(userId, includeCompleted, callback);
  }

  /**
   * Subscribe to couple's reminders
   */
  subscribeToCoupleReminders(coupleId, includeCompleted, callback) {
    console.log('Using Firebase for real-time subscription: subscribeToCoupleReminders');
    return firebaseReminders.subscribeToCoupleReminders(coupleId, includeCompleted, callback);
  }

  // ============= NOTIFICATION SERVICE INTEGRATION =============

  /**
   * Initialize notification service for reminders
   */
  initializeNotificationService(service) {
    return firebaseReminders.initializeNotificationService(service);
  }

  // ============= UTILITY METHODS =============

  /**
   * Force switch to backend mode
   */
  forceBackendMode() {
    this.useBackend = true;
    console.log('Reminders service switched to backend mode');
  }

  /**
   * Force switch to Firebase mode
   */
  forceFirebaseMode() {
    this.useBackend = false;
    console.log('Reminders service switched to Firebase mode');
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
export const remindersService = new RemindersService();

// Re-export constants for backward compatibility
export {
  REMINDER_TYPES,
  REMINDER_PRIORITIES,
  REMINDER_CATEGORIES,
  RECURRING_TYPES,
  getReminderCategoryDisplayInfo,
  getPriorityDisplayInfo,
  getRecurringDisplayInfo,
  getPriorityColor,
  getPriorityName,
  getRecurringName,
  initializeNotificationService,
} from './firebase';

export default remindersService;
