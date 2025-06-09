const reminderJobInstance = require('../reminderJob');
const { ReminderNotificationJob } = require('../reminderJob');
const { RECURRING_TYPES, REMINDER_PRIORITIES } = require('../../firebase/reminders');

// Mock dependencies
jest.mock('../index', () => ({
  scheduleReminderNotification: jest.fn(),
  scheduleRecurringReminder: jest.fn(),
  calculateNextRecurringDate: jest.fn(),
  isRecurringReminderExpired: jest.fn(),
  sendImmediateNotification: jest.fn(),
  setBadgeCount: jest.fn(),
}));

jest.mock('../../firebase/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('../../firebase/couples', () => ({
  getUserProfile: jest.fn(),
}));

jest.mock('../../firebase/reminders', () => ({
  getUserPersonalReminders: jest.fn(),
  getCoupleReminders: jest.fn(),
  getOverdueReminders: jest.fn(),
  updateReminder: jest.fn(),
  REMINDER_PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },
  RECURRING_TYPES: {
    NONE: 'none',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  },
}));

describe('ReminderNotificationJob', () => {
  let reminderJob;
  let mockNotificationService;
  let mockGetCurrentUser;
  let mockGetUserProfile;
  let mockGetPersonalReminders;
  let mockGetCoupleReminders;
  let mockGetOverdueReminders;
  let mockUpdateReminder;

  beforeEach(() => {
    reminderJob = new ReminderNotificationJob();
    
    mockNotificationService = require('../index');
    mockGetCurrentUser = require('../../firebase/auth').getCurrentUser;
    mockGetUserProfile = require('../../firebase/couples').getUserProfile;
    mockGetPersonalReminders = require('../../firebase/reminders').getUserPersonalReminders;
    mockGetCoupleReminders = require('../../firebase/reminders').getCoupleReminders;
    mockGetOverdueReminders = require('../../firebase/reminders').getOverdueReminders;
    mockUpdateReminder = require('../../firebase/reminders').updateReminder;

    jest.clearAllMocks();
  });

  afterEach(() => {
    reminderJob.stop();
  });

  describe('Job Lifecycle', () => {
    it('should start the job successfully', () => {
      jest.spyOn(reminderJob, 'checkAndScheduleNotifications').mockImplementation();
      
      reminderJob.start();
      
      expect(reminderJob.isRunning).toBe(true);
      expect(reminderJob.intervalId).toBeDefined();
      expect(reminderJob.checkAndScheduleNotifications).toHaveBeenCalled();
    });

    it('should not start if already running', () => {
      jest.spyOn(reminderJob, 'checkAndScheduleNotifications').mockImplementation();
      reminderJob.isRunning = true;
      
      reminderJob.start();
      
      expect(reminderJob.intervalId).toBeNull();
    });

    it('should stop the job successfully', () => {
      reminderJob.isRunning = true;
      reminderJob.intervalId = setInterval(() => {}, 1000);
      
      reminderJob.stop();
      
      expect(reminderJob.isRunning).toBe(false);
      expect(reminderJob.intervalId).toBeNull();
    });
  });

  describe('Reminder Processing', () => {
    const mockUser = { uid: 'user-123' };
    const mockUserProfile = { uid: 'user-123', coupleId: 'couple-456' };
    
    const mockUpcomingReminder = {
      id: 'reminder-1',
      title: 'Test Reminder',
      description: 'Test Description',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      priority: REMINDER_PRIORITIES.MEDIUM,
      recurring: RECURRING_TYPES.NONE,
      completed: false
    };

    const mockRecurringReminder = {
      ...mockUpcomingReminder,
      id: 'reminder-2',
      recurring: RECURRING_TYPES.DAILY,
      recurringEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    it('should process upcoming personal reminders', async () => {
      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([mockUpcomingReminder]);
      mockGetCoupleReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.scheduleReminderNotification.mockResolvedValue({ success: true });
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockGetPersonalReminders).toHaveBeenCalledWith('user-123', false);
      expect(mockNotificationService.scheduleReminderNotification).toHaveBeenCalledWith(mockUpcomingReminder);
    });

    it('should process upcoming couple reminders', async () => {
      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([]);
      mockGetCoupleReminders.mockResolvedValue([mockUpcomingReminder]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.scheduleReminderNotification.mockResolvedValue({ success: true });
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockGetCoupleReminders).toHaveBeenCalledWith('couple-456', false);
      expect(mockNotificationService.scheduleReminderNotification).toHaveBeenCalledWith(mockUpcomingReminder);
    });

    it('should handle recurring reminders', async () => {
      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([mockRecurringReminder]);
      mockGetCoupleReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.scheduleRecurringReminder.mockResolvedValue({ 
        success: true, 
        scheduled: 5 
      });
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockNotificationService.scheduleRecurringReminder).toHaveBeenCalledWith(mockRecurringReminder);
    });

    it('should not reschedule already scheduled reminders', async () => {
      const reminderKey = `${mockUpcomingReminder.id}_${mockUpcomingReminder.dueDate}`;
      reminderJob.scheduledReminders.add(reminderKey);

      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([mockUpcomingReminder]);
      mockGetCoupleReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockNotificationService.scheduleReminderNotification).not.toHaveBeenCalled();
    });
  });

  describe('Overdue Reminder Processing', () => {
    const mockUser = { uid: 'user-123' };
    const mockUserProfile = { uid: 'user-123', coupleId: 'couple-456' };

    const mockOverdueRegular = {
      id: 'overdue-1',
      title: 'Overdue Regular',
      dueDate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      recurring: RECURRING_TYPES.NONE,
      completed: false
    };

    const mockOverdueRecurring = {
      id: 'overdue-2',
      title: 'Overdue Recurring',
      dueDate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      recurring: RECURRING_TYPES.DAILY,
      completed: false
    };

    it('should send notification for regular overdue reminders', async () => {
      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([]);
      mockGetCoupleReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([mockOverdueRegular]);
      mockNotificationService.sendImmediateNotification.mockResolvedValue({ success: true });
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockNotificationService.sendImmediateNotification).toHaveBeenCalledWith(
        '⚠️ Nhắc nhở quá hạn',
        'Bạn có 1 nhắc nhở đã quá hạn',
        { type: 'overdue-reminders', count: 1 }
      );
    });

    it('should reschedule overdue recurring reminders', async () => {
      const nextDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      
      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([]);
      mockGetCoupleReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([mockOverdueRecurring]);
      mockNotificationService.calculateNextRecurringDate.mockReturnValue(nextDate);
      mockNotificationService.isRecurringReminderExpired.mockReturnValue(false);
      mockUpdateReminder.mockResolvedValue({ success: true });
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      jest.spyOn(reminderJob, 'scheduleReminderIfNeeded').mockResolvedValue();

      await reminderJob.checkAndScheduleNotifications();

      expect(mockNotificationService.calculateNextRecurringDate).toHaveBeenCalledWith(mockOverdueRecurring);
      expect(mockUpdateReminder).toHaveBeenCalledWith(
        mockOverdueRecurring.id,
        expect.objectContaining({
          dueDate: nextDate,
          completed: false,
          completedAt: null,
          completedBy: null
        })
      );
    });

    it('should not reschedule expired recurring reminders', async () => {
      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([]);
      mockGetCoupleReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([mockOverdueRecurring]);
      mockNotificationService.calculateNextRecurringDate.mockReturnValue(new Date());
      mockNotificationService.isRecurringReminderExpired.mockReturnValue(true);
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockUpdateReminder).not.toHaveBeenCalled();
    });
  });

  describe('Filtering Logic', () => {
    it('should filter reminders due within 24 hours', () => {
      const now = new Date();
      const reminders = [
        {
          id: '1',
          dueDate: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes
          recurring: RECURRING_TYPES.NONE
        },
        {
          id: '2',
          dueDate: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23 hours
          recurring: RECURRING_TYPES.NONE
        },
        {
          id: '3',
          dueDate: new Date(now.getTime() + 25 * 60 * 60 * 1000), // 25 hours
          recurring: RECURRING_TYPES.NONE
        },
        {
          id: '4',
          dueDate: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
          recurring: RECURRING_TYPES.NONE
        }
      ];

      const upcomingReminders = reminderJob.filterUpcomingReminders(reminders);

      expect(upcomingReminders).toHaveLength(2);
      expect(upcomingReminders.map(r => r.id)).toEqual(['1', '2']);
    });

    it('should include overdue recurring reminders if next occurrence is within 24 hours', () => {
      const now = new Date();
      const nextDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      mockNotificationService.calculateNextRecurringDate.mockReturnValue(nextDate);

      const reminders = [
        {
          id: '1',
          dueDate: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
          recurring: RECURRING_TYPES.DAILY
        }
      ];

      const upcomingReminders = reminderJob.filterUpcomingReminders(reminders);

      expect(upcomingReminders).toHaveLength(1);
      expect(mockNotificationService.calculateNextRecurringDate).toHaveBeenCalledWith(reminders[0]);
    });
  });

  describe('Badge Count Management', () => {
    it('should update badge count with total pending reminders', async () => {
      const mockUser = { uid: 'user-123' };
      const mockUserProfile = { uid: 'user-123', coupleId: 'couple-456' };

      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      mockGetCoupleReminders.mockResolvedValue([{ id: '3' }]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockNotificationService.setBadgeCount).toHaveBeenCalledWith(3);
    });

    it('should handle badge count without couple', async () => {
      const mockUser = { uid: 'user-123' };
      const mockUserProfile = { uid: 'user-123', coupleId: null };

      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue(mockUserProfile);
      mockGetPersonalReminders.mockResolvedValue([{ id: '1' }]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockGetCoupleReminders).not.toHaveBeenCalled();
      expect(mockNotificationService.setBadgeCount).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when no user is logged in', async () => {
      mockGetCurrentUser.mockReturnValue(null);

      await reminderJob.checkAndScheduleNotifications();

      expect(mockGetPersonalReminders).not.toHaveBeenCalled();
      expect(mockGetCoupleReminders).not.toHaveBeenCalled();
    });

    it('should continue processing even if user profile fails', async () => {
      const mockUser = { uid: 'user-123' };

      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockRejectedValue(new Error('Profile not found'));
      mockGetPersonalReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      expect(mockGetPersonalReminders).toHaveBeenCalledWith('user-123', false);
      expect(mockGetCoupleReminders).not.toHaveBeenCalled();
    });

    it('should handle errors in individual reminder processing', async () => {
      const mockUser = { uid: 'user-123' };
      const mockReminder = {
        id: 'error-reminder',
        title: 'Error Reminder',
        dueDate: new Date(Date.now() + 60 * 60 * 1000)
      };

      mockGetCurrentUser.mockReturnValue(mockUser);
      mockGetUserProfile.mockResolvedValue({ uid: 'user-123' });
      mockGetPersonalReminders.mockResolvedValue([mockReminder]);
      mockGetCoupleReminders.mockResolvedValue([]);
      mockGetOverdueReminders.mockResolvedValue([]);
      mockNotificationService.scheduleReminderNotification.mockRejectedValue(
        new Error('Notification failed')
      );
      mockNotificationService.setBadgeCount.mockResolvedValue({ success: true });

      await reminderJob.checkAndScheduleNotifications();

      // Should not throw error, should continue processing
      expect(mockNotificationService.setBadgeCount).toHaveBeenCalled();
    });
  });
});
