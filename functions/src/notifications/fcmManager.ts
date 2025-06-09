import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { ReminderData, NotificationResult, CoupleNotificationResult } from '../types';

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  memory: '256MiB'
});

// Vietnamese notification templates for couples
const NOTIFICATION_TEMPLATES = {
  reminder: {
    vi: {
      title: '💕 Nhắc nhở yêu thương',
      bodyPersonal: (title: string) => `Đừng quên: ${title}`,
      bodyCouple: (title: string, partnerName?: string) => 
        `💕 Nhắc nhở từ ${partnerName || 'người yêu'}: ${title}`,
      actions: {
        complete: '✅ Hoàn thành',
        snooze: '⏰ Nhắc lại sau',
        view: '👀 Xem chi tiết'
      }
    },
    en: {
      title: '💕 Love Reminder',
      bodyPersonal: (title: string) => `Don't forget: ${title}`,
      bodyCouple: (title: string, partnerName?: string) => 
        `💕 Reminder from ${partnerName || 'your love'}: ${title}`,
      actions: {
        complete: '✅ Complete',
        snooze: '⏰ Snooze',
        view: '👀 View Details'
      }
    }
  },
  loveMessage: {
    vi: {
      title: '💝 Tin nhắn yêu thương',
      body: (message: string) => message
    },
    en: {
      title: '💝 Love Message',
      body: (message: string) => message
    }
  },
  peacefulDaysMilestone: {
    vi: {
      title: '🕊️ Cột mốc ngày hòa bình!',
      body: (days: number) => `Chúc mừng! Bạn đã có ${days} ngày hòa bình cùng nhau! 💕`
    },
    en: {
      title: '🕊️ Peaceful Days Milestone!',
      body: (days: number) => `Congratulations! You've had ${days} peaceful days together! 💕`
    }
  }
};

/**
 * FCM Manager class for handling Firebase Cloud Messaging operations
 */
export class FCMManager {
  /**
   * Send reminder notification to a specific user
   */
  static async sendReminderNotification(
    userId: string,
    reminder: ReminderData,
    language: 'vi' | 'en' = 'vi'
  ): Promise<NotificationResult> {
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
          body
        },
        data: {
          type: 'reminder',
          reminderId: reminder.id || '',
          coupleId: reminder.coupleId || '',
          priority: reminder.priority || 'medium',
          language,
          url: `/reminders/${reminder.id}`
        },
        webpush: {
          fcmOptions: {
            link: `${process.env.WEB_APP_URL || 'https://ilove-you.app'}/reminders/${reminder.id}`
          },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: reminder.priority === 'high',
            tag: `reminder-${reminder.id}`,
            actions: [
              {
                action: 'mark-complete',
                title: template.actions.complete
              },
              {
                action: 'snooze',
                title: template.actions.snooze
              },
              {
                action: 'view',
                title: template.actions.view
              }
            ],
            vibrate: [200, 100, 200],
            silent: false
          }
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#FF69B4',
            sound: 'default',
            channelId: 'reminders'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
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
          lastNotificationSent: FieldValue.serverTimestamp()
        });

      return { 
        success: true, 
        messageId: response,
        userId,
        reminderId: reminder.id
      };
      
    } catch (error) {
      console.error('Error sending FCM reminder notification:', error);
      
      // Handle specific FCM errors
      if (error.code === 'messaging/registration-token-not-registered') {
        // Token is invalid, remove it from user document
        await this.removeInvalidToken(userId);
        return { success: false, error: 'Invalid FCM token, removed' };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reminder notification to couple (both partners)
   */
  static async sendCoupleReminderNotification(
    coupleId: string,
    reminder: ReminderData,
    creatorId: string,
    language: 'vi' | 'en' = 'vi'
  ): Promise<CoupleNotificationResult> {
    try {
      console.log(`Sending couple reminder notification for couple: ${coupleId}`);
      
      // Get couple document to find both partners
      const coupleDoc = await getFirestore()
        .collection('couples')
        .doc(coupleId)
        .get();
      
      if (!coupleDoc.exists) {
        console.log(`Couple not found: ${coupleId}`);
        return { success: false, error: 'Couple not found' };
      }

      const coupleData = coupleDoc.data();
      const members = coupleData?.members || [];
      
      if (members.length !== 2) {
        console.log(`Invalid couple members count: ${members.length}`);
        return { success: false, error: 'Invalid couple configuration' };
      }

      // Find partner (the one who didn't create the reminder)
      const partnerId = members.find((id: string) => id !== creatorId);
      
      if (!partnerId) {
        console.log(`Partner not found for creator: ${creatorId}`);
        return { success: false, error: 'Partner not found' };
      }

      // Get creator name for personalized message
      const creatorDoc = await getFirestore()
        .collection('users')
        .doc(creatorId)
        .get();
      
      const creatorName = creatorDoc.exists ? 
        creatorDoc.data()?.displayName || 'người yêu' : 'người yêu';

      // Send notification to partner
      const partnerResult = await this.sendPartnerReminderNotification(
        partnerId,
        reminder,
        creatorName,
        language
      );

      // Also send to creator (for their own reminder)
      const creatorResult = await this.sendReminderNotification(
        creatorId,
        reminder,
        language
      );

      return {
        success: true,
        partner: partnerResult,
        creator: creatorResult,
        coupleId,
        reminderId: reminder.id
      };
      
    } catch (error) {
      console.error('Error sending couple reminder notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reminder notification to partner with personalized message
   */
  private static async sendPartnerReminderNotification(
    partnerId: string,
    reminder: ReminderData,
    creatorName: string,
    language: 'vi' | 'en' = 'vi'
  ): Promise<NotificationResult> {
    try {
      // Get partner FCM token and preferences
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
        return { success: false, error: 'Partner in quiet hours' };
      }

      // Prepare partner-specific notification content
      const template = NOTIFICATION_TEMPLATES.reminder[language];
      const title = `💕 ${template.title}`;
      const body = template.bodyCouple(reminder.title, creatorName);
      
      const message = {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: {
          type: 'couple_reminder',
          reminderId: reminder.id || '',
          coupleId: reminder.coupleId || '',
          creatorId: reminder.creatorId || '',
          priority: reminder.priority || 'medium',
          language,
          url: `/reminders/${reminder.id}`
        },
        webpush: {
          fcmOptions: {
            link: `${process.env.WEB_APP_URL || 'https://ilove-you.app'}/reminders/${reminder.id}`
          },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: reminder.priority === 'high',
            tag: `couple-reminder-${reminder.id}`,
            actions: [
              {
                action: 'view',
                title: template.actions.view
              },
              {
                action: 'snooze',
                title: template.actions.snooze
              }
            ],
            vibrate: [200, 100, 200, 100, 200],
            silent: false
          }
        }
      };

      const response = await getMessaging().send(message);
      console.log('Partner reminder notification sent successfully:', response);
      
      return { 
        success: true, 
        messageId: response,
        partnerId
      };
      
    } catch (error) {
      console.error('Error sending partner reminder notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private static isQuietHours(
    quietHours: { enabled?: boolean; start?: string; end?: string },
    _timezone: string = 'Asia/Ho_Chi_Minh'
  ): boolean {
    if (!quietHours?.enabled) {
      return false;
    }

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = (quietHours.start || '22:00').split(':').map(Number);
      const [endHour, endMinute] = (quietHours.end || '08:00').split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        return currentTime >= startTime && currentTime <= endTime;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Remove invalid FCM token from user document
   */
  private static async removeInvalidToken(userId: string): Promise<void> {
    try {
      await getFirestore()
        .collection('users')
        .doc(userId)
        .update({
          fcmToken: FieldValue.delete(),
          fcmTokenUpdated: FieldValue.delete()
        });
      console.log(`Removed invalid FCM token for user: ${userId}`);
    } catch (error) {
      console.error('Error removing invalid token:', error);
    }
  }

  /**
   * Send love message notification
   */
  static async sendLoveMessage(
    fromUserId: string,
    toUserId: string,
    message: string,
    language: 'vi' | 'en' = 'vi'
  ): Promise<NotificationResult> {
    try {
      const userDoc = await getFirestore()
        .collection('users')
        .doc(toUserId)
        .get();
      
      if (!userDoc.exists) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;
      
      if (!fcmToken) {
        return { success: false, error: 'No FCM token available' };
      }

      const notificationPrefs = userData?.notificationPreferences || {};
      if (!notificationPrefs.enabled || !notificationPrefs.loveMessages) {
        return { success: false, error: 'Love messages disabled' };
      }

      const template = NOTIFICATION_TEMPLATES.loveMessage[language];
      
      const fcmMessage = {
        token: fcmToken,
        notification: {
          title: template.title,
          body: template.body(message)
        },
        data: {
          type: 'love_message',
          fromUserId,
          language,
          url: '/messages'
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            tag: 'love-message',
            requireInteraction: false,
            vibrate: [100, 50, 100]
          }
        }
      };

      const response = await getMessaging().send(fcmMessage);
      return { success: true, messageId: response };
      
    } catch (error) {
      console.error('Error sending love message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send peaceful days milestone notification
   */
  static async sendPeacefulDaysMilestone(
    coupleId: string,
    days: number,
    language: 'vi' | 'en' = 'vi'
  ): Promise<{ success: boolean; results?: NotificationResult[]; coupleId?: string; days?: number; error?: string }> {
    try {
      const coupleDoc = await getFirestore()
        .collection('couples')
        .doc(coupleId)
        .get();
      
      if (!coupleDoc.exists) {
        return { success: false, error: 'Couple not found' };
      }

      const members = coupleDoc.data()?.members || [];
      const template = NOTIFICATION_TEMPLATES.peacefulDaysMilestone[language];
      
      const results = await Promise.all(
        members.map(async (userId: string) => {
          const userDoc = await getFirestore()
            .collection('users')
            .doc(userId)
            .get();
          
          if (!userDoc.exists) return { success: false, userId };
          
          const userData = userDoc.data();
          const fcmToken = userData?.fcmToken;
          
          if (!fcmToken) return { success: false, userId };
          
          const notificationPrefs = userData?.notificationPreferences || {};
          if (!notificationPrefs.enabled || !notificationPrefs.peacefulDaysMilestones) {
            return { success: false, userId };
          }

          const message = {
            token: fcmToken,
            notification: {
              title: template.title,
              body: template.body(days)
            },
            data: {
              type: 'peaceful_days_milestone',
              coupleId,
              days: days.toString(),
              language,
              url: '/home'
            },
            webpush: {
              notification: {
                icon: '/icons/icon-192x192.png',
                tag: 'peaceful-milestone',
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200, 100, 200]
              }
            }
          };

          const response = await getMessaging().send(message);
          return { success: true, messageId: response, userId };
        })
      );

      return { success: true, results, coupleId, days };
      
    } catch (error) {
      console.error('Error sending peaceful days milestone:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Cloud Function to update FCM token for a user
 */
export const updateFCMToken = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token } = request.data;
  const userId = request.auth.uid;

  if (!token || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid FCM token is required');
  }

  try {
    // Update user document with new FCM token
    await getFirestore()
      .collection('users')
      .doc(userId)
      .update({
        fcmToken: token,
        fcmTokenUpdated: FieldValue.serverTimestamp()
      });

    console.log(`FCM token updated for user: ${userId}`);
    return { success: true, userId, token };
    
  } catch (error) {
    console.error('Error updating FCM token:', error);
    throw new HttpsError('internal', 'Failed to update FCM token');
  }
});

/**
 * Cloud Function to send test notification
 */
export const sendTestNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { language = 'vi' } = request.data;

  try {
    const testReminder: ReminderData = {
      id: 'test',
      title: language === 'vi' ? 'Thông báo thử nghiệm' : 'Test Notification',
      description: language === 'vi' ? 'Đây là thông báo thử nghiệm' : 'This is a test notification',
      type: 'personal',
      creatorId: userId,
      dueDate: Timestamp.now(),
      priority: 'medium' as const,
      completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const result = await FCMManager.sendReminderNotification(userId, testReminder, language);
    return result;
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw new HttpsError('internal', 'Failed to send test notification');
  }
});

/**
 * Cloud Function to send reminder notification (for manual triggers)
 */
export const sendReminderNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { reminderId, language = 'vi' } = request.data;
  const userId = request.auth.uid;

  if (!reminderId) {
    throw new HttpsError('invalid-argument', 'Reminder ID is required');
  }

  try {
    // Get reminder data
    const reminderDoc = await getFirestore()
      .collection('reminders')
      .doc(reminderId)
      .get();
    
    if (!reminderDoc.exists) {
      throw new HttpsError('not-found', 'Reminder not found');
    }

    const reminderData = reminderDoc.data() as ReminderData;
    const reminder = { id: reminderId, ...reminderData };
    
    // Verify user has access to this reminder
    if (reminder.userId !== userId && reminder.creatorId !== userId) {
      throw new HttpsError('permission-denied', 'Access denied to this reminder');
    }

    const result = await FCMManager.sendReminderNotification(userId, reminder, language);
    return result;
    
  } catch (error) {
    console.error('Error sending reminder notification:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to send reminder notification');
  }
});

/**
 * Cloud Function to send couple reminder notification
 */
export const sendCoupleReminderNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { reminderId, language = 'vi' } = request.data;
  const userId = request.auth.uid;

  if (!reminderId) {
    throw new HttpsError('invalid-argument', 'Reminder ID is required');
  }

  try {
    // Get reminder data
    const reminderDoc = await getFirestore()
      .collection('reminders')
      .doc(reminderId)
      .get();
    
    if (!reminderDoc.exists) {
      throw new HttpsError('not-found', 'Reminder not found');
    }

    const reminderData = reminderDoc.data() as ReminderData;
    const reminder = { id: reminderId, ...reminderData };
    
    // Verify this is a couple reminder and user has access
    if (reminder.type !== 'couple' || !reminder.coupleId) {
      throw new HttpsError('invalid-argument', 'Not a couple reminder');
    }

    if (reminder.creatorId !== userId) {
      throw new HttpsError('permission-denied', 'Access denied to this reminder');
    }

    const result = await FCMManager.sendCoupleReminderNotification(
      reminder.coupleId,
      reminder,
      userId,
      language
    );
    
    return result;
    
  } catch (error) {
    console.error('Error sending couple reminder notification:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to send couple reminder notification');
  }
});