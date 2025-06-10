// Service Worker for ILoveYou PWA with Workbox Integration
// This file will be processed by Workbox to inject precaching

// Import Workbox libraries using importScripts for Service Worker compatibility
self.importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  // Enable workbox plugins
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Clean up outdated caches
  workbox.precaching.cleanupOutdatedCaches();

  // Register runtime caching routes
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    /^https:\/\/firestore\.googleapis\.com\/.*/i,
    new workbox.strategies.NetworkFirst({
      cacheName: 'firestore-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    /^https:\/\/fcm\.googleapis\.com\/.*/i,
    new workbox.strategies.NetworkFirst({
      cacheName: 'fcm-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 12, // 12 hours
        }),
      ],
    })
  );

} else {
  console.log('Workbox failed to load');
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  const { type, ...data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SCHEDULE_REMINDER_NOTIFICATION':
      // Store reminder for future notification
      console.log('Reminder scheduled in SW:', data.reminder);
      break;
      
    case 'CANCEL_REMINDER_NOTIFICATIONS':
      // Cancel pending notifications for reminder
      console.log('Canceling notifications for reminder:', data.reminderId);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push notification handling
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    console.log('Push event data is not JSON:', event.data.text());
    notificationData = {
      title: 'ILoveYou',
      body: event.data.text() || 'Bạn có thông báo mới!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png'
    };
  }

  const options = {
    body: notificationData.body || 'Bạn có thông báo mới!',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: notificationData.badge || '/icons/icon-72x72.png',
    image: notificationData.image,
    data: notificationData.data || {},
    actions: notificationData.actions || [
      {
        action: 'view',
        title: 'Xem',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Đóng'
      }
    ],
    tag: notificationData.tag || 'iloveyou-notification',
    renotify: true,
    requireInteraction: notificationData.requireInteraction || false,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'ILoveYou',
      options
    )
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Tìm tab đã mở app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (event.notification.data?.url) {
              client.navigate(event.notification.data.url);
            }
            return;
          }
        }
        
        // Mở tab mới nếu không tìm thấy
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

async function syncReminders() {
  try {
    // Sync pending reminders when back online
    const cache = await caches.open('iloveyou-pending-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
        console.log('Synced pending action:', request.url);
      } catch (error) {
        console.log('Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

console.log('Enhanced Service Worker with Workbox loaded');