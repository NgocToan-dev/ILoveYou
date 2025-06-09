// Mock for src/utils/dateUtils.js
const toDate = jest.fn().mockImplementation((date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date);
  }
  // Handle Firestore timestamp-like objects
  if (date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  if (date && date.seconds) {
    return new Date(date.seconds * 1000);
  }
  return new Date(date);
});

const formatDate = jest.fn().mockImplementation((date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
});

const isToday = jest.fn().mockImplementation((date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
});

const isTomorrow = jest.fn().mockImplementation((date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkDate = new Date(date);
  return checkDate.toDateString() === tomorrow.toDateString();
});

const addDays = jest.fn().mockImplementation((date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
});

const addWeeks = jest.fn().mockImplementation((date, weeks) => {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
});

const addMonths = jest.fn().mockImplementation((date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
});

const addYears = jest.fn().mockImplementation((date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
});

module.exports = {
  toDate,
  formatDate,
  isToday,
  isTomorrow,
  addDays,
  addWeeks,
  addMonths,
  addYears
};
