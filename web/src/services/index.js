// Backend API Client
export { default as backendApi } from './backendApi';

// Hybrid Services
export { default as notesService } from './notesService';
export { default as remindersService } from './remindersService';
export { default as couplesService } from './couplesService';
export { default as loveDaysService } from './loveDaysService';
export { default as authService } from './authService';

// Firebase Services (for direct access if needed)
export * as firebase from './firebase';

// Other services
export { default as webNotifications } from './webNotifications';
export { default as performance } from './performance';
export { default as firebaseFunctions } from './firebaseFunctions';

// Re-export individual service instances for convenience
export { notesService as notes } from './notesService';
export { remindersService as reminders } from './remindersService';
export { couplesService as couples } from './couplesService';
export { loveDaysService as loveDays } from './loveDaysService';
export { authService as auth } from './authService';

// Constants re-exports
export {
  NOTE_CATEGORIES,
  NOTE_TYPES,
  getNoteCategoryDisplayInfo,
} from './notesService';

export {
  REMINDER_TYPES,
  REMINDER_PRIORITIES,
  REMINDER_CATEGORIES,
  RECURRING_TYPES,
  getReminderCategoryDisplayInfo,
  getPriorityDisplayInfo,
  getRecurringDisplayInfo,
} from './remindersService';

export {
  calculateDaysTogether,
  calculateMonthsTogether,
  calculateYearsTogether,
  getLoveMilestones,
  getNextMilestone,
  formatLoveDuration,
} from './loveDaysService';
