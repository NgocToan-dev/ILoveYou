// Mock for expo-notifications
module.exports = {
  setNotificationHandler: jest.fn(),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-push-token' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ 
    status: 'granted',
    canAskAgain: true,
    granted: true
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ 
    status: 'granted',
    canAskAgain: true,
    granted: true
  }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  presentNotificationAsync: jest.fn().mockResolvedValue(),
  setBadgeCountAsync: jest.fn().mockResolvedValue(),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(),
  getNotificationChannelsAsync: jest.fn().mockResolvedValue([]),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(),
  dismissAllNotificationsAsync: jest.fn().mockResolvedValue(),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: {
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5
  },
  AndroidNotificationVisibility: {
    UNKNOWN: 0,
    PUBLIC: 1,
    PRIVATE: 2,
    SECRET: 3
  }
};
