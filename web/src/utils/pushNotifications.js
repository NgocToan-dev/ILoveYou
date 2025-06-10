// Push Notifications utilities for ILoveYou
// Handles subscription, sending notifications, etc.

// VAPID Public Key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BK7ULrATQ3qHjRl1tLgcwD5zrytEqDnt63_tJiCzyQy3lp6BFna-EUlI8Y47A3978oVPd9xQSfRvAFKhyUAViqM';

/**
 * Convert VAPID key to Uint8Array for subscription
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check if user has granted notification permission
 */
export function hasNotificationPermission() {
  return Notification.permission === 'granted';
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission denied by user');
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeToPushNotifications() {
  try {
    // Check support
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('User already subscribed to push notifications');
      return subscription;
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('User subscribed to push notifications:', subscription);
    return subscription;

  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const result = await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications:', result);
      return result;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    throw error;
  }
}

/**
 * Get current subscription
 */
export async function getCurrentSubscription() {
  try {
    if (!isPushNotificationSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get current subscription:', error);
    return null;
  }
}

/**
 * Send subscription to server (Firebase Cloud Function)
 */
export async function saveSubscriptionToServer(subscription, userId) {
  try {
    // You would typically save this to Firestore or send to your backend
    // For now, we'll just log it
    console.log('Saving subscription to server:', { subscription, userId });
    
    // TODO: Implement actual server saving
    // Example: Save to Firestore users/{userId}/pushSubscriptions collection
    
    return true;
  } catch (error) {
    console.error('Failed to save subscription to server:', error);
    throw error;
  }
}

/**
 * Show local notification (for testing)
 */
export async function showLocalNotification(title, options = {}) {
  if (!hasNotificationPermission()) {
    throw new Error('No notification permission');
  }

  const notification = new Notification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    ...options
  });

  // Auto close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  return notification;
}

/**
 * Initialize push notifications for the app
 */
export async function initializePushNotifications(userId) {
  try {
    console.log('Initializing push notifications...');
    
    // Check if user wants notifications
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Push notifications permission denied');
      return null;
    }

    // Subscribe to push notifications
    const subscription = await subscribeToPushNotifications();
    
    // Save subscription to server
    if (subscription && userId) {
      await saveSubscriptionToServer(subscription, userId);
    }

    console.log('Push notifications initialized successfully');
    return subscription;

  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return null;
  }
}

export default {
  isPushNotificationSupported,
  hasNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentSubscription,
  saveSubscriptionToServer,
  showLocalNotification,
  initializePushNotifications
}; 