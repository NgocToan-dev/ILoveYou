const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

// CORS configuration for web testing
const corsOptions = {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://anhvacun.pages.dev',
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
};

// Vietnamese notification templates for couples
const NOTIFICATION_TEMPLATES = {
  reminder: {
    vi: {
      title: '💕 Nhắc nhở yêu thương',
      bodyPersonal: (title) => `Đừng quên: ${title}`,
      bodyCouple: (title, partnerName) => 
        `💕 Nhắc nhở từ ${partnerName || 'người yêu'}: ${title}`,
      actions: {
        complete: '✅ Hoàn thành',
        snooze: '⏰ Nhắc lại sau',
        view: '👀 Xem chi tiết',
      },
    },
    en: {
      title: '💕 Love Reminder',
      bodyPersonal: (title) => `Don't forget: ${title}`,
      bodyCouple: (title, partnerName) => 
        `💕 Reminder from ${partnerName || 'your love'}: ${title}`,
      actions: {
        complete: '✅ Complete',
        snooze: '⏰ Snooze',
        view: '👀 View Details',
      },
    },
  },
  loveMessage: {
    vi: {
      title: '💝 Tin nhắn yêu thương',
      body: (message) => message,
    },
    en: {
      title: '💝 Love Message',
      body: (message) => message,
    },
  },
  peacefulDaysMilestone: {
    vi: {
      title: '🕊️ Cột mốc ngày hòa bình!',
      body: (days) => `Chúc mừng! Bạn đã có ${days} ngày hòa bình cùng nhau! 💕`,
    },
    en: {
      title: '🕊️ Peaceful Days Milestone!',
      body: (days) => `Congratulations! You've had ${days} peaceful days together! 💕`,
    },
  },
};

/**
 * FCM Manager class for handling Firebase Cloud Messaging operations
 */
// eslint-disable-next-line no-unused-vars
class FCMManager {
  /**
   * Send reminder notification to a specific user
   * @param {string} userId - User ID
   * @param {import('../types').ReminderData} reminder - Reminder data
   * @param {'vi'|'en'} language - Language preference
   * @returns {Promise<import('../types').NotificationResult>}
   */
  static async sendReminderNotification(userId, reminder, language = 'vi') {
    try {
      console.log(`Sending reminder notification to user: ${userId}`);
      
      // Get user document to retrieve FCM token
      const userDoc = await getFirestore()
        .collection('users')
        .doc(userId)
        .get();
      
      if (!userDoc.exists) {
        console.log(`User not found: ${userId}`);
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;
      
      if (!fcmToken) {
        console.log(`No FCM token for user: ${userId}`);
        return { success: false, error: 'No FCM token available' };
      }

      // Check notification preferences
      const notificationPrefs = userData?.notificationPreferences || {};
      if (!notificationPrefs.enabled || !notificationPrefs.reminders) {
        console.log(`Notifications disabled for user: ${userId}`);
        return { success: false, error: 'Notifications disabled' };
      }

      // Check quiet hours
      if (this.isQuietHours(notificationPrefs.quietHours, userData?.timezone)) {
        console.log(`Currently in quiet hours for user: ${userId}`);
        return { success: false, error: 'Quiet hours active' };
      }

      // Prepare notification content
      const template = NOTIFICATION_TEMPLATES.reminder[language];
      const title = template.title;
      const body = template.bodyPersonal(reminder.title);
      
      // Prepare FCM message
      const message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'reminder',
          reminderId: reminder.id || '',
          coupleId: reminder.coupleId || '',
          priority: reminder.priority || 'medium',
          language,
          url: `/reminders/${reminder.id}`,
        },
        webpush: {
          fcmOptions: {
            link: `${process.env.WEB_APP_URL || 'https://ilove-you.app'}/reminders/${reminder.id}`,
          },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: reminder.priority === 'high',
            tag: `reminder-${reminder.id}`,
            actions: [
              {
                action: 'mark-complete',
                title: template.actions.complete,
              },
              {
                action: 'snooze',
                title: template.actions.snooze,
              },
              {
                action: 'view',
                title: template.actions.view,
              },
            ],
            vibrate: [200, 100, 200],
            silent: false,
          },
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#FF69B4',
            sound: 'default',
            channelId: 'reminders',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Send the message
      const response = await getMessaging().send(message);
      console.log('FCM reminder notification sent successfully:', response);
      
      // Update reminder with notification sent status
      await getFirestore()
        .collection('reminders')
        .doc(reminder.id)
        .update({
          notificationSent: true,
          lastNotificationSent: FieldValue.serverTimestamp(),
        });

      return { 
        success: true, 
        messageId: response,
        userId,
        reminderId: reminder.id,
      };
      
    } catch (error) {
      console.error('Error sending FCM reminder notification:', error);
      
      // Handle specific FCM errors
      if (error.code === 'messaging/registration-token-not-registered') {
        // Token is invalid, remove it from user document
        await this.removeInvalidToken(userId);
        return { success: false, error: 'Invalid FCM token' };
      }
      
      return { 
        success: false, 
        error: error.message,
        userId,
        reminderId: reminder.id,
      };
    }
  }

  /**
   * Send couple reminder notification
   * @param {string} coupleId - Couple ID
   * @param {import('../types').ReminderData} reminder - Reminder data
   * @param {string} creatorId - Creator ID
   * @param {'vi'|'en'} language - Language preference
   * @returns {Promise<import('../types').CoupleNotificationResult>}
   */
  static async sendCoupleReminderNotification(coupleId, reminder, creatorId, language = 'vi') {
    try {
      console.log(`Sending couple reminder notification for couple: ${coupleId}`);
      
      // Get couple document
      const coupleDoc = await getFirestore()
        .collection('couples')
        .doc(coupleId)
        .get();
      
      if (!coupleDoc.exists) {
        return { success: false, error: 'Couple not found' };
      }

      const coupleData = coupleDoc.data();
      const members = coupleData?.members || [];
      
      if (members.length !== 2) {
        return { success: false, error: 'Invalid couple configuration' };
      }

      // Find the partner (the other member)
      const partnerId = members.find(id => id !== creatorId);
      
      if (!partnerId) {
        return { success: false, error: 'Partner not found' };
      }

      // Get creator name for the notification
      const creatorDoc = await getFirestore()
        .collection('users')
        .doc(creatorId)
        .get();
      
      const creatorName = creatorDoc.exists 
        ? creatorDoc.data()?.displayName || 'Người yêu của bạn'
        : 'Người yêu của bạn';

      // Send notification to partner
      const partnerResult = await this.sendPartnerReminderNotification(
        partnerId, 
        reminder, 
        creatorName, 
        language,
      );

      const result = {
        success: partnerResult.success,
        partner: partnerResult,
        coupleId,
        reminderId: reminder.id,
      };

      if (!partnerResult.success) {
        result.error = `Failed to notify partner: ${partnerResult.error}`;
      }

      return result;
      
    } catch (error) {
      console.error('Error sending couple reminder notification:', error);
      return { 
        success: false, 
        error: error.message,
        coupleId,
        reminderId: reminder.id,
      };
    }
  }

  /**
   * Send partner reminder notification
   * @param {string} partnerId - Partner ID
   * @param {import('../types').ReminderData} reminder - Reminder data
   * @param {string} creatorName - Creator name
   * @param {'vi'|'en'} language - Language preference
   * @returns {Promise<import('../types').NotificationResult>}
   * @private
   */
  static async sendPartnerReminderNotification(partnerId, reminder, creatorName, language = 'vi') {
    try {
      // Get partner document
      const partnerDoc = await getFirestore()
        .collection('users')
        .doc(partnerId)
        .get();
      
      if (!partnerDoc.exists) {
        return { success: false, error: 'Partner not found' };
      }

      const partnerData = partnerDoc.data();
      const fcmToken = partnerData?.fcmToken;
      
      if (!fcmToken) {
        return { success: false, error: 'No FCM token for partner' };
      }

      // Check notification preferences
      const notificationPrefs = partnerData?.notificationPreferences || {};
      if (!notificationPrefs.enabled || !notificationPrefs.coupleReminders) {
        return { success: false, error: 'Couple notifications disabled' };
      }

      // Check quiet hours
      if (this.isQuietHours(notificationPrefs.quietHours, partnerData?.timezone)) {
        return { success: false, error: 'Quiet hours active' };
      }

      // Prepare notification content
      const template = NOTIFICATION_TEMPLATES.reminder[language];
      const title = template.title;
      const body = template.bodyCouple(reminder.title, creatorName);
      
      // Send FCM message
      const message = {
        token: fcmToken,
        notification: { title, body },
        data: {
          type: 'couple-reminder',
          reminderId: reminder.id || '',
          coupleId: reminder.coupleId || '',
          creatorId: reminder.creatorId,
          priority: reminder.priority || 'medium',
          language,
          url: `/reminders/${reminder.id}`,
        },
        webpush: {
          fcmOptions: {
            link: `${process.env.WEB_APP_URL || 'https://ilove-you.app'}/reminders/${reminder.id}`,
          },
        },
      };

      const response = await getMessaging().send(message);
      
      return { 
        success: true, 
        messageId: response,
        userId: partnerId,
        reminderId: reminder.id,
      };
      
    } catch (error) {
      console.error('Error sending partner reminder notification:', error);
      return { success: false, error: error.message, userId: partnerId };
    }
  }

  /**
   * Check if current time is within quiet hours
   * @param {Object} quietHours - Quiet hours config
   * @param {string} timezone - User timezone
   * @returns {boolean}
   * @private
   */
  static isQuietHours(quietHours, timezone = 'Asia/Ho_Chi_Minh') {
    if (!quietHours?.enabled || !quietHours.start || !quietHours.end) {
      return false;
    }

    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = quietHours.start.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;

      const [endHour, endMinute] = quietHours.end.split(':').map(Number);
      const endTotalMinutes = endHour * 60 + endMinute;

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTotalMinutes > endTotalMinutes) {
        return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes;
      }
      
      return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Remove invalid FCM token from user document
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   * @private
   */
  static async removeInvalidToken(userId) {
    try {
      await getFirestore()
        .collection('users')
        .doc(userId)
        .update({
          fcmToken: FieldValue.delete(),
          fcmTokenUpdated: FieldValue.delete(),
        });
      console.log(`Removed invalid FCM token for user: ${userId}`);
    } catch (error) {
      console.error('Error removing invalid FCM token:', error);
    }
  }
}

// Export HTTP callable functions
const updateFCMToken = onCall(corsOptions, async (request) => {
  const { token } = request.data;
  const userId = request.auth?.uid;
  
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  if (!token || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid FCM token is required');
  }

  try {
    await getFirestore()
      .collection('users')
      .doc(userId)
      .update({
        fcmToken: token,
        fcmTokenUpdated: FieldValue.serverTimestamp(),
      });

    console.log(`FCM token updated for user: ${userId}`);
    return { success: true, userId };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    throw new HttpsError('internal', 'Failed to update FCM token');
  }
});

const sendTestNotification = onCall(corsOptions, async (request) => {
  const { language = 'vi' } = request.data;
  const userId = request.auth?.uid;
  
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Get user FCM token
    const userDoc = await getFirestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;
    
    if (!fcmToken) {
      throw new HttpsError('failed-precondition', 'No FCM token available');
    }

    // Prepare test notification
    const title = language === 'vi' ? '💕 Test thông báo' : '💕 Test notification';
    const body = language === 'vi' 
      ? 'Đây là thông báo test từ ILoveYou app!' 
      : 'This is a test notification from ILoveYou app!';

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'test',
        language,
        timestamp: Date.now().toString(),
      },
    };

    // Send the message
    const response = await getMessaging().send(message);
    console.log('Test notification sent successfully:', response);

    return { 
      success: true, 
      messageId: response,
      userId,
    };
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to send test notification');
  }
});

const sendReminderNotification = onCall(corsOptions, async (request) => {
  const { reminderId, language = 'vi', fcmToken, reminder } = request.data;
  const userId = request.auth?.uid;
  
  // Option 1: Direct FCM token (for web testing)
  if (fcmToken && reminder) {
    try {
      // Prepare notification for direct FCM token
      const title = language === 'vi' ? '💕 Nhắc nhở từ ILoveYou' : '💕 Reminder from ILoveYou';
      const body = language === 'vi' 
        ? `🔔 Nhắc nhở: ${reminder.title}`
        : `🔔 Reminder: ${reminder.title}`;

      const message = {
        token: fcmToken,
        notification: { title, body },
        data: {
          type: 'reminder',
          reminderId: reminder.id || '',
          title: reminder.title,
          description: reminder.description || '',
          priority: reminder.priority || 'medium',
          language,
          timestamp: Date.now().toString(),
        },
        webpush: {
          headers: {
            Urgency: reminder.priority === 'high' ? 'high' : 'normal',
          },
          notification: {
            title,
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: `reminder-${reminder.id || Date.now()}`,
            requireInteraction: reminder.priority === 'high',
            actions: [
              {
                action: 'mark-complete',
                title: language === 'vi' ? '✅ Hoàn thành' : '✅ Complete'
              },
              {
                action: 'snooze',
                title: language === 'vi' ? '⏰ Nhắc lại' : '⏰ Snooze'
              }
            ],
          },
        },
      };

      const response = await getMessaging().send(message);
      console.log('Direct reminder notification sent successfully:', response);

      return { 
        success: true, 
        messageId: response,
        reminderId: reminder.id,
        timestamp: Date.now(),
      };
      
    } catch (error) {
      console.error('Error sending direct reminder notification:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to send direct reminder notification');
    }
  }
  
  // Option 2: Traditional authentication-based approach
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated or provide FCM token');
  }
  
  if (!reminderId) {
    throw new HttpsError('invalid-argument', 'Reminder ID is required');
  }

  try {
    // Get reminder document
    const reminderDoc = await getFirestore()
      .collection('reminders')
      .doc(reminderId)
      .get();
    
    if (!reminderDoc.exists) {
      throw new HttpsError('not-found', 'Reminder not found');
    }

    const reminderData = { id: reminderDoc.id, ...reminderDoc.data() };
    
    // Check if user has permission
    if (reminderData.userId !== userId && reminderData.creatorId !== userId) {
      throw new HttpsError('permission-denied', 'No permission to send this reminder');
    }

    // Get user FCM token
    const userDoc = await getFirestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const userFcmToken = userData?.fcmToken;
    
    if (!userFcmToken) {
      throw new HttpsError('failed-precondition', 'No FCM token available');
    }

    // Prepare notification
    const title = language === 'vi' ? '💕 Nhắc nhở yêu thương' : '💕 Love Reminder';
    const body = language === 'vi' 
      ? `Đừng quên: ${reminderData.title}`
      : `Don't forget: ${reminderData.title}`;

    const message = {
      token: userFcmToken,
      notification: { title, body },
      data: {
        type: 'reminder',
        reminderId: reminderData.id,
        priority: reminderData.priority || 'medium',
        language,
      },
    };

    // Send the message
    const response = await getMessaging().send(message);
    console.log('Reminder notification sent successfully:', response);
    
    // Update reminder with notification sent status
    await getFirestore()
      .collection('reminders')
      .doc(reminderData.id)
      .update({
        notificationSent: true,
        lastNotificationSent: FieldValue.serverTimestamp(),
      });

    return { 
      success: true, 
      messageId: response,
      userId,
      reminderId: reminderData.id,
    };
    
  } catch (error) {
    console.error('Error sending reminder notification:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to send reminder notification');
  }
});

const sendCoupleReminderNotification = onCall(corsOptions, async (request) => {
  const { reminderId, language = 'vi' } = request.data;
  const userId = request.auth?.uid;
  
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  if (!reminderId) {
    throw new HttpsError('invalid-argument', 'Reminder ID is required');
  }

  try {
    // Get reminder document
    const reminderDoc = await getFirestore()
      .collection('reminders')
      .doc(reminderId)
      .get();
    
    if (!reminderDoc.exists) {
      throw new HttpsError('not-found', 'Reminder not found');
    }

    const reminder = { id: reminderDoc.id, ...reminderDoc.data() };
    
    // Check if this is a couple reminder
    if (reminder.type !== 'couple' || !reminder.coupleId) {
      throw new HttpsError('invalid-argument', 'Not a couple reminder');
    }
    
    // Check permission
    if (reminder.creatorId !== userId) {
      throw new HttpsError('permission-denied', 'Only creator can send couple reminder');
    }

    // Get couple document
    const coupleDoc = await getFirestore()
      .collection('couples')
      .doc(reminder.coupleId)
      .get();
    
    if (!coupleDoc.exists) {
      throw new HttpsError('not-found', 'Couple not found');
    }

    const coupleData = coupleDoc.data();
    const members = coupleData?.members || [];
    
    if (members.length !== 2) {
      throw new HttpsError('failed-precondition', 'Invalid couple configuration');
    }

    // Find the partner
    const partnerId = members.find(id => id !== userId);
    
    if (!partnerId) {
      throw new HttpsError('not-found', 'Partner not found');
    }

    // Get partner's FCM token
    const partnerDoc = await getFirestore()
      .collection('users')
      .doc(partnerId)
      .get();
    
    if (!partnerDoc.exists) {
      throw new HttpsError('not-found', 'Partner not found');
    }

    const partnerData = partnerDoc.data();
    const fcmToken = partnerData?.fcmToken;
    
    if (!fcmToken) {
      throw new HttpsError('failed-precondition', 'Partner has no FCM token');
    }

    // Get creator name
    const creatorDoc = await getFirestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const creatorName = creatorDoc.exists 
      ? creatorDoc.data()?.displayName || 'Người yêu của bạn'
      : 'Người yêu của bạn';

    // Prepare notification
    const title = language === 'vi' ? '💕 Nhắc nhở yêu thương' : '💕 Love Reminder';
    const body = language === 'vi' 
      ? `💕 Nhắc nhở từ ${creatorName}: ${reminder.title}`
      : `💕 Reminder from ${creatorName}: ${reminder.title}`;

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'couple-reminder',
        reminderId: reminder.id,
        coupleId: reminder.coupleId,
        creatorId: userId,
        language,
      },
    };

    // Send the message
    const response = await getMessaging().send(message);
    console.log('Couple reminder notification sent successfully:', response);

    return { 
      success: true, 
      messageId: response,
      partnerId,
      coupleId: reminder.coupleId,
      reminderId: reminder.id,
    };
    
  } catch (error) {
    console.error('Error sending couple reminder notification:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to send couple reminder notification');
  }
});

module.exports = {
  updateFCMToken,
  sendTestNotification,
  sendReminderNotification,
  sendCoupleReminderNotification,
}; 