const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.error('User not found', 404);
    }
    
    const userData = userDoc.data();
    
    res.success({
      uid,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      emailVerified: req.user.emailVerified,
      ...userData,
    }, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.error('Failed to get user profile');
  }
});

/**
 * @route   POST /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.post('/profile', [
  authenticateToken,
  body('name').optional().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
  body('language').optional().isIn(['en', 'vi']).withMessage('Language must be en or vi'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { name, dateOfBirth, timezone, language, ...otherFields } = req.body;
    
    const updateData = {
      updatedAt: new Date(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (language !== undefined) updateData.language = language;
    
    // Add other non-sensitive fields
    Object.keys(otherFields).forEach(key => {
      if (!['password', 'email', 'uid'].includes(key)) {
        updateData[key] = otherFields[key];
      }
    });
    
    await db.collection('users').doc(uid).set(updateData, { merge: true });
    
    res.success(updateData, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.error('Failed to update profile');
  }
});

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify Firebase ID token
 * @access  Public
 */
router.post('/verify-token', [
  body('token').notEmpty().withMessage('Token is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { token } = req.body;
    
    const decodedToken = await auth.verifyIdToken(token);
    
    res.success({
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    }, 'Token is valid');
  } catch (error) {
    console.error('Token verification error:', error);
    res.error('Invalid token', 401);
  }
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh user token
 * @access  Private
 */
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    // Firebase Admin SDK doesn't handle token refresh directly
    // This endpoint confirms the current token is valid
    res.success({
      uid: req.user.uid,
      email: req.user.email,
      tokenValid: true,
    }, 'Token is still valid');
  } catch (error) {
    console.error('Token refresh error:', error);
    res.error('Failed to refresh token');
  }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Delete user data from Firestore
    await db.collection('users').doc(uid).delete();
    
    // Delete user from Firebase Auth
    await auth.deleteUser(uid);
    
    res.success(null, 'Account deleted successfully');
  } catch (error) {
    console.error('Error deleting account:', error);
    res.error('Failed to delete account');
  }
});

module.exports = router;