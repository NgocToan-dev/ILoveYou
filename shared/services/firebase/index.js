// Export all Firebase services from this file
// This serves as the main entry point for Firebase functionality

export { auth, db } from './config';
export * from './auth';
export * from './firestore';
export * from './loveDays';
export * from './couples';
// Explicitly export notes with alias to avoid conflicts
import { getCategoryDisplayInfo as getNoteCategoryDisplayInfo } from './notes';
export { getNoteCategoryDisplayInfo };
export * from './notes';
// Explicitly export reminders with alias to avoid conflicts
import { getCategoryDisplayInfo as getReminderCategoryDisplayInfo } from './reminders';
export { getReminderCategoryDisplayInfo };
export * from './reminders';
