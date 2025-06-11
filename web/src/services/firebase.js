// Re-export Firebase services for easier imports in web app
export { db, auth, storage } from '../../../shared/services/firebase/config';
export * from '../../../shared/services/firebase/auth';
export * from '../../../shared/services/firebase/notes';
export * from '../../../shared/services/firebase/reminders';
export * from '../../../shared/services/firebase/couples';
export * from '../../../shared/services/firebase/loveDays';