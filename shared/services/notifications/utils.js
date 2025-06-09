// Shared notification utility functions
import { RECURRING_TYPES } from '../firebase/reminders';
import { toDate } from '../../utils/dateUtils';

/**
 * Calculate next recurring date for a reminder
 * @param {Object} reminder - The reminder object
 * @returns {Date|null} - Next occurrence date or null if can't calculate
 */
export const calculateNextRecurringDate = (reminder) => {
  const currentDate = new Date(reminder.dueDate);
  const now = new Date();
  
  // If the reminder is in the future, return the original date
  if (currentDate > now) {
    return currentDate;
  }

  switch (reminder.recurring) {
    case RECURRING_TYPES.DAILY:
      return getNextDailyDate(currentDate, now);
    case RECURRING_TYPES.WEEKLY:
      return getNextWeeklyDate(currentDate, now);
    case RECURRING_TYPES.MONTHLY:
      return getNextMonthlyDate(currentDate, now);
    case RECURRING_TYPES.YEARLY:
      return getNextYearlyDate(currentDate, now);
    default:
      return null;
  }
};

/**
 * Get next daily occurrence
 * @param {Date} originalDate - Original reminder date
 * @param {Date} fromDate - Calculate from this date
 * @returns {Date} - Next daily occurrence
 */
export const getNextDailyDate = (originalDate, fromDate) => {
  const nextDate = new Date(originalDate);
  const daysDiff = Math.ceil((fromDate - originalDate) / (1000 * 60 * 60 * 24));
  nextDate.setDate(originalDate.getDate() + daysDiff);
  
  // If still in the past, add one more day
  if (nextDate <= fromDate) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
};

/**
 * Get next weekly occurrence
 * @param {Date} originalDate - Original reminder date
 * @param {Date} fromDate - Calculate from this date
 * @returns {Date} - Next weekly occurrence
 */
export const getNextWeeklyDate = (originalDate, fromDate) => {
  const nextDate = new Date(originalDate);
  const weeksDiff = Math.ceil((fromDate - originalDate) / (1000 * 60 * 60 * 24 * 7));
  nextDate.setDate(originalDate.getDate() + (weeksDiff * 7));
  
  // If still in the past, add one more week
  if (nextDate <= fromDate) {
    nextDate.setDate(nextDate.getDate() + 7);
  }
  
  return nextDate;
};

/**
 * Get next monthly occurrence
 * @param {Date} originalDate - Original reminder date
 * @param {Date} fromDate - Calculate from this date
 * @returns {Date} - Next monthly occurrence
 */
export const getNextMonthlyDate = (originalDate, fromDate) => {
  const nextDate = new Date(originalDate);
  let monthsToAdd = 0;
  
  // Calculate how many months to add
  while (nextDate <= fromDate) {
    monthsToAdd++;
    nextDate.setMonth(originalDate.getMonth() + monthsToAdd);
    
    // Handle edge case where the day doesn't exist in the target month
    if (nextDate.getDate() !== originalDate.getDate()) {
      nextDate.setDate(0); // Set to last day of previous month
    }
  }
  
  return nextDate;
};

/**
 * Get next yearly occurrence
 * @param {Date} originalDate - Original reminder date
 * @param {Date} fromDate - Calculate from this date
 * @returns {Date} - Next yearly occurrence
 */
export const getNextYearlyDate = (originalDate, fromDate) => {
  const nextDate = new Date(originalDate);
  let yearsToAdd = 0;
  
  // Calculate how many years to add
  while (nextDate <= fromDate) {
    yearsToAdd++;
    nextDate.setFullYear(originalDate.getFullYear() + yearsToAdd);
  }
  
  return nextDate;
};

/**
 * Check if recurring reminder has reached its end date
 * @param {Object} reminder - The reminder object
 * @param {Date} nextDate - The calculated next occurrence date
 * @returns {boolean} - True if expired, false otherwise
 */
export const isRecurringReminderExpired = (reminder, nextDate) => {
  if (!reminder.recurringEndDate) {
    return false; // No end date set, so not expired
  }
  
  const endDate = new Date(reminder.recurringEndDate);
  return nextDate > endDate;
};

/**
 * Filter reminders that are due within the next 24 hours
 * @param {Array} reminders - Array of reminder objects
 * @returns {Array} - Filtered reminders due within 24 hours
 */
export const filterUpcomingReminders = (reminders) => {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return reminders.filter(reminder => {
    const dueDate = toDate(reminder.dueDate);
    if (!dueDate) return false;

    // For recurring reminders, also check if they need to be rescheduled
    if (reminder.recurring && reminder.recurring !== RECURRING_TYPES.NONE) {
      // If reminder is overdue and recurring, calculate next occurrence
      if (dueDate < now) {
        const nextDate = calculateNextRecurringDate(reminder);
        if (nextDate && nextDate <= next24Hours && nextDate > now) {
          return true;
        }
        return false;
      }
    }

    return dueDate > now && dueDate <= next24Hours;
  });
};

/**
 * Get reminders due today
 * @param {Array} reminders - Array of reminder objects
 * @returns {Array} - Reminders due today
 */
export const getTodayReminders = (reminders) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return reminders.filter(reminder => {
    const dueDate = toDate(reminder.dueDate);
    if (!dueDate) return false;

    return dueDate >= startOfDay && dueDate <= endOfDay;
  });
};

/**
 * Get reminders due this week
 * @param {Array} reminders - Array of reminder objects
 * @returns {Array} - Reminders due this week
 */
export const getThisWeekReminders = (reminders) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek);
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - dayOfWeek), 23, 59, 59);

  return reminders.filter(reminder => {
    const dueDate = toDate(reminder.dueDate);
    if (!dueDate) return false;

    return dueDate >= startOfWeek && dueDate <= endOfWeek;
  });
};

/**
 * Separate recurring and regular overdue reminders
 * @param {Array} overdueReminders - Array of overdue reminder objects
 * @returns {Object} - Object with recurringOverdue and regularOverdue arrays
 */
export const separateRecurringOverdue = (overdueReminders) => {
  const recurringOverdue = [];
  const regularOverdue = [];

  overdueReminders.forEach(reminder => {
    if (reminder.recurring && reminder.recurring !== RECURRING_TYPES.NONE) {
      recurringOverdue.push(reminder);
    } else {
      regularOverdue.push(reminder);
    }
  });

  return { recurringOverdue, regularOverdue };
};

export default {
  calculateNextRecurringDate,
  getNextDailyDate,
  getNextWeeklyDate,
  getNextMonthlyDate,
  getNextYearlyDate,
  isRecurringReminderExpired,
  filterUpcomingReminders,
  getTodayReminders,
  getThisWeekReminders,
  separateRecurringOverdue,
}; 