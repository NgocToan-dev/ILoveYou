// React Hook for Notifications Management
// Phase 1: Service Worker Foundation Support
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import webNotificationsService from '../services/webNotifications';
import {
  sendTestNotification,
  sendReminderNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../services/firebaseFunctions';
import { updateReminder } from '@shared/services/firebase/reminders';
import { SNOOZE_DURATION } from '@shared/constants/notifications';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [supported, setSupported] = useState(false);
  const [fcmSupported, setFcmSupported] = useState(false);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();

  // Initialize notification status
  useEffect(() => {
    const initializeStatus = async () => {
      try {
        setLoading(true);
        
        // Wait a bit for the service to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const status = webNotificationsService.getPermissionStatus();
        setPermission(status.permission);
        setSupported(status.supported);
        setFcmSupported(status.fcmSupported);
        setServiceWorkerRegistered(status.serviceWorkerRegistered);
        setToken(status.fcmToken);
        
        setError(null);
      } catch (err) {
        console.error('Error initializing notification status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeStatus();
  }, []);

  // Set up event handlers for service worker messages
  useEffect(() => {
    const handleReminderComplete = (data) => {
      console.log('Reminder completed via notification:', data);
      // This will be used by parent components to update reminder state
    };

    const handleReminderSnooze = async (data) => {
      console.log('Reminder snoozed via notification:', data);
      
      try {
        const { reminderId, duration = SNOOZE_DURATION.DEFAULT } = data; // Sử dụng constants đồng nhất
        
        // Validate input
        if (!reminderId) {
          console.error('No reminder ID provided for snooze');
          return { success: false, error: 'No reminder ID provided' };
        }

        if (!user) {
          console.error('User not authenticated for snooze operation');
          return { success: false, error: 'User not authenticated' };
        }

        // Validate duration against defined constants
        const snoozeDuration = Math.max(
          SNOOZE_DURATION.MIN, 
          Math.min(SNOOZE_DURATION.MAX, parseInt(duration) || SNOOZE_DURATION.DEFAULT)
        );
        
        // Calculate new due date (current time + snooze duration in minutes)
        const newDueDate = new Date(Date.now() + snoozeDuration * 60 * 1000);
        
        console.log(`Snoozing reminder ${reminderId} for ${snoozeDuration} minutes until ${newDueDate.toLocaleString('vi-VN')}`);
        
        // Update reminder with new due date and additional snooze metadata
        const updateResult = await updateReminder(reminderId, {
          dueDate: newDueDate,
          snoozeUntil: newDueDate,
          snoozed: true,
          snoozeCount: (data.snoozeCount || 0) + 1,
          lastSnoozedAt: new Date(),
          lastSnoozeDuration: snoozeDuration
        });
        
        if (updateResult) {
          console.log('✅ Reminder snoozed successfully');
          
          // Notify service worker of successful snooze
          if (typeof webNotificationsService.sendResponse === 'function') {
            webNotificationsService.sendResponse('reminder_snooze_result', {
              success: true,
              reminderId,
              newDueDate: newDueDate.toISOString(),
              duration: snoozeDuration
            });
          }
          
          return { success: true, newDueDate, duration: snoozeDuration };
        } else {
          throw new Error('Failed to update reminder in database');
        }
        
      } catch (error) {
        console.error('❌ Error snoozing reminder:', error);
        
        // Notify service worker of failed snooze
        if (typeof webNotificationsService.sendResponse === 'function') {
          webNotificationsService.sendResponse('reminder_snooze_result', {
            success: false,
            error: error.message,
            reminderId: data.reminderId
          });
        }
        
        return { success: false, error: error.message };
      }
    };

    const handleAnalyticsEvent = (data) => {
      console.log('Analytics event from notification:', data);
      // This will be used for tracking notification interactions
    };

    // Register event handlers
    webNotificationsService.on('reminder_complete', handleReminderComplete);
    webNotificationsService.on('reminder_snooze', handleReminderSnooze);
    webNotificationsService.on('analytics_event', handleAnalyticsEvent);

    // Cleanup
    return () => {
      webNotificationsService.off('reminder_complete', handleReminderComplete);
      webNotificationsService.off('reminder_snooze', handleReminderSnooze);
      webNotificationsService.off('analytics_event', handleAnalyticsEvent);
    };
  }, [user]); // Add user dependency since handleReminderSnooze uses it

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await webNotificationsService.requestPermission();
      
      if (result.success) {
        setPermission('granted');
        setToken(result.token);
        
        // Update status after permission granted
        const status = webNotificationsService.getPermissionStatus();
        setFcmSupported(status.fcmSupported);
        setServiceWorkerRegistered(status.serviceWorkerRegistered);
        
        return { success: true, token: result.token };
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to request notification permission';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Show a reminder notification
  const showReminder = useCallback(async (reminder, options = {}) => {
    try {
      return await webNotificationsService.showReminderNotification(reminder, options);
    } catch (err) {
      console.error('Error showing reminder notification:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Schedule a reminder notification
  const scheduleReminder = useCallback(async (reminder) => {
    try {
      return await webNotificationsService.scheduleReminder(reminder);
    } catch (err) {
      console.error('Error scheduling reminder notification:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Update language preference
  const updateLanguage = useCallback((language) => {
    try {
      webNotificationsService.setLanguage(language);
    } catch (err) {
      console.error('Error updating notification language:', err);
    }
  }, []);

  // Test notification (local)
  const testNotification = useCallback(async () => {
    try {
      if (permission !== 'granted') {
        return { success: false, error: 'Permission not granted' };
      }
      
      return await webNotificationsService.testNotification();
    } catch (err) {
      console.error('Error testing notification:', err);
      return { success: false, error: err.message };
    }
  }, [permission]);
  // Test FCM notification via Firebase Functions
  const testFCMNotification = useCallback(async (language = 'vi') => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const isAvailable = supported && permission === 'granted';
      const fcmAvailable = isAvailable && fcmSupported && serviceWorkerRegistered;
      
      if (!fcmAvailable) {
        return { success: false, error: 'FCM not available' };
      }
      
      return await sendTestNotification(language);
    } catch (err) {
      console.error('Error testing FCM notification:', err);
      return { success: false, error: err.message };
    }
  }, [user, supported, permission, fcmSupported, serviceWorkerRegistered]);

  // Send reminder notification via Firebase Functions
  const sendReminder = useCallback(async (reminderId, language = 'vi') => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      return await sendReminderNotification(reminderId, language);
    } catch (err) {
      console.error('Error sending reminder notification:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Comprehensive test (both local and FCM)
  const comprehensiveTest = useCallback(async () => {
    try {
      if (permission !== 'granted') {
        return { success: false, error: 'Permission not granted' };
      }
      
      return await webNotificationsService.comprehensiveTest();
    } catch (err) {
      console.error('Error in comprehensive test:', err);
      return { success: false, error: err.message };
    }
  }, [permission]);

  // Get notification preferences
  const getPreferences = useCallback(async () => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      return await getNotificationPreferences();
    } catch (err) {
      console.error('Error getting notification preferences:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Update notification preferences
  const updatePreferences = useCallback(async (preferences) => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const result = await updateNotificationPreferences(preferences);
      
      // Update local language if it changed
      if (preferences.language) {
        webNotificationsService.setLanguage(preferences.language);
      }
      
      return result;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Toggle snooze notification preference
  const toggleSnoozeNotification = useCallback(async (enabled) => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const result = await updateNotificationPreferences({
        notifyOnSnooze: enabled
      });
      
      return result;
    } catch (err) {
      console.error('Error updating snooze notification preference:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Get system diagnostic information
  const getSystemStatus = useCallback(() => {
    return webNotificationsService.getSystemStatus();
  }, []);

  // Check if notifications are available
  const isAvailable = supported && permission === 'granted';
  
  // Check if FCM is available
  const isFCMAvailable = isAvailable && fcmSupported && serviceWorkerRegistered;

  // Get detailed status
  const getDetailedStatus = useCallback(() => {
    return {
      permission,
      supported,
      fcmSupported,
      serviceWorkerRegistered,
      token,
      isAvailable,
      isFCMAvailable,
      loading,
      error
    };
  }, [permission, supported, fcmSupported, serviceWorkerRegistered, token, isAvailable, isFCMAvailable, loading, error]);

  // Send reminder from server
  const sendReminderFromServer = useCallback(async (reminder) => {
    try {
      return await webNotificationsService.sendReminderFromServer(reminder);
    } catch (err) {
      console.error('Error sending reminder from server:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    // Status
    permission,
    token,
    supported,
    fcmSupported,
    serviceWorkerRegistered,
    isAvailable,
    isFCMAvailable,
    loading,
    error,
    
    // Basic Actions
    requestPermission,
    showReminder,
    scheduleReminder,
    updateLanguage,
    getDetailedStatus,
    
    // Testing
    testNotification,
    testFCMNotification,
    comprehensiveTest,
    getSystemStatus,
    
    // Firebase Functions Integration
    sendReminder,
    getPreferences,
    updatePreferences,
    
    // Event handlers (for components that need to handle notification actions)
    onReminderComplete: (handler) => webNotificationsService.on('reminder_complete', handler),
    onReminderSnooze: (handler) => webNotificationsService.on('reminder_snooze', handler),
    onAnalyticsEvent: (handler) => webNotificationsService.on('analytics_event', handler),
    offReminderComplete: (handler) => webNotificationsService.off('reminder_complete', handler),
    offReminderSnooze: (handler) => webNotificationsService.off('reminder_snooze', handler),
    offAnalyticsEvent: (handler) => webNotificationsService.off('analytics_event', handler),
    
    // New method
    sendReminderFromServer,
    
    // New method
    toggleSnoozeNotification
  };
};

export default useNotifications;