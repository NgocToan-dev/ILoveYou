// Service Worker for ILoveYou PWA with FCM Integration
// Phase 1: Foundation with Firebase Cloud Messaging Support

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Core PWA functionality
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Firebase imports for FCM background messaging
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');

// Firebase configuration - matches shared config
const firebaseConfig = {
  apiKey: "AIzaSyBzQwGg_Hh9dDVNbkVZR3da0pmKjInpHE0",
  authDomain: "loveapp-30-5.firebaseapp.com",
  projectId: "loveapp-30-5",
  storageBucket: "loveapp-30-5.firebasestorage.app",
  messagingSenderId: "983282809749",
  appId: "1:983282809749:android:b03d92d5f2c8fb4c50149c",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Notification templates for Vietnamese and English
const NOTIFICATION_TEMPLATES = {
  reminder: {
    vi: {
      title: '💕 Nhắc nhở từ ILoveYou',
      body: (title) => `Đừng quên: ${title}`,
    },
    en: {
      title: '💕 Reminder from ILoveYou',
      body: (title) => `Don't forget: ${title}`,
    },
  },
  'love-message': {
    vi: {
      title: '💖 Tin nhắn yêu thương',
      body: (message) => message,
    },
    en: {
      title: '💖 Love Message',
      body: (message) => message,
    },
  },
  'couple-activity': {
    vi: {
      title: '💕 Hoạt động cặp đôi',
      body: (activity) => `Người yêu của bạn: ${activity}`,
    },
    en: {
      title: '💕 Couple Activity',
      body: (activity) => `Your partner: ${activity}`,
    },
  }
};

// Get notification actions based on type and language
function getNotificationActions(type, language = 'vi') {
  const actions = {
    reminder: [
      {
        action: 'mark-complete',
        title: language === 'vi' ? '✅ Hoàn thành' : '✅ Complete',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'snooze',
        title: language === 'vi' ? '⏰ Nhắc lại sau' : '⏰ Snooze',
        icon: '/icons/icon-72x72.png'
      }
    ],
    'love-message': [
      {
        action: 'reply',
        title: language === 'vi' ? '💕 Trả lời' : '💕 Reply',
        icon: '/icons/icon-72x72.png'
      }
    ],
    'couple-activity': [
      {
        action: 'view',
        title: language === 'vi' ? '👀 Xem' : '👀 View',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };

  return actions[type] || [];
}

// Handle background messages from FCM
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received: ', payload);
  
  const data = payload.data || {};
  const notification = payload.notification || {};
  const type = data.type || 'reminder';
  const language = data.language || 'vi';
  const urgent = data.urgent === 'true';
  
  // Use custom title and body if provided, otherwise use templates
  let notificationTitle = notification.title;
  let notificationBody = notification.body;
  
  if (!notificationTitle || !notificationBody) {
    const template = NOTIFICATION_TEMPLATES[type]?.[language] || NOTIFICATION_TEMPLATES.reminder[language];
    notificationTitle = notificationTitle || template.title;
    notificationBody = notificationBody || template.body(data.title || 'Thông báo mới');
  }
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `${type}-${data.id || Date.now()}`,
    data: {
      ...data,
      type,
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: getNotificationActions(type, language),
    requireInteraction: urgent,
    silent: false,
    vibrate: urgent ? [200, 100, 200, 100, 200] : [200, 100, 200],
    renotify: urgent,
    timestamp: Date.now()
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received: ', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  const type = data.type || 'reminder';
  
  // Handle different actions
  if (action === 'mark-complete') {
    event.waitUntil(handleMarkComplete(data));
  } else if (action === 'snooze') {
    event.waitUntil(handleSnooze(data));
  } else if (action === 'reply') {
    event.waitUntil(handleReply(data));
  } else if (action === 'view') {
    event.waitUntil(handleView(data));
  } else {
    // Default action - open app
    event.waitUntil(handleDefaultClick(data));
  }
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed: ', event.notification.tag);
  
  // Track notification dismissal
  const data = event.notification.data || {};
  trackNotificationEvent('notification_dismissed', {
    type: data.type,
    tag: event.notification.tag,
    timestamp: Date.now()
  });
});

// Action Handlers

async function handleMarkComplete(data) {
  try {
    // Send message to client to mark reminder complete
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'MARK_REMINDER_COMPLETE',
        reminderId: data.reminderId || data.id,
        source: 'service-worker'
      });
      
      // Focus the client window
      clients[0].focus();
    } else {
      // No client windows open, open app and handle action
      const url = data.url || `/?action=complete&id=${data.reminderId || data.id}`;
      self.clients.openWindow(url);
    }
    
    trackNotificationEvent('reminder_completed', { id: data.reminderId || data.id });
  } catch (error) {
    console.error('Error handling mark complete:', error);
  }
}

async function handleSnooze(data) {
  try {
    // Send message to client to snooze reminder
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'SNOOZE_REMINDER',
        reminderId: data.reminderId || data.id,
        duration: 10, // 10 minutes default
        source: 'service-worker'
      });
      
      clients[0].focus();
    } else {
      // No client windows open, open app and handle action
      const url = data.url || `/?action=snooze&id=${data.reminderId || data.id}`;
      self.clients.openWindow(url);
    }
    
    trackNotificationEvent('reminder_snoozed', { id: data.reminderId || data.id });
  } catch (error) {
    console.error('Error handling snooze:', error);
  }
}

async function handleReply(data) {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'OPEN_LOVE_MESSAGE_REPLY',
        messageId: data.messageId || data.id,
        source: 'service-worker'
      });
      
      clients[0].focus();
    } else {
      const url = data.url || `/?action=reply&id=${data.messageId || data.id}`;
      self.clients.openWindow(url);
    }
    
    trackNotificationEvent('love_message_reply', { id: data.messageId || data.id });
  } catch (error) {
    console.error('Error handling reply:', error);
  }
}

async function handleView(data) {
  try {
    const url = data.url || '/';
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length > 0) {
      clients[0].focus();
      clients[0].postMessage({
        type: 'NAVIGATE_TO',
        url: url,
        source: 'service-worker'
      });
    } else {
      self.clients.openWindow(url);
    }
    
    trackNotificationEvent('notification_viewed', { 
      type: data.type,
      id: data.id 
    });
  } catch (error) {
    console.error('Error handling view:', error);
  }
}

async function handleDefaultClick(data) {
  try {
    const url = data.url || '/';
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length > 0) {
      clients[0].focus();
      if (data.url && data.url !== '/') {
        clients[0].postMessage({
          type: 'NAVIGATE_TO',
          url: data.url,
          source: 'service-worker'
        });
      }
    } else {
      self.clients.openWindow(url);
    }
    
    trackNotificationEvent('notification_clicked', { 
      type: data.type,
      id: data.id 
    });
  } catch (error) {
    console.error('Error handling default click:', error);
  }
}

// Utility function to track notification events
function trackNotificationEvent(eventName, data = {}) {
  try {
    // Store event in IndexedDB for later sync with analytics
    // This is a simple implementation - could be enhanced with proper IndexedDB wrapper
    console.log('Tracking notification event:', eventName, data);
    
    // Send to client for analytics if available
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].postMessage({
          type: 'TRACK_NOTIFICATION_EVENT',
          eventName,
          data,
          timestamp: Date.now(),
          source: 'service-worker'
        });
      }
    });
  } catch (error) {
    console.error('Error tracking notification event:', error);
  }
}

// Cache strategies for app resources
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 3,
  })
);

registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
  })
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?version=1`;
      },
    }],
  })
);

// Cache Firebase APIs with network-first strategy
registerRoute(
  ({ url }) => url.origin === 'https://firestore.googleapis.com',
  new NetworkFirst({
    cacheName: 'firestore-cache',
    networkTimeoutSeconds: 3,
    plugins: [{
      cacheWillUpdate: async ({ response }) => {
        return response.status === 200 ? response : null;
      },
    }],
  })
);

// Handle message events from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: '1.0.0', timestamp: Date.now() });
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Background sync for offline notification actions (preparation for Phase 2)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'sync-notification-actions':
      event.waitUntil(syncNotificationActions());
      break;
    case 'sync-analytics-events':
      event.waitUntil(syncAnalyticsEvents());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Placeholder functions for future background sync implementation
async function syncNotificationActions() {
  console.log('Syncing notification actions...');
  // Implementation for syncing offline notification actions
  // Will be implemented in Phase 2
}

async function syncAnalyticsEvents() {
  console.log('Syncing analytics events...');
  // Implementation for syncing analytics events
  // Will be implemented in Phase 2
}

console.log('ILoveYou Service Worker loaded - Phase 1 with FCM support');