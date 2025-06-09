const notificationService = require('../index');
const reminderJobInstance = require('../reminderJob');
const { ReminderNotificationJob } = require('../reminderJob');
const navigationService = require('../../navigation');
const { RECURRING_TYPES, REMINDER_PRIORITIES } = require('../../firebase/reminders');

// Mock all external dependencies
jest.mock('expo-notifications');
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants');
jest.mock('../../navigation');
jest.mock('../../firebase/auth');
jest.mock('../../firebase/couples');
jest.mock('../../firebase/reminders');

describe('Notification System Integration', () => {
  let reminderJob;
  
  beforeEach(() => {
    jest.clearAllMocks();
    reminderJob = new ReminderNotificationJob();
  });

  afterEach(() => {
    reminderJob.stop();
  });

  describe('Complete Flow: Single Reminder', () => {
    it('should handle complete flow for a single reminder', async () => {
      // Setup mocks
      const mockCurrentUser = { uid: 'test-user' };
      const mockUserProfile = { uid: 'test-user', coupleId: 'test-couple' };
      const mockReminder = {
        id: 'test-reminder',
        title: 'Anniversary',
        description: 'Our special day',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        priority: REMINDER_PRIORITIES.HIGH,
        recurring: RECURRING_TYPES.NONE,
        type: 'couple',
        category: 'special_occasions',
        completed: false
      };

      const { getCurrentUser } = require('../../firebase/auth');
      const { getUserProfile } = require('../../firebase/couples');
      const { getUserPersonalReminders, getCoupleReminders, getOverdueReminders } = require('../../firebase/reminders');
      const { scheduleNotificationAsync } = require('expo-notifications');

      getCurrentUser.mockReturnValue(mockCurrentUser);
      getUserProfile.mockResolvedValue(mockUserProfile);
      getUserPersonalReminders.mockResolvedValue([]);
      getCoupleReminders.mockResolvedValue([mockReminder]);
      getOverdueReminders.mockResolvedValue([]);
      scheduleNotificationAsync.mockResolvedValue('notification-id');

      // Initialize notification service
      await notificationService.initialize();

      // Run the reminder job
      await reminderJob.checkAndScheduleNotifications();

      // Verify notifications were scheduled
      expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2); // Main + warning notification
      
      // Verify the main notification
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '💕 Anniversary',
            body: 'Our special day',
            data: expect.objectContaining({
              type: 'reminder',
              reminderId: 'test-reminder',
              priority: REMINDER_PRIORITIES.HIGH
            })
          })
        })
      );

      // Verify the warning notification (30 minutes before for high priority)
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '⏰ Sắp tới: Anniversary',
            body: 'Còn 30 phút nữa bạn sẽ có nhắc nhở!'
          })
        })
      );
    });
  });

  describe('Complete Flow: Recurring Reminder', () => {
    it('should handle complete flow for a recurring reminder', async () => {
      const mockCurrentUser = { uid: 'test-user' };
      const mockUserProfile = { uid: 'test-user', coupleId: null };
      const mockRecurringReminder = {
        id: 'recurring-reminder',
        title: 'Daily Check-in',
        description: 'Remember to check in with your partner',
        dueDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        priority: REMINDER_PRIORITIES.MEDIUM,
        recurring: RECURRING_TYPES.DAILY,
        recurringEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        type: 'personal',
        category: 'personal_growth',
        completed: false
      };

      const { getCurrentUser } = require('../../firebase/auth');
      const { getUserProfile } = require('../../firebase/couples');
      const { getUserPersonalReminders, getOverdueReminders } = require('../../firebase/reminders');
      const { scheduleNotificationAsync } = require('expo-notifications');

      getCurrentUser.mockReturnValue(mockCurrentUser);
      getUserProfile.mockResolvedValue(mockUserProfile);
      getUserPersonalReminders.mockResolvedValue([mockRecurringReminder]);
      getOverdueReminders.mockResolvedValue([]);
      scheduleNotificationAsync.mockResolvedValue('notification-id');

      // Initialize notification service
      await notificationService.initialize();

      // Run the reminder job
      await reminderJob.checkAndScheduleNotifications();

      // Verify multiple recurring notifications were scheduled
      expect(scheduleNotificationAsync).toHaveBeenCalled();
      
      // Verify recurring notifications have correct format
      const calls = scheduleNotificationAsync.mock.calls;
      const recurringCall = calls.find(call => 
        call[0].content.title.includes('🔄 Daily Check-in')
      );
      
      expect(recurringCall).toBeDefined();
      expect(recurringCall[0].content.data.isRecurring).toBe(true);
    });
  });

  describe('Complete Flow: Overdue Recurring Reminder', () => {
    it('should reschedule overdue recurring reminders', async () => {
      const mockCurrentUser = { uid: 'test-user' };
      const mockOverdueRecurring = {
        id: 'overdue-recurring',
        title: 'Weekly Review',
        description: 'Review the week together',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        priority: REMINDER_PRIORITIES.MEDIUM,
        recurring: RECURRING_TYPES.WEEKLY,
        recurringEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        type: 'couple',
        completed: false
      };

      const { getCurrentUser } = require('../../firebase/auth');
      const { getUserProfile } = require('../../firebase/couples');
      const { getUserPersonalReminders, getCoupleReminders, getOverdueReminders, updateReminder } = require('../../firebase/reminders');

      getCurrentUser.mockReturnValue(mockCurrentUser);
      getUserProfile.mockResolvedValue({ uid: 'test-user', coupleId: 'test-couple' });
      getUserPersonalReminders.mockResolvedValue([]);
      getCoupleReminders.mockResolvedValue([]);
      getOverdueReminders.mockResolvedValue([mockOverdueRecurring]);
      updateReminder.mockResolvedValue({ success: true });

      // Run the reminder job
      await reminderJob.checkAndScheduleNotifications();

      // Verify the overdue recurring reminder was updated
      expect(updateReminder).toHaveBeenCalledWith(
        'overdue-recurring',
        expect.objectContaining({
          completed: false,
          completedAt: null,
          completedBy: null,
          dueDate: expect.any(Date)
        })
      );

      // Verify the new due date is in the future
      const updateCall = updateReminder.mock.calls[0];
      const newDueDate = updateCall[1].dueDate;
      expect(newDueDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Navigation Integration', () => {
    it('should handle notification response and navigate correctly', () => {
      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'reminder',
                reminderId: 'test-reminder',
                reminderType: 'couple',
                screenName: 'ReminderDetails'
              }
            }
          }
        }
      };

      // Simulate notification response
      notificationService.handleNotificationResponse(mockNotificationResponse);

      // Verify navigation service was called
      expect(navigationService.handleNotificationNavigation).toHaveBeenCalledWith({
        type: 'reminder',
        reminderId: 'test-reminder',
        reminderType: 'couple',
        screenName: 'ReminderDetails'
      });
    });

    it('should handle different notification types correctly', () => {
      const testCases = [
        {
          data: { type: 'love-message', messageId: 'msg-123' },
          expectation: { type: 'love-message', messageId: 'msg-123' }
        },
        {
          data: { type: 'couple-activity', activityId: 'activity-456' },
          expectation: { type: 'couple-activity', activityId: 'activity-456' }
        },
        {
          data: { type: 'overdue-reminders', count: 5 },
          expectation: { type: 'overdue-reminders', count: 5 }
        }
      ];

      testCases.forEach(testCase => {
        const mockResponse = {
          notification: {
            request: {
              content: {
                data: testCase.data
              }
            }
          }
        };

        notificationService.handleNotificationResponse(mockResponse);

        expect(navigationService.handleNotificationNavigation).toHaveBeenCalledWith(testCase.expectation);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle partial failures gracefully', async () => {
      const mockCurrentUser = { uid: 'test-user' };
      const mockReminders = [
        {
          id: 'working-reminder',
          title: 'Working Reminder',
          dueDate: new Date(Date.now() + 60 * 60 * 1000),
          priority: REMINDER_PRIORITIES.LOW,
          recurring: RECURRING_TYPES.NONE
        },
        {
          id: 'failing-reminder',
          title: 'Failing Reminder',
          dueDate: new Date(Date.now() + 60 * 60 * 1000),
          priority: REMINDER_PRIORITIES.HIGH,
          recurring: RECURRING_TYPES.NONE
        }
      ];

      const { getCurrentUser } = require('../../firebase/auth');
      const { getUserProfile } = require('../../firebase/couples');
      const { getUserPersonalReminders, getOverdueReminders } = require('../../firebase/reminders');
      const { scheduleNotificationAsync, setBadgeCountAsync } = require('expo-notifications');

      getCurrentUser.mockReturnValue(mockCurrentUser);
      getUserProfile.mockResolvedValue({ uid: 'test-user' });
      getUserPersonalReminders.mockResolvedValue(mockReminders);
      getOverdueReminders.mockResolvedValue([]);
      setBadgeCountAsync.mockResolvedValue();

      // Make one reminder fail
      scheduleNotificationAsync
        .mockResolvedValueOnce('success-id') // First call succeeds
        .mockRejectedValueOnce(new Error('Permission denied')) // Second call fails
        .mockResolvedValue('success-id'); // Subsequent calls succeed

      // Run the reminder job
      await reminderJob.checkAndScheduleNotifications();

      // Should still update badge count despite partial failure
      expect(setBadgeCountAsync).toHaveBeenCalledWith(2);
    });    it('should handle network failures gracefully', async () => {
      const authMock = require('../../firebase/auth');
      const couplesMock = require('../../firebase/couples');
      const remindersMock = require('../../firebase/reminders');

      authMock.getCurrentUser.mockReturnValue({ uid: 'test-user' });
      couplesMock.getUserProfile.mockRejectedValue(new Error('Network error'));
      remindersMock.getUserPersonalReminders.mockRejectedValue(new Error('Network error'));

      // Should not throw error
      await expect(reminderJob.checkAndScheduleNotifications()).resolves.toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of reminders efficiently', async () => {
      const mockCurrentUser = { uid: 'test-user' };
      const largeReminderSet = Array.from({ length: 100 }, (_, i) => ({
        id: `reminder-${i}`,
        title: `Reminder ${i}`,
        dueDate: new Date(Date.now() + (i * 60 * 60 * 1000)), // Spread over 100 hours
        priority: REMINDER_PRIORITIES.MEDIUM,
        recurring: i % 5 === 0 ? RECURRING_TYPES.DAILY : RECURRING_TYPES.NONE,
        completed: false
      }));

      const { getCurrentUser } = require('../../firebase/auth');
      const { getUserProfile } = require('../../firebase/couples');
      const { getUserPersonalReminders, getOverdueReminders } = require('../../firebase/reminders');
      const { scheduleNotificationAsync, setBadgeCountAsync } = require('expo-notifications');

      getCurrentUser.mockReturnValue(mockCurrentUser);
      getUserProfile.mockResolvedValue({ uid: 'test-user' });
      getUserPersonalReminders.mockResolvedValue(largeReminderSet);
      getOverdueReminders.mockResolvedValue([]);
      scheduleNotificationAsync.mockResolvedValue('notification-id');
      setBadgeCountAsync.mockResolvedValue();

      const startTime = Date.now();
      await reminderJob.checkAndScheduleNotifications();
      const endTime = Date.now();

      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      
      // Should handle badge count correctly
      expect(setBadgeCountAsync).toHaveBeenCalledWith(100);
    });
  });
});
