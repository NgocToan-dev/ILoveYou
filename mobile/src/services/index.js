// Mobile services index - Re-export shared services and initialize mobile-specific services

// Re-export Firebase services from shared
export {
  authService,
  notesService,
  couplesService,
  loveDaysService,
} from '@shared/services/firebase';

// Re-export and initialize reminders service with notification support
import { initializeNotificationService } from '@shared/services/firebase/reminders';
export * from '@shared/services/firebase/reminders';

// Import mobile notification service
import notificationService from './notifications';

// Initialize notification service for shared reminders
let isNotificationServiceInitialized = false;

export const initializeMobileServices = () => {
  if (!isNotificationServiceInitialized) {
    // Initialize notification service for shared reminders
    initializeNotificationService(notificationService);
    isNotificationServiceInitialized = true;
    console.log('✅ Mobile services initialized with notification support');
  }
};

// Mobile-specific services
export { default as notificationService } from './notifications';

// Auto-initialize on import (for convenience)
initializeMobileServices(); 