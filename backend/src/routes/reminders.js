const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/reminders
 * @desc    Get user's reminders with optional filtering and pagination
 * @access  Private
 */
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('coupleId').optional().isString().withMessage('CoupleId must be a string'),
  query('status').optional().isIn(['pending', 'completed', 'snoozed']).withMessage('Status must be pending, completed, or snoozed'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { coupleId, status, priority } = req.query;
    
    let query = db.collection('reminders').where('userId', '==', uid);
    
    // Add filters
    if (coupleId) {
      query = query.where('coupleId', '==', coupleId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (priority) {
      query = query.where('priority', '==', priority);
    }
    
    // Order by reminder date
    query = query.orderBy('reminderDate', 'asc');
    
    // Get total count for pagination
    const countSnapshot = await query.get();
    const total = countSnapshot.size;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    const snapshot = await query.get();
    
    const reminders = [];
    snapshot.forEach(doc => {
      const reminderData = doc.data();
      reminders.push({
        id: doc.id,
        ...reminderData,
        reminderDate: reminderData.reminderDate?.toDate?.() || reminderData.reminderDate,
        createdAt: reminderData.createdAt?.toDate?.() || reminderData.createdAt,
        updatedAt: reminderData.updatedAt?.toDate?.() || reminderData.updatedAt,
        completedAt: reminderData.completedAt?.toDate?.() || reminderData.completedAt,
        snoozedUntil: reminderData.snoozedUntil?.toDate?.() || reminderData.snoozedUntil,
      });
    });
    
    const pagination = {
      page,
      limit,
      total,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
    
    res.paginated(reminders, pagination, 'Reminders retrieved successfully');
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.error('Failed to get reminders');
  }
});

/**
 * @route   GET /api/reminders/:id
 * @desc    Get a specific reminder by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const reminderDoc = await db.collection('reminders').doc(id).get();
    
    if (!reminderDoc.exists) {
      return res.error('Reminder not found', 404);
    }
    
    const reminderData = reminderDoc.data();
    
    // Check if user owns this reminder
    if (reminderData.userId !== uid) {
      return res.error('Access denied', 403);
    }
    
    const reminder = {
      id: reminderDoc.id,
      ...reminderData,
      reminderDate: reminderData.reminderDate?.toDate?.() || reminderData.reminderDate,
      createdAt: reminderData.createdAt?.toDate?.() || reminderData.createdAt,
      updatedAt: reminderData.updatedAt?.toDate?.() || reminderData.updatedAt,
      completedAt: reminderData.completedAt?.toDate?.() || reminderData.completedAt,
      snoozedUntil: reminderData.snoozedUntil?.toDate?.() || reminderData.snoozedUntil,
    };
    
    res.success(reminder, 'Reminder retrieved successfully');
  } catch (error) {
    console.error('Error getting reminder:', error);
    res.error('Failed to get reminder');
  }
});

/**
 * @route   POST /api/reminders
 * @desc    Create a new reminder
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('reminderDate').isISO8601().withMessage('Valid reminder date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('repeatType').optional().isIn(['none', 'daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid repeat type'),
  body('coupleId').optional().isString().withMessage('CoupleId must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { title, description, reminderDate, priority, repeatType, coupleId, notificationEnabled } = req.body;
    
    const reminderData = {
      title,
      description: description || '',
      reminderDate: new Date(reminderDate),
      priority: priority || 'medium',
      repeatType: repeatType || 'none',
      status: 'pending',
      coupleId: coupleId || null,
      notificationEnabled: notificationEnabled !== false,
      userId: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await db.collection('reminders').add(reminderData);
    
    res.success({
      id: docRef.id,
      ...reminderData,
    }, 'Reminder created successfully', 201);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.error('Failed to create reminder');
  }
});

/**
 * @route   PUT /api/reminders/:id
 * @desc    Update a reminder
 * @access  Private
 */
router.put('/:id', [
  authenticateToken,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('reminderDate').optional().isISO8601().withMessage('Valid reminder date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('repeatType').optional().isIn(['none', 'daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid repeat type'),
  body('status').optional().isIn(['pending', 'completed', 'snoozed']).withMessage('Status must be pending, completed, or snoozed'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { id } = req.params;
    
    const reminderDoc = await db.collection('reminders').doc(id).get();
    
    if (!reminderDoc.exists) {
      return res.error('Reminder not found', 404);
    }
    
    const reminderData = reminderDoc.data();
    
    // Check if user owns this reminder
    if (reminderData.userId !== uid) {
      return res.error('Access denied', 403);
    }
    
    const { title, description, reminderDate, priority, repeatType, status, notificationEnabled } = req.body;
    
    const updateData = {
      updatedAt: new Date(),
    };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (reminderDate !== undefined) updateData.reminderDate = new Date(reminderDate);
    if (priority !== undefined) updateData.priority = priority;
    if (repeatType !== undefined) updateData.repeatType = repeatType;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (notificationEnabled !== undefined) updateData.notificationEnabled = notificationEnabled;
    
    await db.collection('reminders').doc(id).update(updateData);
    
    res.success({
      id,
      ...reminderData,
      ...updateData,
    }, 'Reminder updated successfully');
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.error('Failed to update reminder');
  }
});

/**
 * @route   POST /api/reminders/:id/snooze
 * @desc    Snooze a reminder
 * @access  Private
 */
router.post('/:id/snooze', [
  authenticateToken,
  body('snoozeUntil').isISO8601().withMessage('Valid snooze date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { id } = req.params;
    const { snoozeUntil } = req.body;
    
    const reminderDoc = await db.collection('reminders').doc(id).get();
    
    if (!reminderDoc.exists) {
      return res.error('Reminder not found', 404);
    }
    
    const reminderData = reminderDoc.data();
    
    // Check if user owns this reminder
    if (reminderData.userId !== uid) {
      return res.error('Access denied', 403);
    }
    
    const updateData = {
      status: 'snoozed',
      snoozedUntil: new Date(snoozeUntil),
      updatedAt: new Date(),
    };
    
    await db.collection('reminders').doc(id).update(updateData);
    
    res.success({
      id,
      ...reminderData,
      ...updateData,
    }, 'Reminder snoozed successfully');
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.error('Failed to snooze reminder');
  }
});

/**
 * @route   DELETE /api/reminders/:id
 * @desc    Delete a reminder
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const reminderDoc = await db.collection('reminders').doc(id).get();
    
    if (!reminderDoc.exists) {
      return res.error('Reminder not found', 404);
    }
    
    const reminderData = reminderDoc.data();
    
    // Check if user owns this reminder
    if (reminderData.userId !== uid) {
      return res.error('Access denied', 403);
    }
    
    await db.collection('reminders').doc(id).delete();
    
    res.success(null, 'Reminder deleted successfully');
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.error('Failed to delete reminder');
  }
});

module.exports = router;