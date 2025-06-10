// Notification Constants
// Centralized configuration for notification-related constants

export const SNOOZE_DURATION = {
  DEFAULT: 15, // 15 minutes - Thời gian hoãn mặc định
  MIN: 1,      // 1 minute - Thời gian hoãn tối thiểu
  MAX: 1440,   // 24 hours - Thời gian hoãn tối đa
  
  // Predefined options for UI
  PRESETS: [
    { value: 5, label: '5 phút', description: 'Nhắc lại ngay' },
    { value: 15, label: '15 phút', description: 'Nghỉ ngắn' },
    { value: 30, label: '30 phút', description: 'Nghỉ trung bình' },
    { value: 60, label: '1 giờ', description: 'Nghỉ dài' },
    { value: 120, label: '2 giờ', description: 'Hoãn lâu' }
  ]
};

export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

export const NOTIFICATION_ACTIONS = {
  COMPLETE: 'complete',
  SNOOZE: 'snooze',
  DISMISS: 'dismiss'
};

export default {
  SNOOZE_DURATION,
  NOTIFICATION_TYPES,
  NOTIFICATION_ACTIONS
}; 