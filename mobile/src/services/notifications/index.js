const Notifications = require('expo-notifications');
const Device = require('expo-device');
const { Platform } = require('react-native');
const Constants = require('expo-constants');
const navigationService = require('../navigation');

// Import shared notification utilities
const { 
  calculateNextRecurringDate,
  isRecurringReminderExpired,
  filterUpcomingReminders,
  getTodayReminders,
  getThisWeekReminders,
} = require('@shared/services/notifications/utils');
const { 
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TEMPLATES 
} = require('@shared/services/notifications/types');

// Configure notification handling
const configureNotificationHandler = () => {
  if (Notifications.setNotificationHandler && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
};

// Initialize notification handler
configureNotificationHandler();

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize notification service
  async initialize() {
    try {
      await this.registerForPushNotifications();
      this.setupNotificationListeners();
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return { success: false, error: error.message };
    }
  }

  // Register for push notifications
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E91E63',
      });

      // Create reminder channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.REMINDERS, {
        name: 'Nhắc nhở',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E91E63',
        sound: 'default',
        description: 'Thông báo nhắc nhở từ ILoveYou',
      });

      // Create love messages channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.LOVE_MESSAGES, {
        name: 'Tin nhắn tình yêu',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 150, 150],
        lightColor: '#FF69B4',
        sound: 'default',
        description: 'Tin nhắn tình yêu từ người yêu',
      });

      // Create recurring reminders channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.RECURRING_REMINDERS, {
        name: 'Nhắc nhở định kỳ',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#9C27B0',
        sound: 'default',
        description: 'Thông báo nhắc nhở định kỳ từ ILoveYou',
      });

      // Create overdue reminders channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.OVERDUE_REMINDERS, {
        name: 'Nhắc nhở quá hạn',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#F44336',
        sound: 'default',
        description: 'Thông báo nhắc nhở quá hạn từ ILoveYou',
      });

      // Create urgent reminders channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.URGENT_REMINDERS, {
        name: 'Nhắc nhở khẩn cấp',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 100, 300, 100, 300],
        lightColor: '#FF5722',
        sound: 'default',
        description: 'Thông báo nhắc nhở khẩn cấp từ ILoveYou',
      });

      // Create couple activities channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.COUPLE_ACTIVITIES, {
        name: 'Hoạt động đôi',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#2196F3',
        sound: 'default',
        description: 'Thông báo hoạt động đôi từ ILoveYou',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Không được phép gửi thông báo!');
      }
      
      // Only try to get push token if we have a project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })).data;
      } else {
        console.warn('No project ID found. Push notifications will not work in development. This is normal in Expo Go.');
        // Return null token to indicate push notifications are not available
        token = null;
      }
      
      console.log('Push notification token:', token);
      this.expoPushToken = token;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Setup notification listeners
  setupNotificationListeners() {
    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for notification responses (when user taps on notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle incoming notification
  handleNotificationReceived(notification) {
    const data = notification.request.content.data;
    
    // Handle different types of notifications
    switch (data?.type) {
      case NOTIFICATION_TYPES.REMINDER:
        this.handleReminderNotification(data);
        break;
      case NOTIFICATION_TYPES.LOVE_MESSAGE:
        this.handleLoveMessageNotification(data);
        break;
      case NOTIFICATION_TYPES.COUPLE_ACTIVITY:
        this.handleCoupleActivityNotification(data);
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  }

  // Handle notification response (user interaction)
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;
    
    console.log('Handling notification response:', data);
    
    // Use navigation service to handle navigation
    navigationService.handleNotificationNavigation(data);
  }

  // Handle reminder notifications
  handleReminderNotification(data) {
    console.log('Reminder notification received:', data);
    // Could update badge count, play special sound, etc.
  }

  // Handle love message notifications
  handleLoveMessageNotification(data) {
    console.log('Love message notification received:', data);
  }

  // Handle couple activity notifications
  handleCoupleActivityNotification(data) {
    console.log('Couple activity notification received:', data);
  }

  // Use shared utility for calculating next recurring date
  calculateNextRecurringDate(reminder) {
    return calculateNextRecurringDate(reminder);
  }

  // Use shared utility for checking if recurring reminder is expired
  isRecurringReminderExpired(reminder, nextDate) {
    return isRecurringReminderExpired(reminder, nextDate);
  }

  // Use shared utility for filtering upcoming reminders
  filterUpcomingReminders(reminders) {
    return filterUpcomingReminders(reminders);
  }

  // Use shared utility for getting today's reminders
  getTodayReminders(reminders) {
    return getTodayReminders(reminders);
  }

  // Use shared utility for getting this week's reminders
  getThisWeekReminders(reminders) {
    return getThisWeekReminders(reminders);
  }

  // Schedule recurring reminder notifications
  async scheduleRecurringReminder(reminder) {
    try {
      const { RECURRING_TYPES } = require('../index');
      
      if (!reminder.recurring || reminder.recurring === RECURRING_TYPES.NONE) {
        console.log('Reminder is not recurring, scheduling single notification');
        return await this.scheduleReminderNotification(reminder);
      }

      const results = [];
      let currentDate = new Date(reminder.dueDate);
      const now = new Date();
      const maxScheduleAhead = 30; // Schedule up to 30 future occurrences
      let scheduled = 0;

      while (scheduled < maxScheduleAhead) {
        const nextDate = this.calculateNextRecurringDate({
          ...reminder,
          dueDate: currentDate
        });

        if (!nextDate || this.isRecurringReminderExpired(reminder, nextDate)) {
          break;
        }

        // Only schedule if the date is in the future
        if (nextDate > now) {
          const result = await this.scheduleReminderNotification({
            ...reminder,
            dueDate: nextDate,
            title: `🔄 ${reminder.title}`,
            description: reminder.description + ' (Nhắc nhở định kỳ)'
          });

          results.push(result);
          scheduled++;
        }

        currentDate = nextDate;
      }

      console.log(`Scheduled ${scheduled} recurring notifications for: ${reminder.title}`);
      return {
        success: true,
        scheduled: scheduled,
        results: results
      };

    } catch (error) {
      console.error('Error scheduling recurring reminder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Schedule a local notification
  async scheduleLocalNotification({
    title,
    body,
    data = {},
    trigger,
    channelId = 'default'
  }) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger,
        identifier: data.id || undefined,
      });

      console.log('Scheduled notification with identifier:', identifier);
      return { success: true, identifier };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { success: false, error: error.message };
    }
  }
  // Schedule reminder notification
  async scheduleReminderNotification(reminder) {
    try {
      const triggerDate = new Date(reminder.dueDate);
      const now = new Date();

      if (triggerDate <= now) {
        console.log('Reminder date is in the past, skipping notification');
        return { success: false, error: 'Date is in the past' };
      }

      const { REMINDER_PRIORITIES, RECURRING_TYPES } = require('../index');

      // Determine channel based on reminder properties
      let channelId = NOTIFICATION_CHANNELS.REMINDERS;
      if (reminder.recurring && reminder.recurring !== RECURRING_TYPES.NONE) {
        channelId = NOTIFICATION_CHANNELS.RECURRING_REMINDERS;
      } else if (reminder.priority === REMINDER_PRIORITIES.URGENT) {
        channelId = NOTIFICATION_CHANNELS.URGENT_REMINDERS;
      }

      // Calculate notification times
      const notifications = [];

      // Main notification at due time
      const mainTitle = reminder.recurring && reminder.recurring !== RECURRING_TYPES.NONE 
        ? `🔄 ${reminder.title}` 
        : `💕 ${reminder.title}`;

      notifications.push({
        title: mainTitle,
        body: reminder.description || 'Bạn có một nhắc nhở cần chú ý!',
        data: {
          type: 'reminder',
          reminderId: reminder.id,
          reminderType: reminder.type,
          priority: reminder.priority,
          isRecurring: reminder.recurring !== RECURRING_TYPES.NONE,
          reminderCategory: reminder.category,
        },
        trigger: { date: triggerDate },
        channelId: channelId
      });

      // Early warning based on priority
      const warningTime = this.getWarningTime(reminder.priority);
      if (warningTime > 0) {
        const warningDate = new Date(triggerDate.getTime() - warningTime * 60000);
        if (warningDate > now) {
          notifications.push({
            title: `⏰ Sắp tới: ${reminder.title}`,
            body: `Còn ${warningTime} phút nữa bạn sẽ có nhắc nhở!`,
            data: {
              type: 'reminder',
              reminderId: reminder.id,
              reminderType: reminder.type,
              priority: reminder.priority,
              isWarning: true,
              reminderCategory: reminder.category,
            },
            trigger: { date: warningDate },
            channelId: channelId
          });
        }
      }

      // Schedule all notifications
      const results = [];
      for (const notification of notifications) {
        const result = await this.scheduleLocalNotification(notification);
        results.push(result);
      }      const successful = results.filter(r => r.success).length;
      console.log(`Scheduled ${successful}/${results.length} notifications for reminder: ${reminder.title}`);

      const result = {
        success: successful > 0,
        scheduled: successful,
        total: results.length,
        results: results
      };

      // If no notifications were scheduled successfully, include the first error
      if (successful === 0 && results.length > 0) {
        const firstError = results.find(r => !r.success && r.error);
        if (firstError) {
          result.error = firstError.error;
        }
      }

      return result;

    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
            return {
        success: false,
        error: error.message
      };
    }
  }

  // Get warning time based on priority
  getWarningTime(priority) {
    const { REMINDER_PRIORITIES } = require('../index');
    
    switch (priority) {
      case REMINDER_PRIORITIES.URGENT:
        return 60; // 1 hour
      case REMINDER_PRIORITIES.HIGH:
        return 30; // 30 minutes
      case REMINDER_PRIORITIES.MEDIUM:
        return 15; // 15 minutes
      case REMINDER_PRIORITIES.LOW:
        return 0; // No warning
      default:
        return 15;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      return { success: true };
    } catch (error) {
      console.error('Error canceling notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel all notifications for a reminder
  async cancelReminderNotifications(reminderId) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const reminderNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.reminderId === reminderId
      );

      for (const notification of reminderNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      return { success: true, canceled: reminderNotifications.length };
    } catch (error) {
      console.error('Error canceling reminder notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return { success: true, notifications };
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Send immediate notification (for overdue reminders, etc.)
  async sendImmediateNotification(title, body, data = {}) {
    try {
      // Determine channel based on notification type
      let channelId = 'default';
      
      if (data.type === 'overdue-reminders') {
        channelId = 'overdue-reminders';
      } else if (data.type === 'urgent-reminder') {
        channelId = 'urgent-reminders';
      } else if (data.type === 'love-message') {
        channelId = 'love-messages';
      } else if (data.type === 'couple-activity') {
        channelId = 'couple-activities';
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

      console.log('Sent immediate notification:', title);
      return { success: true };
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Set app badge count
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`Set badge count to: ${count}`);
      return { success: true, count };
    } catch (error) {
      console.error('Error setting badge count:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
      
      console.log('Cleared all notifications');
      return { success: true };
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Test notification (for debugging)
  async sendTestNotification() {
    try {
      await this.sendImmediateNotification(
        '🧪 Test Notification',
        'This is a test notification from ILoveYou app',
        { type: 'test' }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error sending test notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup listeners
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  // Get push token
  getPushToken() {
    return this.expoPushToken;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
module.exports.NotificationService = NotificationService;
