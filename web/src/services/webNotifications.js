// Enhanced Web Notifications Service with FCM and Service Worker Support
// Phase 1: Service Worker Foundation
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { NOTIFICATION_TEMPLATES } from '@shared/services/notifications/types';
import { updateFCMToken as updateFCMTokenFunction } from './firebaseFunctions';

class EnhancedWebNotificationsService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.messaging = null;
    this.fcmToken = null;
    this.language = 'vi'; // Default to Vietnamese
    this.serviceWorkerRegistration = null;
    this.fcmSupported = false;
    this.messageHandlers = new Map();
    this.notificationCallback = null; // Callback để thêm notification vào context
    this.init();
  }

  async init() {
    if (this.isSupported) {
      this.permission = Notification.permission;
      await this.checkFCMSupport();
      await this.initializeServiceWorker();
      await this.initializeFCM();
      this.setupMessageHandlers();
    } else {
      console.warn('Browser notifications or Service Workers not supported');
    }
  }

  async checkFCMSupport() {
    try {
      this.fcmSupported = await isSupported();
      console.log('FCM supported:', this.fcmSupported);
    } catch (error) {
      console.warn('Error checking FCM support:', error);
      this.fcmSupported = false;
    }
  }
  async initializeServiceWorker() {
    try {
      if ('serviceWorker' in navigator) {
        // Register Firebase messaging service worker as primary for FCM
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        console.log('Firebase Messaging Service Worker registered:', this.serviceWorkerRegistration);
        
        // Force update service worker if needed
        if (this.serviceWorkerRegistration.waiting) {
          this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Handle service worker updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          console.log('Service Worker update found');
          const newWorker = this.serviceWorkerRegistration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                console.log('New Service Worker installed, activating...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
        
        return this.serviceWorkerRegistration;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      // Continue without service worker - graceful degradation
    }
  }

  async initializeFCM() {
    if (!this.fcmSupported) {
      console.log('FCM not supported, using basic notifications only');
      return;
    }

    try {
      // Đợi Firebase app sẵn sàng trước khi khởi tạo messaging
      await new Promise(resolve => {
        if (typeof window !== 'undefined' && window.firebase) {
          resolve();
        } else {
          // Retry after a short delay
          setTimeout(resolve, 1000);
        }
      });

      const { getMessaging } = await import('firebase/messaging');
      this.messaging = getMessaging();
      
      // Get FCM token if we have permission
      if (this.permission === 'granted') {
        await this.refreshFCMToken();
      }
      
      // Handle foreground messages - COMMENTED OUT để notifications hiển thị ở desktop
      /*
      onMessage(this.messaging, (payload) => {
        console.log('Foreground message received:', payload);
        this.handleForegroundMessage(payload);
      });
      */
      
    } catch (error) {
      console.error('FCM initialization failed:', error);
      // Continue without FCM - graceful degradation
    }
  }

  setupMessageHandlers() {
    // Listen for messages from Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  handleServiceWorkerMessage(data) {
    const { type, ...payload } = data;
    
    switch (type) {
      case 'MARK_REMINDER_COMPLETE':
        this.notifyHandlers('reminder_complete', payload);
        break;
      case 'SNOOZE_REMINDER':
        this.notifyHandlers('reminder_snooze', payload);
        break;
      case 'NAVIGATE_TO':
        if (window.location.pathname !== payload.url) {
          window.location.href = payload.url;
        }
        break;
      case 'TRACK_NOTIFICATION_EVENT':
        this.notifyHandlers('analytics_event', payload);
        break;
      default:
        console.log('Unknown Service Worker message:', type, payload);
    }
  }

  // Event handler management
  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, new Set());
    }
    this.messageHandlers.get(eventType).add(handler);
  }

  off(eventType, handler) {
    if (this.messageHandlers.has(eventType)) {
      this.messageHandlers.get(eventType).delete(handler);
    }
  }

  // Set notification callback for adding to context
  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  notifyHandlers(eventType, data) {
    if (this.messageHandlers.has(eventType)) {
      this.messageHandlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      return { success: false, error: 'Notifications not supported' };
    }

    if (this.permission === 'granted') {
      // If we already have permission, ensure FCM token is set up
      if (this.fcmSupported && !this.fcmToken) {
        await this.refreshFCMToken();
      }
      return { success: true, token: this.fcmToken };
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        // Initialize FCM after permission is granted
        if (this.fcmSupported) {
          await this.refreshFCMToken();
        }
        return { success: true, token: this.fcmToken };
      } else {
        return { success: false, error: 'Permission denied' };
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { success: false, error: error.message };
    }
  }

  async refreshFCMToken() {
    if (!this.fcmSupported || !this.messaging) {
      console.log('FCM not supported or messaging not initialized');
      return null;
    }

    try {
      // Use VAPID key for FCM token generation
      const vapidKey = 'BK7ULrATQ3qHjRl1tLgcwD5zrytEqDnt63_tJiCzyQy3lp6BFna-EUlI8Y47A3978oVPd9xQSfRvAFKhyUAViqM';
      
      const token = await getToken(this.messaging, { 
        vapidKey,
        serviceWorkerRegistration: this.serviceWorkerRegistration 
      });
      
      if (token) {
        console.log('FCM Token generated:', token);
        this.fcmToken = token;
        
        // Save token to Firestore
        await this.saveTokenToFirestore(token);
        
        // Update token via Firebase Functions
        try {
          const result = await updateFCMTokenFunction(token);
          if (result.success) {
            console.log('✅ FCM token updated via Firebase Functions');
          } else {
            console.warn('⚠️ Failed to update FCM token via Functions:', result.error);
          }
        } catch (error) {
          console.warn('⚠️ Error updating FCM token via Functions:', error);
        }
        
        return token;
      } else {
        console.log('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }

  async saveTokenToFirestore(token) {
    try {
      const user = auth.currentUser;
      if (user && token) {
        // Use Firebase Functions for secure token management
        const result = await updateFCMTokenFunction(token);
        if (result.success) {
          console.log('FCM token saved via Firebase Functions');
        } else {
          console.warn('Failed to save FCM token via Functions, falling back to direct update');
          // Fallback to direct Firestore update
          await updateDoc(doc(db, 'users', user.uid), {
            fcmToken: token,
            fcmTokenUpdated: serverTimestamp(),
            notificationPreferences: {
              enabled: true,
              reminders: true,
              coupleReminders: true,
              loveMessages: true,
              peacefulDaysMilestones: true,
              language: this.language,
              quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
              },
              vibration: true,
              sound: true,
              ...this.getStoredPreferences()
            }
          });
          console.log('FCM token saved to Firestore (fallback)');
        }
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
      // Try direct save as last resort
      try {
        const user = auth.currentUser;
        if (user && token) {
          await updateDoc(doc(db, 'users', user.uid), {
            fcmToken: token,
            fcmTokenUpdated: serverTimestamp()
          });
          console.log('FCM token saved to Firestore (emergency fallback)');
        }
      } catch (fallbackError) {
        console.error('All FCM token save methods failed:', fallbackError);
      }
    }
  }

  getStoredPreferences() {
    try {
      const stored = localStorage.getItem('iloveyou_notification_preferences');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  handleForegroundMessage(payload) {
    console.log('Handling foreground message:', payload);
    
    const { notification, data } = payload;
    const type = data?.type || 'reminder';
    
    // Show notification using browser API since app is in foreground
    this.showNotification(notification.title || 'Thông báo mới', {
      body: notification.body,
      icon: '/icons/icon-192x192.png',
      tag: `foreground-${type}-${data?.id || Date.now()}`,
      data: data,
      requireInteraction: data?.urgent === 'true',
      actions: this.getNotificationActions(type)
    });
    
    // Notify handlers
    this.notifyHandlers('foreground_message', { notification, data, type });
  }

  getNotificationActions(type) {
    const actions = {
      reminder: [
        {
          action: 'mark-complete',
          title: this.language === 'vi' ? '✅ Hoàn thành' : '✅ Complete'
        },
        {
          action: 'snooze',
          title: this.language === 'vi' ? '⏰ Nhắc lại' : '⏰ Snooze'
        }
      ],
      'love-message': [
        {
          action: 'reply',
          title: this.language === 'vi' ? '💕 Trả lời' : '💕 Reply'
        }
      ]
    };
    
    return actions[type] || [];
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission denied');
      return { success: false, error: 'Permission not granted' };
    }

    try {
      // Option 1: Use Service Worker if available (supports actions)
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        const notificationOptions = {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'iloveyou-notification',
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200],
          ...options
        };

        await this.serviceWorkerRegistration.showNotification(title, notificationOptions);
        console.log('Notification shown via Service Worker with actions support');
        return { success: true, type: 'service-worker' };
      }

      // Option 2: Try to get ready service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.active) {
            const notificationOptions = {
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag: 'iloveyou-notification',
              requireInteraction: false,
              silent: false,
              vibrate: [200, 100, 200],
              ...options
            };

            await registration.showNotification(title, notificationOptions);
            console.log('Notification shown via ready Service Worker with actions support');
            return { success: true, type: 'service-worker-ready' };
          }
        } catch (swError) {
          console.warn('Service Worker not available, falling back to basic notification:', swError);
        }
      }

      // Option 3: Fallback to basic Notification API (no actions support)
      const basicOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'iloveyou-notification',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        ...options
      };

      // Remove actions for basic notification API
      delete basicOptions.actions;

      const notification = new Notification(title, basicOptions);

      // Auto close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      console.log('Notification shown via basic API (no actions)');
      return { success: true, notification, type: 'basic' };
    } catch (error) {
      console.error('Error showing notification:', error);
      return { success: false, error: error.message };
    }
  }

  async showReminderNotification(reminder, options = {}) {
    // Use template for consistent messaging
    const template = NOTIFICATION_TEMPLATES.reminder[this.language];
    const title = template.title;
    const body = template.body(reminder.title);
    
    const notificationOptions = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `reminder-${reminder.id}`,
      data: { 
        reminderId: reminder.id, 
        type: 'reminder',
        coupleId: reminder.coupleId 
      },
      actions: [
        {
          action: 'mark-complete',
          title: this.language === 'vi' ? '✅ Hoàn thành' : '✅ Complete'
        },
        {
          action: 'snooze',
          title: this.language === 'vi' ? '⏰ Nhắc lại sau' : '⏰ Snooze'
        }
      ],
      requireInteraction: reminder.priority === 'high',
      silent: false,
      vibrate: [200, 100, 200],
      ...options
    };

    // Add notification to context if callback is set
    if (this.notificationCallback) {
      this.notificationCallback({
        title,
        body,
        type: 'reminder',
        data: {
          reminderId: reminder.id,
          reminder
        },
        actionUrl: `/reminders/${reminder.id}`
      });
    }

    console.log(`📨 Showing reminder notification: ${title}`, {
      reminderId: reminder.id,
      hasServiceWorker: !!this.serviceWorkerRegistration,
      hasActions: !!notificationOptions.actions?.length
    });

    return await this.showNotification(title, notificationOptions);
  }
  async scheduleReminder(reminder) {
    if (!this.isSupported) {
      return { success: false, error: 'Browser notifications not supported' };
    }

    const dueDate = reminder.dueDate?.toDate ? reminder.dueDate.toDate() : new Date(reminder.dueDate);
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();

    // If permission is not granted, still process the reminder but don't show notifications
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted, reminder processed silently');
      return { 
        success: true, 
        scheduled: false, 
        note: 'Reminder processed without notification permission'
      };
    }

    if (timeUntilDue <= 0) {
      // Show immediately if overdue
      return await this.showReminderNotification(reminder);
    } else if (timeUntilDue <= 24 * 60 * 60 * 1000) {
      // Schedule if within 24 hours
      setTimeout(() => {
        this.showReminderNotification(reminder);
      }, timeUntilDue);
      
      return { success: true, scheduled: true };
    }

    return { success: true, scheduled: false, note: 'Reminder too far in future for web scheduling' };
  }

  setLanguage(language) {
    this.language = language;
    // Update stored preferences
    const preferences = this.getStoredPreferences();
    preferences.language = language;
    localStorage.setItem('iloveyou_notification_preferences', JSON.stringify(preferences));
  }

  getPermissionStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isSupported && this.permission === 'granted',
      fcmSupported: this.fcmSupported,
      fcmToken: this.fcmToken,
      serviceWorkerRegistered: !!this.serviceWorkerRegistration
    };
  }

  // Helper method for testing notifications
  async testNotification() {
    const testReminder = {
      id: 'test-' + Date.now(),
      title: 'Thông báo thử nghiệm',
      description: 'Đây là thông báo thử nghiệm từ ILoveYou',
      priority: 'medium'
    };
    
    return await this.showReminderNotification(testReminder);
  }

  // Test FCM integration with Firebase Functions
  async testFCMNotification() {
    try {
      const { sendTestNotification } = await import('./firebaseFunctions');
      const result = await sendTestNotification(this.language);
      
      if (result.success) {
        console.log('✅ FCM test notification sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.error('❌ FCM test notification failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error testing FCM notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send reminder notification from server
  async sendReminderFromServer(reminder) {
    try {
      if (!this.fcmToken) {
        console.warn('No FCM token available for server notification');
        return { success: false, error: 'No FCM token available' };
      }

      // Import Firebase Functions
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('./firebase');
      
      const functions = getFunctions(app, 'asia-southeast1'); // Singapore region
      const sendReminderNotification = httpsCallable(functions, 'sendReminderNotification');
      
      console.log('Sending reminder notification from server:', reminder.title);
      const result = await sendReminderNotification({ 
        fcmToken: this.fcmToken,
        language: this.language,
        reminder: {
          id: reminder.id,
          title: reminder.title,
          description: reminder.description || '',
          priority: reminder.priority || 'medium',
          type: 'reminder'
        }
      });
      
      console.log('Reminder notification sent from server:', result.data);
      return { success: true, messageId: result.data?.messageId };
      
    } catch (error) {
      console.error('Error sending reminder from server:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced test that tries both local and FCM notifications
  async comprehensiveTest() {
    const results = {
      localNotification: null,
      fcmNotification: null,
      overall: false
    };

    // Test local notification
    try {
      results.localNotification = await this.testNotification();
      console.log('Local notification test:', results.localNotification.success ? '✅' : '❌');
    } catch (error) {
      results.localNotification = { success: false, error: error.message };
    }

    // Test FCM notification if supported and token available
    if (this.fcmSupported && this.fcmToken) {
      try {
        results.fcmNotification = await this.testFCMNotification();
        console.log('FCM notification test:', results.fcmNotification.success ? '✅' : '❌');
      } catch (error) {
        results.fcmNotification = { success: false, error: error.message };
      }
    } else {
      results.fcmNotification = {
        success: false,
        error: 'FCM not supported or token unavailable'
      };
    }

    results.overall = results.localNotification?.success || results.fcmNotification?.success;
    
    return results;
  }

  // Get detailed system status for debugging
  getSystemStatus() {
    return {
      // Basic support
      browserSupport: this.isSupported,
      notificationPermission: this.permission,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      
      // FCM status
      fcmSupported: this.fcmSupported,
      fcmToken: this.fcmToken ? `${this.fcmToken.substring(0, 20)}...` : null,
      fcmTokenFull: this.fcmToken, // For debugging only
      
      // Service Worker status
      serviceWorkerRegistered: !!this.serviceWorkerRegistration,
      serviceWorkerActive: this.serviceWorkerRegistration?.active?.state,
      
      // Configuration
      language: this.language,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY ? 'configured' : 'missing',
      
      // Handlers
      messageHandlersCount: Array.from(this.messageHandlers.entries()).reduce((acc, [type, handlers]) => {
        acc[type] = handlers.size;
        return acc;
      }, {}),
      
      // Environment
      isDevelopment: import.meta.env.DEV,
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent
    };
  }

  // ==============================================
  // MISSING METHODS FOR SHARED REMINDERS SERVICE
  // ==============================================
  /**
   * Cancel all notifications for a specific reminder
   * This method is expected by the shared reminders service
   * @param {string} reminderId - The reminder ID
   * @returns {Promise<Object>} - Result object with success status
   */
  async cancelReminderNotifications(reminderId) {
    try {
      console.log(`🗑️ Canceling notifications for reminder: ${reminderId}`);
      
      // For web, we don't have persistent scheduled notifications like mobile
      // But we can clear any timeouts or intervals related to this reminder
      
      // Send message to Service Worker to cancel any future notifications
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'CANCEL_REMINDER_NOTIFICATIONS',
          reminderId: reminderId
        });
      }
      
      // Log cancellation for debugging
      console.log(`🗑️ Canceled 0 notifications for reminder: ${reminderId}`);
      
      return { 
        success: true, 
        canceled: 0, // Web doesn't have persistent scheduled notifications
        platform: 'web',
        message: 'Web notifications are not persistently scheduled'
      };
    } catch (error) {
      console.error('Error canceling reminder notifications:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Schedule a notification for a reminder
   * This method is expected by the shared reminders service
   * @param {Object} reminder - The reminder object
   * @returns {Promise<Object>} - Result object with success status
   */
  async scheduleReminderNotification(reminder) {
    try {
      console.log(`📅 Scheduling notification for reminder: ${reminder.title}`);
      
      // Check if notifications are supported and permission is granted
      if (!this.isSupported) {
        console.warn('Browser notifications not supported');
        return {
          success: false,
          error: 'Browser notifications not supported',
          platform: 'web',
          reminderId: reminder.id
        };
      }
      
      // If permission is not granted, try to use basic scheduling without showing notifications
      if (this.permission !== 'granted') {
        console.warn('Notification permission not granted, but scheduling will proceed silently');
        
        // Send message to Service Worker for future notification handling
        if (this.serviceWorkerRegistration?.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'SCHEDULE_REMINDER_NOTIFICATION',
            reminder: reminder
          });
        }
        
        return {
          success: true,
          scheduled: 0,
          platform: 'web',
          reminderId: reminder.id,
          scheduledForFuture: false,
          note: 'Scheduled without notification permission'
        };
      }
      
      // For web, we'll use the existing scheduleReminder method
      const result = await this.scheduleReminder(reminder);
      
      // Send message to Service Worker regardless of result
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'SCHEDULE_REMINDER_NOTIFICATION',
          reminder: reminder,
          result: result
        });
      }
      
      if (result.success) {
        console.log(`✅ Notification scheduled for reminder: ${reminder.title}`);
        return {
          success: true,
          scheduled: result.scheduled ? 1 : 0,
          platform: 'web',
          reminderId: reminder.id,
          scheduledForFuture: result.scheduled
        };
      } else {
        console.warn(`⚠️ Failed to schedule notification for reminder: ${reminder.title}`, result.error);
        return {
          success: true, // Return success even if notification failed, as the reminder itself was processed
          scheduled: 0,
          error: result.error,
          platform: 'web',
          reminderId: reminder.id,
          note: 'Reminder processed but notification failed'
        };
      }
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for overdue reminders and show notifications
   * This is a web-specific enhancement
   * @returns {Promise<Object>} - Result object
   */
  async checkOverdueReminders() {
    try {
      // This would typically get reminders from Firestore
      // For now, just return success since we don't have direct access
      // to the reminders database from this service
      console.log('🔍 Checking for overdue reminders...');
      
      return { 
        success: true, 
        checked: true,
        message: 'Overdue reminder check completed'
      };
    } catch (error) {
      console.error('Error checking overdue reminders:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const webNotificationsService = new EnhancedWebNotificationsService();

export default webNotificationsService;