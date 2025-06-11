const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/couples/me
 * @desc    Get current user's couple information
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Find couple where user is either partner1 or partner2
    const couplesSnapshot = await db.collection('couples')
      .where('partner1.uid', '==', uid)
      .get();
    
    let coupleDoc = null;
    if (couplesSnapshot.empty) {
      const couplesSnapshot2 = await db.collection('couples')
        .where('partner2.uid', '==', uid)
        .get();
      
      if (!couplesSnapshot2.empty) {
        coupleDoc = couplesSnapshot2.docs[0];
      }
    } else {
      coupleDoc = couplesSnapshot.docs[0];
    }
    
    if (!coupleDoc) {
      return res.error('No couple found for this user', 404);
    }
    
    const coupleData = coupleDoc.data();
    
    const couple = {
      id: coupleDoc.id,
      ...coupleData,
      anniversaryDate: coupleData.anniversaryDate?.toDate?.() || coupleData.anniversaryDate,
      createdAt: coupleData.createdAt?.toDate?.() || coupleData.createdAt,
      updatedAt: coupleData.updatedAt?.toDate?.() || coupleData.updatedAt,
    };
    
    res.success(couple, 'Couple information retrieved successfully');
  } catch (error) {
    console.error('Error getting couple:', error);
    res.error('Failed to get couple information');
  }
});

/**
 * @route   POST /api/couples
 * @desc    Create a new couple or join existing invitation
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  body('anniversaryDate').isISO8601().withMessage('Valid anniversary date is required'),
  body('partnerEmail').optional().isEmail().withMessage('Valid partner email is required'),
  body('coupleCode').optional().isString().withMessage('Couple code must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid, email, name } = req.user;
    const { anniversaryDate, partnerEmail, coupleCode } = req.body;
    
    // Check if user already has a couple
    const existingCouples = await db.collection('couples')
      .where('partner1.uid', '==', uid)
      .get();
    
    if (existingCouples.empty) {
      const existingCouples2 = await db.collection('couples')
        .where('partner2.uid', '==', uid)
        .get();
      
      if (!existingCouples2.empty) {
        return res.error('User is already part of a couple', 400);
      }
    } else {
      return res.error('User is already part of a couple', 400);
    }
    
    // If joining with couple code
    if (coupleCode) {
      const coupleSnapshot = await db.collection('couples')
        .where('inviteCode', '==', coupleCode)
        .where('status', '==', 'pending')
        .get();
      
      if (coupleSnapshot.empty) {
        return res.error('Invalid or expired couple code', 400);
      }
      
      const coupleDoc = coupleSnapshot.docs[0];
      const coupleData = coupleDoc.data();
      
      // Update couple with second partner
      const updateData = {
        partner2: {
          uid,
          email,
          name: name || email,
        },
        status: 'active',
        inviteCode: null, // Remove invite code once used
        updatedAt: new Date(),
      };
      
      await db.collection('couples').doc(coupleDoc.id).update(updateData);
      
      const updatedCouple = {
        id: coupleDoc.id,
        ...coupleData,
        ...updateData,
      };
      
      return res.success(updatedCouple, 'Successfully joined couple', 201);
    }
    
    // Create new couple
    const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const coupleData = {
      partner1: {
        uid,
        email,
        name: name || email,
      },
      partner2: null,
      anniversaryDate: new Date(anniversaryDate),
      status: partnerEmail ? 'pending' : 'single',
      inviteCode,
      invitedEmail: partnerEmail || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await db.collection('couples').add(coupleData);
    
    res.success({
      id: docRef.id,
      ...coupleData,
    }, 'Couple created successfully', 201);
  } catch (error) {
    console.error('Error creating couple:', error);
    res.error('Failed to create couple');
  }
});

/**
 * @route   PUT /api/couples/:id
 * @desc    Update couple information
 * @access  Private
 */
router.put('/:id', [
  authenticateToken,
  body('anniversaryDate').optional().isISO8601().withMessage('Valid anniversary date is required'),
  body('relationshipStatus').optional().isString().withMessage('Relationship status must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { id } = req.params;
    
    const coupleDoc = await db.collection('couples').doc(id).get();
    
    if (!coupleDoc.exists) {
      return res.error('Couple not found', 404);
    }
    
    const coupleData = coupleDoc.data();
    
    // Check if user is part of this couple
    const isPartner1 = coupleData.partner1?.uid === uid;
    const isPartner2 = coupleData.partner2?.uid === uid;
    
    if (!isPartner1 && !isPartner2) {
      return res.error('Access denied', 403);
    }
    
    const { anniversaryDate, relationshipStatus } = req.body;
    
    const updateData = {
      updatedAt: new Date(),
    };
    
    if (anniversaryDate !== undefined) updateData.anniversaryDate = new Date(anniversaryDate);
    if (relationshipStatus !== undefined) updateData.relationshipStatus = relationshipStatus;
    
    await db.collection('couples').doc(id).update(updateData);
    
    res.success({
      id,
      ...coupleData,
      ...updateData,
    }, 'Couple updated successfully');
  } catch (error) {
    console.error('Error updating couple:', error);
    res.error('Failed to update couple');
  }
});

/**
 * @route   POST /api/couples/:id/leave
 * @desc    Leave or dissolve a couple
 * @access  Private
 */
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const coupleDoc = await db.collection('couples').doc(id).get();
    
    if (!coupleDoc.exists) {
      return res.error('Couple not found', 404);
    }
    
    const coupleData = coupleDoc.data();
    
    // Check if user is part of this couple
    const isPartner1 = coupleData.partner1?.uid === uid;
    const isPartner2 = coupleData.partner2?.uid === uid;
    
    if (!isPartner1 && !isPartner2) {
      return res.error('Access denied', 403);
    }
    
    // If only one partner, delete the couple
    if (!coupleData.partner2 || coupleData.status === 'pending') {
      await db.collection('couples').doc(id).delete();
      return res.success(null, 'Couple dissolved successfully');
    }
    
    // If both partners exist, remove the leaving partner
    const updateData = {
      status: 'single',
      updatedAt: new Date(),
    };
    
    if (isPartner1) {
      updateData.partner1 = coupleData.partner2;
      updateData.partner2 = null;
    } else {
      updateData.partner2 = null;
    }
    
    await db.collection('couples').doc(id).update(updateData);
    
    res.success(null, 'Successfully left couple');
  } catch (error) {
    console.error('Error leaving couple:', error);
    res.error('Failed to leave couple');
  }
});

/**
 * @route   GET /api/couples/:id/invite-code
 * @desc    Generate or get existing invite code
 * @access  Private
 */
router.get('/:id/invite-code', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    const coupleDoc = await db.collection('couples').doc(id).get();
    
    if (!coupleDoc.exists) {
      return res.error('Couple not found', 404);
    }
    
    const coupleData = coupleDoc.data();
    
    // Check if user is part of this couple
    const isPartner1 = coupleData.partner1?.uid === uid;
    const isPartner2 = coupleData.partner2?.uid === uid;
    
    if (!isPartner1 && !isPartner2) {
      return res.error('Access denied', 403);
    }
    
    // Generate new invite code if none exists or couple is already complete
    let inviteCode = coupleData.inviteCode;
    
    if (!inviteCode || coupleData.status === 'active') {
      inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      
      await db.collection('couples').doc(id).update({
        inviteCode,
        status: 'pending',
        updatedAt: new Date(),
      });
    }
    
    res.success({ inviteCode }, 'Invite code generated successfully');
  } catch (error) {
    console.error('Error generating invite code:', error);
    res.error('Failed to generate invite code');
  }
});

module.exports = router;