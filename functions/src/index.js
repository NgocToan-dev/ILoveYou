const { initializeApp } = require('firebase-admin/app');
const { setGlobalOptions } = require('firebase-functions/v2');

// Initialize Firebase Admin SDK
initializeApp();

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'asia-southeast1', // Singapore region
  memory: '256MiB',
});

// Import notification modules
const {
  scheduleReminderCheck,
  cleanupOldReminders,
  checkPeacefulDaysMilestones,
  handleRecurringReminders,
} = require('./notifications/reminderScheduler');

const {
  updateFCMToken,
  sendTestNotification,
  sendReminderNotification,
  sendCoupleReminderNotification,
} = require('./notifications/fcmManager');

const {
  onReminderCreated,
  onReminderUpdated,
  cleanupOldNotifications,
} = require('./notifications/notificationTriggers');

// Export all functions
module.exports = {
  // Scheduled functions
  scheduleReminderCheck,
  cleanupOldReminders,
  checkPeacefulDaysMilestones,
  handleRecurringReminders,
  cleanupOldNotifications,
  
  // FCM token management
  updateFCMToken,
  
  // Notification functions
  sendTestNotification,
  sendReminderNotification,
  sendCoupleReminderNotification,
  
  // Firestore triggers
  onReminderCreated,
  onReminderUpdated,
}; 