// Mock for firebase/reminders
module.exports = {
  getUserPersonalReminders: jest.fn().mockResolvedValue([]),
  getCoupleReminders: jest.fn().mockResolvedValue([]),
  getOverdueReminders: jest.fn().mockResolvedValue([]),
  updateReminder: jest.fn().mockResolvedValue(),
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
  }
};
