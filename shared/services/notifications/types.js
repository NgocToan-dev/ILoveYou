// Shared notification types and constants

export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  LOVE_MESSAGE: 'love-message',
  COUPLE_ACTIVITY: 'couple-activity',
  OVERDUE_REMINDERS: 'overdue-reminders',
  URGENT_REMINDER: 'urgent-reminder',
  DAILY_SUMMARY: 'daily-summary',
  WEEKLY_SUMMARY: 'weekly-summary',
  TEST: 'test',
};

export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  REMINDERS: 'reminders',
  LOVE_MESSAGES: 'love-messages',
  RECURRING_REMINDERS: 'recurring-reminders',
  OVERDUE_REMINDERS: 'overdue-reminders',
  URGENT_REMINDERS: 'urgent-reminders',
  COUPLE_ACTIVITIES: 'couple-activities',
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Common notification templates
export const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.REMINDER]: {
    vi: {
      title: '💕 Nhắc nhở từ ILoveYou',
      body: (title) => `Đừng quên: ${title}`,
    },
    en: {
      title: '💕 Reminder from ILoveYou',
      body: (title) => `Don't forget: ${title}`,
    },
  },
  [NOTIFICATION_TYPES.OVERDUE_REMINDERS]: {
    vi: {
      title: '⚠️ Nhắc nhở quá hạn',
      body: (count) => count === 1 
        ? 'Bạn có 1 nhắc nhở đã quá hạn'
        : `Bạn có ${count} nhắc nhở đã quá hạn`,
    },
    en: {
      title: '⚠️ Overdue Reminders',
      body: (count) => count === 1 
        ? 'You have 1 overdue reminder'
        : `You have ${count} overdue reminders`,
    },
  },
  [NOTIFICATION_TYPES.DAILY_SUMMARY]: {
    vi: {
      title: '📋 Nhắc nhở hôm nay',
      body: (count) => count === 1 
        ? 'Bạn có 1 nhắc nhở cần hoàn thành hôm nay'
        : `Bạn có ${count} nhắc nhở cần hoàn thành hôm nay`,
    },
    en: {
      title: '📋 Today\'s Reminders',
      body: (count) => count === 1 
        ? 'You have 1 reminder to complete today'
        : `You have ${count} reminders to complete today`,
    },
  },
  [NOTIFICATION_TYPES.LOVE_MESSAGE]: {
    vi: {
      title: '💖 Tin nhắn yêu thương',
      body: (message) => message,
    },
    en: {
      title: '💖 Love Message',
      body: (message) => message,
    },
  },
};

export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TEMPLATES,
}; 