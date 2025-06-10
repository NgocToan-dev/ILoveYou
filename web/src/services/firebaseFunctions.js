import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../../shared/services/firebase/config';

// Initialize Firebase Functions with Singapore region
const functions = getFunctions(app, 'asia-southeast1');

// Configure emulator for development
if (import.meta.env.DEV) {
  try {
    // Connect to Firebase Functions emulator in development
    // Note: Only call this once and in development mode
    console.log('Connecting to Firebase Functions emulator...');
    // connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.warn('Firebase Functions emulator connection failed:', error);
  }
}

/**
 * FCM Token Management Functions
 */

/**
 * Update FCM token for the current user
 * @param {string} token - FCM token to save
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
 */
export const updateFCMToken = async (token) => {
  try {
    const updateToken = httpsCallable(functions, 'updateFCMToken');
    const result = await updateToken({ token });
    return result.data;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notification Functions
 */

/**
 * Send a test notification to the current user
 * @param {string} language - Language preference ('vi' or 'en')
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendTestNotification = async (language = 'vi') => {
  try {
    const sendTest = httpsCallable(functions, 'sendTestNotification');
    const result = await sendTest({ language });
    return result.data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send reminder notification manually
 * @param {string} reminderId - ID of the reminder
 * @param {string} language - Language preference ('vi' or 'en')
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendReminderNotification = async (reminderId, language = 'vi') => {
  try {
    const sendReminder = httpsCallable(functions, 'sendReminderNotification');
    const result = await sendReminder({ reminderId, language });
    return result.data;
  } catch (error) {
    console.error('Error sending reminder notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send couple reminder notification manually
 * @param {string} reminderId - ID of the couple reminder
 * @param {string} language - Language preference ('vi' or 'en')
 * @returns {Promise<{success: boolean, results?: any, error?: string}>}
 */
export const sendCoupleReminderNotification = async (reminderId, language = 'vi') => {
  try {
    const sendCoupleReminder = httpsCallable(functions, 'sendCoupleReminderNotification');
    const result = await sendCoupleReminder({ reminderId, language });
    return result.data;
  } catch (error) {
    console.error('Error sending couple reminder notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * User Preferences Functions
 */

/**
 * Update user notification preferences
 * @param {Object} preferences - Notification preferences object
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    // This will update the user document directly since it's user data
    const { updateDoc, doc } = await import('firebase/firestore');
    const { db, auth } = await import('../../../shared/services/firebase/config');
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      notificationPreferences: preferences,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user notification preferences
 * @returns {Promise<{success: boolean, preferences?: Object, error?: string}>}
 */
export const getNotificationPreferences = async () => {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const { db, auth } = await import('../../../shared/services/firebase/config');
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    
    if (!userDoc.exists()) {
      // Return default preferences
      const defaultPreferences = {
        enabled: true,
        reminders: true,
        coupleReminders: true,
        loveMessages: true,
        peacefulDaysMilestones: true,
        language: 'vi',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        vibration: true,
        sound: true
      };
      
      return { success: true, preferences: defaultPreferences };
    }

    const userData = userDoc.data();
    const preferences = userData.notificationPreferences || {};
    
    // Merge with defaults to ensure all properties exist
    const defaultPreferences = {
      enabled: true,
      reminders: true,
      coupleReminders: true,
      loveMessages: true,
      peacefulDaysMilestones: true,
      language: 'vi',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      vibration: true,
      sound: true
    };

    const mergedPreferences = { ...defaultPreferences, ...preferences };
    
    return { success: true, preferences: mergedPreferences };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Utility Functions
 */

/**
 * Check if Firebase Functions are available
 * @returns {boolean}
 */
export const areFunctionsAvailable = () => {
  try {
    return !!functions;
  } catch (error) {
    console.error('Firebase Functions not available:', error);
    return false;
  }
};

/**
 * Get Firebase Functions region
 * @returns {string}
 */
export const getFunctionsRegion = () => {
  return 'asia-southeast1';
};

/**
 * Enhanced error handling for Firebase Functions
 * @param {Error} error - Firebase Functions error
 * @returns {string} - User-friendly error message
 */
export const handleFunctionsError = (error) => {
  console.error('Firebase Functions error:', error);
  
  // Handle specific Firebase Functions error codes
  switch (error.code) {
    case 'functions/cancelled':
      return 'Yêu cầu đã bị hủy. Vui lòng thử lại.';
    case 'functions/unknown':
      return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
    case 'functions/invalid-argument':
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại.';
    case 'functions/deadline-exceeded':
      return 'Yêu cầu quá thời gian. Vui lòng thử lại.';
    case 'functions/not-found':
      return 'Không tìm thấy chức năng yêu cầu.';
    case 'functions/already-exists':
      return 'Dữ liệu đã tồn tại.';
    case 'functions/permission-denied':
      return 'Bạn không có quyền thực hiện hành động này.';
    case 'functions/resource-exhausted':
      return 'Hệ thống đang quá tải. Vui lòng thử lại sau.';
    case 'functions/failed-precondition':
      return 'Điều kiện tiên quyết không được đáp ứng.';
    case 'functions/aborted':
      return 'Thao tác đã bị hủy bỏ.';
    case 'functions/out-of-range':
      return 'Giá trị nằm ngoài phạm vi cho phép.';
    case 'functions/unimplemented':
      return 'Chức năng chưa được triển khai.';
    case 'functions/internal':
      return 'Lỗi hệ thống nội bộ. Vui lòng thử lại sau.';
    case 'functions/unavailable':
      return 'Dịch vụ hiện tại không khả dụng. Vui lòng thử lại sau.';
    case 'functions/data-loss':
      return 'Mất dữ liệu. Vui lòng liên hệ hỗ trợ.';
    case 'functions/unauthenticated':
      return 'Bạn cần đăng nhập để thực hiện hành động này.';
    default:
      return error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
};

// Export all functions as default
export default {
  updateFCMToken,
  sendTestNotification,
  sendReminderNotification,
  sendCoupleReminderNotification,
  updateNotificationPreferences,
  getNotificationPreferences,
  areFunctionsAvailable,
  getFunctionsRegion,
  handleFunctionsError
};