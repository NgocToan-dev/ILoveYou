// Utility functions for date handling
// Handles both JavaScript Date objects and Firestore Timestamps

// Utility functions for date handling
// Handles both JavaScript Date objects and Firestore Timestamps

export const formatDate = (dateValue, options = {}) => {
  if (!dateValue) return 'Recently';
  
  let date;
  
  try {
    // Check if it's a Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } 
    // Check if it's already a JavaScript Date
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Check if it's a string or number that can be converted to Date
    else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    else {
      return 'Recently';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    // Return formatted date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Recently';
  }
};

export const getDaysSince = (dateValue) => {
  if (!dateValue) return 0;
  
  let date;
  
  try {
    // Check if it's a Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } 
    // Check if it's already a JavaScript Date
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Check if it's a string or number that can be converted to Date
    else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    else {
      return 0;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 0;
    }
    
    const diffTime = new Date() - date;
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days); // Ensure no negative days
  } catch (error) {
    console.warn('Error calculating days since:', error);
    return 0;
  }
};

export const toDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Check if it's a Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    } 
    // Check if it's already a JavaScript Date
    else if (dateValue instanceof Date) {
      return dateValue;
    }
    // Check if it's a string or number that can be converted to Date
    else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.warn('Error converting to date:', error);
    return null;
  }
};
