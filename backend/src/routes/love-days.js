const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/love-days
 * @desc    Get love days/milestones for a couple
 * @access  Private
 */
router.get('/', [
  authenticateToken,
  query('coupleId').notEmpty().withMessage('Couple ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { coupleId } = req.query;
    
    // Verify user is part of this couple
    const coupleDoc = await db.collection('couples').doc(coupleId).get();
    
    if (!coupleDoc.exists) {
      return res.error('Couple not found', 404);
    }
    
    const coupleData = coupleDoc.data();
    const isPartner1 = coupleData.partner1?.uid === uid;
    const isPartner2 = coupleData.partner2?.uid === uid;
    
    if (!isPartner1 && !isPartner2) {
      return res.error('Access denied', 403);
    }
    
    // Calculate love days based on anniversary date
    const anniversaryDate = coupleData.anniversaryDate?.toDate?.() || new Date(coupleData.anniversaryDate);
    const today = new Date();
    const timeDiff = today.getTime() - anniversaryDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Calculate milestones
    const milestones = [];
    
    // Generate milestone data
    const milestoneTypes = [
      { days: 100, type: '100_days', title: '100 Days Together' },
      { days: 200, type: '200_days', title: '200 Days Together' },
      { days: 300, type: '300_days', title: '300 Days Together' },
      { days: 365, type: '1_year', title: '1 Year Anniversary' },
      { days: 500, type: '500_days', title: '500 Days Together' },
      { days: 730, type: '2_years', title: '2 Years Anniversary' },
      { days: 1000, type: '1000_days', title: '1000 Days Together' },
      { days: 1095, type: '3_years', title: '3 Years Anniversary' },
      { days: 1460, type: '4_years', title: '4 Years Anniversary' },
      { days: 1500, type: '1500_days', title: '1500 Days Together' },
      { days: 1825, type: '5_years', title: '5 Years Anniversary' },
      { days: 2000, type: '2000_days', title: '2000 Days Together' },
      { days: 2190, type: '6_years', title: '6 Years Anniversary' },
      { days: 2555, type: '7_years', title: '7 Years Anniversary' },
      { days: 2920, type: '8_years', title: '8 Years Anniversary' },
      { days: 3285, type: '9_years', title: '9 Years Anniversary' },
      { days: 3650, type: '10_years', title: '10 Years Anniversary' },
    ];
    
    milestoneTypes.forEach(milestone => {
      const milestoneDate = new Date(anniversaryDate);
      milestoneDate.setDate(milestoneDate.getDate() + milestone.days);
      
      const isPassed = daysDiff >= milestone.days;
      const daysUntil = isPassed ? 0 : milestone.days - daysDiff;
      
      milestones.push({
        type: milestone.type,
        title: milestone.title,
        targetDays: milestone.days,
        date: milestoneDate,
        isPassed,
        daysUntil,
        isUpcoming: !isPassed && daysUntil <= 30, // Mark as upcoming if within 30 days
      });
    });
    
    // Sort milestones by target days
    milestones.sort((a, b) => a.targetDays - b.targetDays);
    
    const loveDaysData = {
      coupleId,
      anniversaryDate,
      currentDays: Math.max(0, daysDiff),
      totalMilestones: milestones.length,
      achievedMilestones: milestones.filter(m => m.isPassed).length,
      upcomingMilestones: milestones.filter(m => m.isUpcoming).length,
      nextMilestone: milestones.find(m => !m.isPassed) || null,
      milestones,
    };
    
    res.success(loveDaysData, 'Love days retrieved successfully');
  } catch (error) {
    console.error('Error getting love days:', error);
    res.error('Failed to get love days');
  }
});

/**
 * @route   GET /api/love-days/current
 * @desc    Get current love day count for a couple
 * @access  Private
 */
router.get('/current', [
  authenticateToken,
  query('coupleId').notEmpty().withMessage('Couple ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { coupleId } = req.query;
    
    // Verify user is part of this couple
    const coupleDoc = await db.collection('couples').doc(coupleId).get();
    
    if (!coupleDoc.exists) {
      return res.error('Couple not found', 404);
    }
    
    const coupleData = coupleDoc.data();
    const isPartner1 = coupleData.partner1?.uid === uid;
    const isPartner2 = coupleData.partner2?.uid === uid;
    
    if (!isPartner1 && !isPartner2) {
      return res.error('Access denied', 403);
    }
    
    // Calculate current love days
    const anniversaryDate = coupleData.anniversaryDate?.toDate?.() || new Date(coupleData.anniversaryDate);
    const today = new Date();
    const timeDiff = today.getTime() - anniversaryDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    const currentLoveDays = {
      coupleId,
      anniversaryDate,
      currentDays: Math.max(0, daysDiff),
      currentDate: today,
    };
    
    res.success(currentLoveDays, 'Current love days retrieved successfully');
  } catch (error) {
    console.error('Error getting current love days:', error);
    res.error('Failed to get current love days');
  }
});

/**
 * @route   GET /api/love-days/milestones/upcoming
 * @desc    Get upcoming milestones for a couple
 * @access  Private
 */
router.get('/milestones/upcoming', [
  authenticateToken,
  query('coupleId').notEmpty().withMessage('Couple ID is required'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { coupleId } = req.query;
    const limit = parseInt(req.query.limit) || 5;
    
    // Verify user is part of this couple
    const coupleDoc = await db.collection('couples').doc(coupleId).get();
    
    if (!coupleDoc.exists) {
      return res.error('Couple not found', 404);
    }
    
    const coupleData = coupleDoc.data();
    const isPartner1 = coupleData.partner1?.uid === uid;
    const isPartner2 = coupleData.partner2?.uid === uid;
    
    if (!isPartner1 && !isPartner2) {
      return res.error('Access denied', 403);
    }
    
    // Calculate upcoming milestones
    const anniversaryDate = coupleData.anniversaryDate?.toDate?.() || new Date(coupleData.anniversaryDate);
    const today = new Date();
    const timeDiff = today.getTime() - anniversaryDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    const milestoneTypes = [
      { days: 100, type: '100_days', title: '100 Days Together' },
      { days: 200, type: '200_days', title: '200 Days Together' },
      { days: 300, type: '300_days', title: '300 Days Together' },
      { days: 365, type: '1_year', title: '1 Year Anniversary' },
      { days: 500, type: '500_days', title: '500 Days Together' },
      { days: 730, type: '2_years', title: '2 Years Anniversary' },
      { days: 1000, type: '1000_days', title: '1000 Days Together' },
      { days: 1095, type: '3_years', title: '3 Years Anniversary' },
      { days: 1460, type: '4_years', title: '4 Years Anniversary' },
      { days: 1500, type: '1500_days', title: '1500 Days Together' },
      { days: 1825, type: '5_years', title: '5 Years Anniversary' },
    ];
    
    const upcomingMilestones = milestoneTypes
      .filter(milestone => daysDiff < milestone.days)
      .map(milestone => {
        const milestoneDate = new Date(anniversaryDate);
        milestoneDate.setDate(milestoneDate.getDate() + milestone.days);
        
        return {
          type: milestone.type,
          title: milestone.title,
          targetDays: milestone.days,
          date: milestoneDate,
          daysUntil: milestone.days - daysDiff,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, limit);
    
    res.success(upcomingMilestones, 'Upcoming milestones retrieved successfully');
  } catch (error) {
    console.error('Error getting upcoming milestones:', error);
    res.error('Failed to get upcoming milestones');
  }
});

/**
 * @route   POST /api/love-days/celebrate
 * @desc    Mark a milestone as celebrated
 * @access  Private
 */
router.post('/celebrate', [
  authenticateToken,
  body('coupleId').notEmpty().withMessage('Couple ID is required'),
  body('milestoneType').notEmpty().withMessage('Milestone type is required'),
  body('message').optional().isString().withMessage('Message must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { uid } = req.user;
    const { coupleId, milestoneType, message } = req.body;
    
    // Verify user is part of this couple
    const coupleDoc = await db.collection('couples').doc(coupleId).get();
    
    if (!coupleDoc.exists) {
      return res.error('Couple not found', 404);
    }
    
    const coupleData = coupleDoc.data();
    const isPartner1 = coupleData.partner1?.uid === uid;
    const isPartner2 = coupleData.partner2?.uid === uid;
    
    if (!isPartner1 && !isPartner2) {
      return res.error('Access denied', 403);
    }
    
    // Create celebration record
    const celebrationData = {
      coupleId,
      milestoneType,
      message: message || '',
      celebratedBy: uid,
      celebratedAt: new Date(),
      createdAt: new Date(),
    };
    
    const docRef = await db.collection('celebrations').add(celebrationData);
    
    res.success({
      id: docRef.id,
      ...celebrationData,
    }, 'Milestone celebration recorded successfully', 201);
  } catch (error) {
    console.error('Error recording celebration:', error);
    res.error('Failed to record celebration');
  }
});

module.exports = router;