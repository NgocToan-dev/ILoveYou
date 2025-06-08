// Export all model classes
export { Note, default as NoteModel } from './Note';
export { Reminder, default as ReminderModel } from './Reminder';

// Helper functions for creating model instances
export const createNote = (data = {}) => {
  return new Note(data);
};

export const createReminder = (data = {}) => {
  return new Reminder(data);
};

// Helper functions for converting Firestore documents to models
export const noteFromFirestore = (doc) => {
  return Note.fromFirestore(doc);
};

export const reminderFromFirestore = (doc) => {
  return Reminder.fromFirestore(doc);
};

// Helper functions for converting arrays of Firestore documents
export const notesFromFirestoreArray = (docs = []) => {
  return docs.map(doc => Note.fromFirestore(doc)).filter(note => note !== null);
};

export const remindersFromFirestoreArray = (docs = []) => {
  return docs.map(doc => Reminder.fromFirestore(doc)).filter(reminder => reminder !== null);
};

// Helper functions for converting QuerySnapshot
export const notesFromQuerySnapshot = (querySnapshot) => {
  const notes = [];
  querySnapshot.forEach((doc) => {
    const note = Note.fromFirestore(doc);
    if (note) {
      notes.push(note);
    }
  });
  return notes;
};

export const remindersFromQuerySnapshot = (querySnapshot) => {
  const reminders = [];
  querySnapshot.forEach((doc) => {
    const reminder = Reminder.fromFirestore(doc);
    if (reminder) {
      reminders.push(reminder);
    }
  });
  return reminders;
};

// Import model classes for re-export
import { Note } from './Note';
import { Reminder } from './Reminder';

export default {
  Note,
  Reminder,
  createNote,
  createReminder,
  noteFromFirestore,
  reminderFromFirestore,
  notesFromFirestoreArray,
  remindersFromFirestoreArray,
  notesFromQuerySnapshot,
  remindersFromQuerySnapshot,
};