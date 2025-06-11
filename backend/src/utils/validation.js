/**
 * Custom validation utilities for the ILoveYou backend
 */

/**
 * Validate Firebase UID format
 * @param {string} uid - Firebase UID to validate
 * @returns {boolean} - True if valid UID format
 */
const isValidFirebaseUID = (uid) => {
  if (!uid || typeof uid !== 'string') {
    return false;
  }
  
  // Firebase UIDs are typically 28 characters long and alphanumeric
  const uidRegex = /^[a-zA-Z0-9]{20,}$/;
  return uidRegex.test(uid);
};

/**
 * Validate date is not in the past (excluding today)
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is today or in the future
 */
const isDateNotInPast = (date) => {
  try {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    return inputDate >= today;
  } catch (error) {
    return false;
  }
};

/**
 * Validate reminder date is reasonable (not too far in future)
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is within reasonable range
 */
const isReasonableReminderDate = (date) => {
  try {
    const inputDate = new Date(date);
    const today = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10); // 10 years in future
    
    return inputDate >= today && inputDate <= maxFutureDate;
  } catch (error) {
    return false;
  }
};

/**
 * Validate anniversary date is reasonable
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is reasonable for anniversary
 */
const isReasonableAnniversaryDate = (date) => {
  try {
    const inputDate = new Date(date);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 50); // 50 years in past
    
    return inputDate >= minDate && inputDate <= today;
  } catch (error) {
    return false;
  }
};

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} content - Content to sanitize
 * @returns {string} - Sanitized content
 */
const sanitizeHtml = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Basic HTML escaping
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize note content
 * @param {string} content - Note content to validate
 * @returns {object} - Validation result with isValid and sanitized content
 */
const validateNoteContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, content: '', error: 'Content must be a string' };
  }
  
  const maxLength = 10000; // 10KB limit
  if (content.length > maxLength) {
    return { 
      isValid: false, 
      content: '', 
      error: `Content exceeds maximum length of ${maxLength} characters` 
    };
  }
  
  const sanitized = sanitizeHtml(content);
  return { isValid: true, content: sanitized };
};

/**
 * Validate media URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid media URL
 */
const isValidMediaUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi'];
    
    if (!validProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    
    return hasValidExtension;
  } catch (error) {
    return false;
  }
};

/**
 * Validate array of tags
 * @param {array} tags - Tags array to validate
 * @returns {object} - Validation result
 */
const validateTags = (tags) => {
  if (!Array.isArray(tags)) {
    return { isValid: false, tags: [], error: 'Tags must be an array' };
  }
  
  const maxTags = 10;
  const maxTagLength = 50;
  
  if (tags.length > maxTags) {
    return { 
      isValid: false, 
      tags: [], 
      error: `Maximum ${maxTags} tags allowed` 
    };
  }
  
  const validTags = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { isValid: false, tags: [], error: 'All tags must be strings' };
    }
    
    const trimmedTag = tag.trim();
    if (trimmedTag.length === 0) {
      continue; // Skip empty tags
    }
    
    if (trimmedTag.length > maxTagLength) {
      return { 
        isValid: false, 
        tags: [], 
        error: `Tag "${trimmedTag}" exceeds maximum length of ${maxTagLength} characters` 
      };
    }
    
    validTags.push(trimmedTag.toLowerCase());
  }
  
  // Remove duplicates
  const uniqueTags = [...new Set(validTags)];
  
  return { isValid: true, tags: uniqueTags };
};

module.exports = {
  isValidFirebaseUID,
  isDateNotInPast,
  isReasonableReminderDate,
  isReasonableAnniversaryDate,
  sanitizeHtml,
  validateNoteContent,
  isValidMediaUrl,
  validateTags,
};