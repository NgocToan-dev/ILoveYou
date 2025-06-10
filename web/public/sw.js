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

console.log('Enhanced Service Worker with Workbox loaded');