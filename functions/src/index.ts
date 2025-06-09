import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
initializeApp();

// Import notification modules
import {
  scheduleReminderCheck,
  cleanupOldReminders,
  checkPeacefulDaysMilestones,
  handleRecurringReminders
} from './notifications/reminderScheduler';
import {
  updateFCMToken,
  sendTestNotification,
  sendReminderNotification,
  sendCoupleReminderNotification
} from './notifications/fcmManager';

// Export all functions
export {
  // Scheduled functions
  scheduleReminderCheck,
  cleanupOldReminders,
  checkPeacefulDaysMilestones,
  handleRecurringReminders,
  
  // FCM token management
  updateFCMToken,
  
  // Notification functions
  sendTestNotification,
  sendReminderNotification,
  sendCoupleReminderNotification
};