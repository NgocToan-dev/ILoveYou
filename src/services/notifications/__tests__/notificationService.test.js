const notificationService = require('../index');
const { RECURRING_TYPES, REMINDER_PRIORITIES } = require('../../firebase/reminders');

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  AndroidImportance: {
    MAX: 'max',
    HIGH: 'high',
    DEFAULT: 'default',
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id'
      }
    }
  }
}));

// Mock navigation service
jest.mock('../../navigation', () => ({
  handleNotificationNavigation: jest.fn(),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recurring Date Calculations', () => {
    it('should calculate next daily occurrence correctly', () => {
      const originalDate = new Date('2024-01-01T10:00:00');
      const fromDate = new Date('2024-01-03T15:00:00');
      
      const nextDate = notificationService.getNextDailyDate(originalDate, fromDate);
      
      expect(nextDate.getDate()).toBe(4);
      expect(nextDate.getHours()).toBe(10);
    });

    it('should calculate next weekly occurrence correctly', () => {
      const originalDate = new Date('2024-01-01T10:00:00'); // Monday
      const fromDate = new Date('2024-01-10T15:00:00'); // Wednesday
      
      const nextDate = notificationService.getNextWeeklyDate(originalDate, fromDate);
      
      expect(nextDate.getDate()).toBe(15); // Next Monday
      expect(nextDate.getHours()).toBe(10);
    });

    it('should calculate next monthly occurrence correctly', () => {
      const originalDate = new Date('2024-01-15T10:00:00');
      const fromDate = new Date('2024-02-20T15:00:00');
      
      const nextDate = notificationService.getNextMonthlyDate(originalDate, fromDate);
      
      expect(nextDate.getMonth()).toBe(2); // March (0-indexed)
      expect(nextDate.getDate()).toBe(15);
      expect(nextDate.getHours()).toBe(10);
    });

    it('should calculate next yearly occurrence correctly', () => {
      const originalDate = new Date('2024-01-15T10:00:00');
      const fromDate = new Date('2024-06-20T15:00:00');
      
      const nextDate = notificationService.getNextYearlyDate(originalDate, fromDate);
      
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getDate()).toBe(15);
    });

    it('should handle leap year edge cases for monthly recurrence', () => {
      const originalDate = new Date('2024-02-29T10:00:00'); // Leap year
      const fromDate = new Date('2024-03-01T15:00:00');
      
      const nextDate = notificationService.getNextMonthlyDate(originalDate, fromDate);
      
      // Should go to the last day of March since Feb 29 doesn't exist in non-leap years
      expect(nextDate.getMonth()).toBe(2); // March
      expect(nextDate.getDate()).toBeLessThanOrEqual(31);
    });
  });

  describe('Recurring Reminder Expiration', () => {
    it('should detect expired recurring reminders', () => {
      const reminder = {
        recurring: RECURRING_TYPES.DAILY,
        recurringEndDate: new Date('2024-01-15T10:00:00')
      };
      
      const nextDate = new Date('2024-01-20T10:00:00');
      
      const isExpired = notificationService.isRecurringReminderExpired(reminder, nextDate);
      expect(isExpired).toBe(true);
    });

    it('should not detect unexpired recurring reminders', () => {
      const reminder = {
        recurring: RECURRING_TYPES.DAILY,
        recurringEndDate: new Date('2024-01-25T10:00:00')
      };
      
      const nextDate = new Date('2024-01-20T10:00:00');
      
      const isExpired = notificationService.isRecurringReminderExpired(reminder, nextDate);
      expect(isExpired).toBe(false);
    });

    it('should handle reminders without end date', () => {
      const reminder = {
        recurring: RECURRING_TYPES.DAILY,
        recurringEndDate: null
      };
      
      const nextDate = new Date('2024-01-20T10:00:00');
      
      const isExpired = notificationService.isRecurringReminderExpired(reminder, nextDate);
      expect(isExpired).toBe(false);
    });
  });

  describe('Warning Time Calculation', () => {
    it('should return correct warning times for different priorities', () => {
      expect(notificationService.getWarningTime(REMINDER_PRIORITIES.URGENT)).toBe(60);
      expect(notificationService.getWarningTime(REMINDER_PRIORITIES.HIGH)).toBe(30);
      expect(notificationService.getWarningTime(REMINDER_PRIORITIES.MEDIUM)).toBe(15);
      expect(notificationService.getWarningTime(REMINDER_PRIORITIES.LOW)).toBe(0);
      expect(notificationService.getWarningTime('unknown')).toBe(15);
    });
  });

  describe('Notification Scheduling', () => {
    const mockReminder = {
      id: 'test-reminder-1',
      title: 'Test Reminder',
      description: 'This is a test reminder',
      dueDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      priority: REMINDER_PRIORITIES.MEDIUM,
      recurring: RECURRING_TYPES.NONE,
      type: 'personal',
      category: 'special_occasions'
    };

    it('should schedule a single reminder notification', async () => {
      const mockSchedule = require('expo-notifications').scheduleNotificationAsync;
      mockSchedule.mockResolvedValue('notification-id');

      const result = await notificationService.scheduleReminderNotification(mockReminder);

      expect(result.success).toBe(true);
      expect(mockSchedule).toHaveBeenCalled();
    });

    it('should not schedule notifications for past dates', async () => {
      const pastReminder = {
        ...mockReminder,
        dueDate: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      };

      const result = await notificationService.scheduleReminderNotification(pastReminder);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Date is in the past');
    });

    it('should schedule recurring reminder notifications', async () => {
      const recurringReminder = {
        ...mockReminder,
        recurring: RECURRING_TYPES.DAILY,
        recurringEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const mockSchedule = require('expo-notifications').scheduleNotificationAsync;
      mockSchedule.mockResolvedValue('notification-id');

      const result = await notificationService.scheduleRecurringReminder(recurringReminder);

      expect(result.success).toBe(true);
      expect(result.scheduled).toBeGreaterThan(0);
      expect(mockSchedule).toHaveBeenCalled();
    });

    it('should include warning notifications for high priority reminders', async () => {
      const urgentReminder = {
        ...mockReminder,
        priority: REMINDER_PRIORITIES.URGENT,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      };

      const mockSchedule = require('expo-notifications').scheduleNotificationAsync;
      mockSchedule.mockResolvedValue('notification-id');

      const result = await notificationService.scheduleReminderNotification(urgentReminder);

      expect(result.success).toBe(true);
      expect(mockSchedule).toHaveBeenCalledTimes(2); // Main notification + warning
    });
  });

  describe('Immediate Notifications', () => {
    it('should send immediate notification with correct channel', async () => {
      const mockSchedule = require('expo-notifications').scheduleNotificationAsync;
      mockSchedule.mockResolvedValue('notification-id');

      const result = await notificationService.sendImmediateNotification(
        'Test Title',
        'Test Body',
        { type: 'overdue-reminders', count: 5 }
      );

      expect(result.success).toBe(true);
      expect(mockSchedule).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { type: 'overdue-reminders', count: 5 },
          sound: 'default',
        },
        trigger: null,
      });
    });
  });

  describe('Badge Management', () => {
    it('should set badge count correctly', async () => {
      const mockSetBadge = require('expo-notifications').setBadgeCountAsync;
      mockSetBadge.mockResolvedValue();

      const result = await notificationService.setBadgeCount(5);

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(mockSetBadge).toHaveBeenCalledWith(5);
    });
  });

  describe('Notification Cleanup', () => {
    it('should cancel all notifications', async () => {
      const mockCancelAll = require('expo-notifications').cancelAllScheduledNotificationsAsync;
      const mockDismissAll = require('expo-notifications').dismissAllNotificationsAsync;
      const mockSetBadge = require('expo-notifications').setBadgeCountAsync;
      
      mockCancelAll.mockResolvedValue();
      mockDismissAll.mockResolvedValue();
      mockSetBadge.mockResolvedValue();

      const result = await notificationService.clearAllNotifications();

      expect(result.success).toBe(true);
      expect(mockCancelAll).toHaveBeenCalled();
      expect(mockDismissAll).toHaveBeenCalled();
      expect(mockSetBadge).toHaveBeenCalledWith(0);
    });

    it('should cancel specific reminder notifications', async () => {
      const mockGetScheduled = require('expo-notifications').getAllScheduledNotificationsAsync;
      const mockCancel = require('expo-notifications').cancelScheduledNotificationAsync;
      
      mockGetScheduled.mockResolvedValue([
        {
          identifier: 'notif-1',
          content: { data: { reminderId: 'reminder-1' } }
        },
        {
          identifier: 'notif-2',
          content: { data: { reminderId: 'reminder-2' } }
        },
        {
          identifier: 'notif-3',
          content: { data: { reminderId: 'reminder-1' } }
        }
      ]);
      mockCancel.mockResolvedValue();

      const result = await notificationService.cancelReminderNotifications('reminder-1');

      expect(result.success).toBe(true);
      expect(result.canceled).toBe(2);
      expect(mockCancel).toHaveBeenCalledTimes(2);
    });
  });
  describe('Error Handling', () => {
    it('should handle scheduling errors gracefully', async () => {
      const mockSchedule = require('expo-notifications').scheduleNotificationAsync;
      mockSchedule.mockRejectedValue(new Error('Permission denied'));

      const mockReminder = {
        id: 'test-reminder',
        title: 'Test Reminder',
        description: 'Test Description',
        dueDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        priority: 'medium',
        recurring: 'none'
      };

      const result = await notificationService.scheduleReminderNotification(mockReminder);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should handle badge setting errors gracefully', async () => {
      const mockSetBadge = require('expo-notifications').setBadgeCountAsync;
      mockSetBadge.mockRejectedValue(new Error('Badge not supported'));

      const result = await notificationService.setBadgeCount(5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Badge not supported');
    });
  });
});
