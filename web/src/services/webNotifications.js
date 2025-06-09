// Web Notifications Service for Browser
class WebNotificationsService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
    this.init();
  }

  init() {
    if (this.isSupported) {
      this.permission = Notification.permission;
    } else {
      console.warn('Browser notifications not supported');
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      return { success: false, error: 'Notifications not supported' };
    }

    if (this.permission === 'granted') {
      return { success: true };
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        return { success: true };
      } else {
        return { success: false, error: 'Permission denied' };
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { success: false, error: error.message };
    }
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission denied');
      return { success: false, error: 'Permission not granted' };
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'iloveyou-reminder',
        requireInteraction: true,
        ...options
      });

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      return { success: true, notification };
    } catch (error) {
      console.error('Error showing notification:', error);
      return { success: false, error: error.message };
    }
  }

  async showReminderNotification(reminder) {
    const title = `💕 Nhắc nhở: ${reminder.title}`;
    const options = {
      body: reminder.description || 'Bạn có một nhắc nhở mới!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `reminder-${reminder.id}`,
      data: { reminderId: reminder.id, type: 'reminder' },
      actions: [
        {
          action: 'mark-complete',
          title: 'Đánh dấu hoàn thành'
        },
        {
          action: 'view',
          title: 'Xem chi tiết'
        }
      ]
    };

    return await this.showNotification(title, options);
  }

  async scheduleReminder(reminder) {
    if (!this.isSupported || this.permission !== 'granted') {
      return { success: false, error: 'Notifications not available' };
    }

    const dueDate = reminder.dueDate?.toDate ? reminder.dueDate.toDate() : new Date(reminder.dueDate);
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();

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

    return { success: false, error: 'Reminder too far in future' };
  }

  getPermissionStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isSupported && this.permission === 'granted'
    };
  }
}

// Create singleton instance
const webNotificationsService = new WebNotificationsService();

export default webNotificationsService;