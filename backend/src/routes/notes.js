const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/notes
 * @desc    Get user's notes with optional filtering and pagination
 * @access  Private
 */
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('coupleId').optional().isString().withMessage('CoupleId must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('category').optional().isString().withMessage('Category must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { coupleId, search, category } = req.query;
    
    let query = db.collection('notes').where('userId', '==', uid);
    
    // Add filters
    if (coupleId) {
      query = query.where('coupleId', '==', coupleId);
    }
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Order by creation date (most recent first)
    query = query.orderBy('createdAt', 'desc');
    
    // Get total count for pagination
    const countSnapshot = await query.get();
    const total = countSnapshot.size;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    const snapshot = await query.get();
    
    let notes = [];
    snapshot.forEach(doc => {
      const noteData = doc.data();
      
      // Apply search filter if provided (client-side filtering for now)
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = noteData.title?.toLowerCase().includes(searchLower);
        const matchesContent = noteData.content?.toLowerCase().includes(searchLower);
        const matchesTags = noteData.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesTitle && !matchesContent && !matchesTags) {
          return; // Skip this note
        }
      }
      
      notes.push({
        id: doc.id,
        ...noteData,
        createdAt: noteData.createdAt?.toDate?.() || noteData.createdAt,
        updatedAt: noteData.updatedAt?.toDate?.() || noteData.updatedAt,
      });
    });
    
    const pagination = {
      page,
      limit,
      total,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
    
    res.paginated(notes, pagination, 'Notes retrieved successfully');
  } catch (error) {
    console.error('Error getting notes:', error);
    res.error('Failed to get notes');
  }
});

/**
 * @route   GET /api/notes/:id
 * @desc    Get a specific note by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const noteDoc = await db.collection('notes').doc(id).get();
    
    if (!noteDoc.exists) {
      return res.error('Note not found', 404);
    }
    
    const noteData = noteDoc.data();
    
    // Check if user owns this note
    if (noteData.userId !== uid) {
      return res.error('Access denied', 403);
    }
    
    const note = {
      id: noteDoc.id,
      ...noteData,
      createdAt: noteData.createdAt?.toDate?.() || noteData.createdAt,
      updatedAt: noteData.updatedAt?.toDate?.() || noteData.updatedAt,
    };
    
    res.success(note, 'Note retrieved successfully');
  } catch (error) {
    console.error('Error getting note:', error);
    res.error('Failed to get note');
  }
});

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').optional().isString().withMessage('Content must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('coupleId').optional().isString().withMessage('CoupleId must be a string'),
  body('isPrivate').optional().isBoolean().withMessage('IsPrivate must be a boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { title, content, category, tags, coupleId, isPrivate, mediaUrls } = req.body;
    
    const noteData = {
      title,
      content: content || '',
      category: category || 'general',
      tags: tags || [],
      coupleId: coupleId || null,
      isPrivate: isPrivate || false,
      mediaUrls: mediaUrls || [],
      userId: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await db.collection('notes').add(noteData);
    
    res.success({
      id: docRef.id,
      ...noteData,
    }, 'Note created successfully', 201);
  } catch (error) {
    console.error('Error creating note:', error);
    res.error('Failed to create note');
  }
});

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note
 * @access  Private
 */
router.put('/:id', [
  authenticateToken,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().isString().withMessage('Content must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isPrivate').optional().isBoolean().withMessage('IsPrivate must be a boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { id } = req.params;
    
    const noteDoc = await db.collection('notes').doc(id).get();
    
    if (!noteDoc.exists) {
      return res.error('Note not found', 404);
    }
    
    const noteData = noteDoc.data();
    
    // Check if user owns this note
    if (noteData.userId !== uid) {
      return res.error('Access denied', 403);
    }
    
    const { title, content, category, tags, isPrivate, mediaUrls } = req.body;
    
    const updateData = {
      updatedAt: new Date(),
    };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls;
    
    await db.collection('notes').doc(id).update(updateData);
    
    res.success({
      id,
      ...noteData,
      ...updateData,
    }, 'Note updated successfully');
  } catch (error) {
    console.error('Error updating note:', error);
    res.error('Failed to update note');
  }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const noteDoc = await db.collection('notes').doc(id).get();
    
    if (!noteDoc.exists) {
      return res.error('Note not found', 404);
    }
    
    const noteData = noteDoc.data();
    
    // Check if user owns this note
    if (noteData.userId !== uid) {
      return res.error('Access denied', 403);
    }
    
    await db.collection('notes').doc(id).delete();
    
    res.success(null, 'Note deleted successfully');
  } catch (error) {
    console.error('Error deleting note:', error);
    res.error('Failed to delete note');
  }
});

module.exports = router;