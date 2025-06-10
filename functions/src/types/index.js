/**
 * @fileoverview Type definitions for Firebase Functions using JSDoc
 */

/**
 * @typedef {Object} ReminderRecurring
 * @property {boolean} enabled
 * @property {'daily'|'weekly'|'monthly'|'yearly'} frequency
 * @property {number} [interval]
 * @property {import('firebase-admin/firestore').Timestamp} [endDate]
 */

/**
 * @typedef {Object} ReminderData
 * @property {string} [id]
 * @property {string} title
 * @property {string} [description]
 * @property {'personal'|'couple'} type
 * @property {string} [userId]
 * @property {string} creatorId
 * @property {string} [coupleId]
 * @property {import('firebase-admin/firestore').Timestamp} dueDate
 * @property {'low'|'medium'|'high'} priority
 * @property {string} [category]
 * @property {boolean} completed
 * @property {import('firebase-admin/firestore').Timestamp} [completedAt]
 * @property {import('firebase-admin/firestore').Timestamp} createdAt
 * @property {import('firebase-admin/firestore').Timestamp} updatedAt
 * @property {boolean} [notificationSent]
 * @property {import('firebase-admin/firestore').Timestamp} [lastNotificationSent]
 * @property {number} [notificationAttempts]
 * @property {string} [lastNotificationError]
 * @property {ReminderRecurring} [recurring]
 * @property {string} [parentReminderId]
 */

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} enabled
 * @property {boolean} reminders
 * @property {boolean} coupleReminders
 * @property {boolean} loveMessages
 * @property {boolean} peacefulDaysMilestones
 * @property {'vi'|'en'} language
 * @property {Object} [quietHours]
 * @property {boolean} quietHours.enabled
 * @property {string} quietHours.start
 * @property {string} quietHours.end
 * @property {boolean} vibration
 * @property {boolean} sound
 */

/**
 * @typedef {Object} UserData
 * @property {string} [displayName]
 * @property {string} [email]
 * @property {string} [fcmToken]
 * @property {import('firebase-admin/firestore').Timestamp} [fcmTokenUpdated]
 * @property {NotificationPreferences} [notificationPreferences]
 * @property {string} [timezone]
 */

/**
 * @typedef {Object} PeacefulDays
 * @property {boolean} enabled
 * @property {number} currentStreak
 * @property {import('firebase-admin/firestore').Timestamp} lastUpdated
 * @property {import('firebase-admin/firestore').Timestamp} [lastMilestoneCelebrated]
 */

/**
 * @typedef {Object} CoupleData
 * @property {string[]} members
 * @property {PeacefulDays} [peacefulDays]
 */

/**
 * @typedef {Object} NotificationResult
 * @property {boolean} success
 * @property {string} [messageId]
 * @property {string} [userId]
 * @property {string} [reminderId]
 * @property {string} [partnerId]
 * @property {string} [error]
 */

/**
 * @typedef {Object} CoupleNotificationResult
 * @property {boolean} success
 * @property {NotificationResult} [partner]
 * @property {NotificationResult} [creator]
 * @property {string} [coupleId]
 * @property {string} [reminderId]
 * @property {string} [error]
 */

module.exports = {}; // Export placeholder for JSDoc types 