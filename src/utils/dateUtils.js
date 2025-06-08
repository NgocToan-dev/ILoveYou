// Utility functions for date handling
// Handles both JavaScript Date objects and Firestore Timestamps

// Safe function to convert any date value to JavaScript Date
const safeToDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Check if it's a Firestore Timestamp with toDate method
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    } 
    // Check if it's already a JavaScript Date
    else if (dateValue instanceof Date) {
      return dateValue;
    }
    // Handle Firebase Timestamp object format {seconds, nanoseconds}
    else if (typeof dateValue === 'object' && 
             dateValue !== null && 
             typeof dateValue.seconds === 'number') {
      const seconds = dateValue.seconds;
      const nanoseconds = dateValue.nanoseconds || 0;
      
      // Validate timestamp ranges
      if (seconds < 0 || seconds > 253402300799) { // Max valid Unix timestamp
        console.warn('Invalid timestamp seconds:', seconds);
        return null;
      }
      
      if (nanoseconds < 0 || nanoseconds > 999999999) {
        console.warn('Invalid timestamp nanoseconds:', nanoseconds);
        return null;
      }
      
      const date = new Date(seconds * 1000 + Math.floor(nanoseconds / 1000000));
      return isNaN(date.getTime()) ? null : date;
    }
    // Check if it's a string or number that can be converted to Date
    else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.warn('Error in safeToDate:', error);
    return null;
  }
};

export const formatDate = (dateValue, options = {}) => {
  if (!dateValue) return 'Recently';
  
  try {
    const date = safeToDate(dateValue);
    
    if (!date) {
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
  
  try {
    const date = safeToDate(dateValue);
    
    if (!date) {
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
  return safeToDate(dateValue);
};

export const formatDateString = (dateValue, format = 'default', locale = 'vi-VN') => {
  if (!dateValue) return '';
  
  try {
    const date = safeToDate(dateValue);
    
    if (!date) {
      return '';
    }
    
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(Math.abs(diffTime) / (1000 * 60));
    const diffHours = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60));
    const diffDays = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
    // Format based on requested format
    switch (format) {
      case 'relative':
        // Relative time format (e.g., "5 minutes ago", "3 days ago")
        if (diffMinutes < 1) {
          return locale === 'vi-VN' ? 'Vừa xong' : 'Just now';
        } else if (diffMinutes < 60) {
          return locale === 'vi-VN' ? `${diffMinutes} phút trước` : `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
          return locale === 'vi-VN' ? `${diffHours} giờ trước` : `${diffHours}h ago`;
        } else if (diffDays < 7) {
          return locale === 'vi-VN' ? `${diffDays} ngày trước` : `${diffDays}d ago`;
        } else {
          return formatDateString(dateValue, 'short', locale);
        }
        
      case 'short':
        // Short date format (e.g., "15/06/2025")
        return date.toLocaleDateString(locale === 'vi-VN' ? 'vi-VN' : 'en-US');
        
      case 'medium':
        // Medium date format (e.g., "15 tháng 6, 2025")
        return date.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
      case 'long':
        // Long date format (e.g., "Thứ Hai, 15 tháng 6 năm 2025")
        return date.toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'time':
        // Time only format (e.g., "14:30")
        return date.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
      case 'datetime':
        // Date and time format (e.g., "15/06/2025 14:30")
        const dateStr = date.toLocaleDateString(locale === 'vi-VN' ? 'vi-VN' : 'en-US');
        const timeStr = date.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `${dateStr} ${timeStr}`;
        
      case 'due':
        // Due date format for reminders (e.g., "Hôm nay", "Ngày mai", "Quá hạn 2 ngày")
        if (diffDays < 0) {
          const daysOverdue = Math.abs(diffDays);
          return locale === 'vi-VN' 
            ? `Quá hạn ${daysOverdue} ngày` 
            : `${daysOverdue} days overdue`;
        } else if (diffDays == 0) {
          return locale === 'vi-VN' ? 'Hôm nay' : 'Today';
        } else if (diffDays == 1) {
          return locale === 'vi-VN' ? 'Ngày mai' : 'Tomorrow';
        } else if (diffDays <= 7) {
          return locale === 'vi-VN' 
            ? `${diffDays} ngày nữa` 
            : `In ${diffDays} days`;
        } else {
          return formatDateString(dateValue, 'short', locale);
        }
        
      case 'smart':
        // Smart format that chooses the best format based on the date
        if (diffDays === 0) {
          return locale === 'vi-VN' ? 'Hôm nay' : 'Today';
        } else if (diffDays === 1) {
          return locale === 'vi-VN' ? 'Hôm qua' : 'Yesterday';
        } else if (diffDays <= 7) {
          return locale === 'vi-VN' 
            ? `${diffDays} ngày trước` 
            : `${diffDays} days ago`;
        } else if (diffDays <= 30) {
          return formatDateString(dateValue, 'short', locale);
        } else {
          return formatDateString(dateValue, 'medium', locale);
        }
        
      case 'milestone':
        // Special format for milestones (e.g., "15 tháng 6 năm 2025")
        return date.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      default:
        // Default format - same as medium
        return date.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    }
  } catch (error) {
    console.warn('Error formatting date string:', error);
    return '';
  }
};

// Helper function to get formatted relative time for Vietnamese
export const getVietnameseRelativeTime = (dateValue) => {
  return formatDateString(dateValue, 'relative', 'vi-VN');
};

// Helper function to format date for display in UI components
export const formatDisplayDate = (dateValue, options = {}) => {
  const {
    format = 'smart',
    locale = 'vi-VN',
    fallback = 'Không xác định'
  } = options;
  
  const result = formatDateString(dateValue, format, locale);
  return result || fallback;
};
