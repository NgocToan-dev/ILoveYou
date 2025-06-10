const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Scheduled function to check for due reminders
 * Runs every hour
 */
const scheduleReminderCheck = onSchedule('0 * * * *', async (_context) => {
  console.log('Running scheduled reminder check...');
  
  try {
    const now = Timestamp.now();
    
    // Query for due reminders that haven't been sent
    const query = getFirestore()
      .collection('reminders')
      .where('dueDate', '<=', now)
      .where('completed', '==', false)
      .where('notificationSent', '==', false);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No due reminders found');
      return;
    }
    
    console.log(`Found ${snapshot.size} due reminders`);
    
    const batch = getFirestore().batch();
    let processedCount = 0;
    
    for (const doc of snapshot.docs) {
      const reminder = { id: doc.id, ...doc.data() };
      
      try {
        await sendReminderNotification(reminder);
        
        // Mark as sent
        batch.update(doc.ref, {
          notificationSent: true,
          lastNotificationSent: FieldValue.serverTimestamp(),
        });
        
        processedCount++;
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
        
        // Update error info
        batch.update(doc.ref, {
          lastNotificationError: error.message,
          notificationAttempts: FieldValue.increment(1),
        });
      }
    }
    
    await batch.commit();
    console.log(`Processed ${processedCount} reminders successfully`);
    
  } catch (error) {
    console.error('Error in scheduled reminder check:', error);
  }
});

/**
 * Clean up old completed reminders
 * Runs daily at 2 AM
 */
const cleanupOldReminders = onSchedule('0 2 * * *', async (_context) => {
  console.log('Running cleanup of old reminders...');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = Timestamp.fromDate(thirtyDaysAgo);
    
    // Query for old completed reminders
    const query = getFirestore()
      .collection('reminders')
      .where('completed', '==', true)
      .where('completedAt', '<', cutoffDate);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No old reminders to clean up');
      return;
    }
    
    console.log(`Cleaning up ${snapshot.size} old reminders`);
    
    const batch = getFirestore().batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${snapshot.size} old reminders`);
    
  } catch (error) {
    console.error('Error in cleanup old reminders:', error);
  }
});

/**
 * Check for peaceful days milestones
 * Runs daily at 8 AM
 */
const checkPeacefulDaysMilestones = onSchedule('0 8 * * *', async (_context) => {
  console.log('Checking peaceful days milestones...');
  
  try {
    // Query couples with peaceful days enabled
    const query = getFirestore()
      .collection('couples')
      .where('peacefulDays.enabled', '==', true);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No couples with peaceful days enabled');
      return;
    }
    
    console.log(`Checking ${snapshot.size} couples for milestones`);
    
    for (const doc of snapshot.docs) {
      const couple = { id: doc.id, ...doc.data() };
      const peacefulDays = couple.peacefulDays;
      
      if (!peacefulDays || peacefulDays.currentStreak <= 0) {
        continue;
      }
      
      // Check for milestone days (7, 14, 30, 60, 90, 180, 365)
      const milestones = [7, 14, 30, 60, 90, 180, 365];
      const currentStreak = peacefulDays.currentStreak;
      
      if (milestones.includes(currentStreak)) {
        try {
          await sendPeacefulDaysMilestone(couple.id, currentStreak);
          console.log(`Sent milestone notification for couple ${couple.id}: ${currentStreak} days`);
        } catch (error) {
          console.error(`Failed to send milestone notification for couple ${couple.id}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking peaceful days milestones:', error);
  }
});

/**
 * Handle recurring reminders
 * Triggered when a reminder is completed
 */
const handleRecurringReminders = onDocumentWritten('reminders/{reminderId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  
  // Check if reminder was just completed and has recurring settings
  if (!before?.completed && after?.completed && after?.recurring?.enabled) {
    console.log('Handling recurring reminder:', event.params.reminderId);
    
    try {
      const reminder = { id: event.params.reminderId, ...after };
      await createRecurringReminder(reminder);
    } catch (error) {
      console.error('Error handling recurring reminder:', error);
    }
  }
});

/**
 * Send reminder notification
 */
async function sendReminderNotification(reminder) {
  if (reminder.type === 'couple' && reminder.coupleId) {
    return await sendCoupleReminder(reminder);
  } else if (reminder.userId) {
    return await sendPersonalReminder(reminder);
  }
  
  throw new Error('Invalid reminder type or missing user/couple ID');
}

/**
 * Send personal reminder notification
 */
async function sendPersonalReminder(reminder) {
  const userDoc = await getFirestore()
    .collection('users')
    .doc(reminder.userId)
    .get();
  
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  const fcmToken = userData?.fcmToken;
  
  if (!fcmToken) {
    throw new Error('No FCM token for user');
  }
  
  const message = {
    token: fcmToken,
    notification: {
      title: '💕 Nhắc nhở yêu thương',
      body: `Đừng quên: ${reminder.title}`,
    },
    data: {
      type: 'reminder',
      reminderId: reminder.id,
      priority: reminder.priority || 'medium',
    },
  };
  
  return await getMessaging().send(message);
}

/**
 * Send couple reminder notification
 */
async function sendCoupleReminder(reminder) {
  const coupleDoc = await getFirestore()
    .collection('couples')
    .doc(reminder.coupleId)
    .get();
  
  if (!coupleDoc.exists) {
    throw new Error('Couple not found');
  }
  
  const coupleData = coupleDoc.data();
  const members = coupleData?.members || [];
  
  if (members.length !== 2) {
    throw new Error('Invalid couple configuration');
  }
  
  // Send to partner (not creator)
  const partnerId = members.find(id => id !== reminder.creatorId);
  
  if (!partnerId) {
    throw new Error('Partner not found');
  }
  
  const partnerDoc = await getFirestore()
    .collection('users')
    .doc(partnerId)
    .get();
  
  if (!partnerDoc.exists) {
    throw new Error('Partner not found');
  }
  
  const partnerData = partnerDoc.data();
  const fcmToken = partnerData?.fcmToken;
  
  if (!fcmToken) {
    throw new Error('No FCM token for partner');
  }
  
  // Get creator name
  const creatorDoc = await getFirestore()
    .collection('users')
    .doc(reminder.creatorId)
    .get();
  
  const creatorName = creatorDoc.exists 
    ? creatorDoc.data()?.displayName || 'Người yêu của bạn'
    : 'Người yêu của bạn';
  
  const message = {
    token: fcmToken,
    notification: {
      title: '💕 Nhắc nhở yêu thương',
      body: `💕 Nhắc nhở từ ${creatorName}: ${reminder.title}`,
    },
    data: {
      type: 'couple-reminder',
      reminderId: reminder.id,
      coupleId: reminder.coupleId,
      creatorId: reminder.creatorId,
    },
  };
  
  return await getMessaging().send(message);
}

/**
 * Send peaceful days milestone notification
 */
async function sendPeacefulDaysMilestone(coupleId, days) {
  const coupleDoc = await getFirestore()
    .collection('couples')
    .doc(coupleId)
    .get();
  
  if (!coupleDoc.exists) {
    throw new Error('Couple not found');
  }
  
  const coupleData = coupleDoc.data();
  const members = coupleData?.members || [];
  
  for (const userId of members) {
    try {
      const userDoc = await getFirestore()
        .collection('users')
        .doc(userId)
        .get();
      
      if (!userDoc.exists) continue;
      
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;
      
      if (!fcmToken) continue;
      
      const message = {
        token: fcmToken,
        notification: {
          title: '🕊️ Cột mốc ngày hòa bình!',
          body: `Chúc mừng! Bạn đã có ${days} ngày hòa bình cùng nhau! 💕`,
        },
        data: {
          type: 'peaceful-days-milestone',
          coupleId,
          days: days.toString(),
        },
      };
      
      await getMessaging().send(message);
      console.log(`Sent milestone notification to user ${userId}`);
      
    } catch (error) {
      console.error(`Failed to send milestone to user ${userId}:`, error);
    }
  }
}

/**
 * Create next recurring reminder
 */
async function createRecurringReminder(originalReminder) {
  const recurring = originalReminder.recurring;
  
  if (!recurring?.enabled || !recurring.frequency) {
    return;
  }
  
  // Calculate next due date
  const originalDueDate = originalReminder.dueDate.toDate();
  const nextDueDate = new Date(originalDueDate);
  
  switch (recurring.frequency) {
    case 'daily':
      nextDueDate.setDate(nextDueDate.getDate() + (recurring.interval || 1));
      break;
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + 7 * (recurring.interval || 1));
      break;
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + (recurring.interval || 1));
      break;
    case 'yearly':
      nextDueDate.setFullYear(nextDueDate.getFullYear() + (recurring.interval || 1));
      break;
    default:
      console.error('Unknown recurring frequency:', recurring.frequency);
      return;
  }
  
  // Check if we've reached the end date
  if (recurring.endDate && nextDueDate > recurring.endDate.toDate()) {
    console.log('Recurring reminder has reached end date');
    return;
  }
  
  // Create new reminder
  const newReminder = {
    title: originalReminder.title,
    description: originalReminder.description,
    type: originalReminder.type,
    userId: originalReminder.userId,
    creatorId: originalReminder.creatorId,
    coupleId: originalReminder.coupleId,
    dueDate: Timestamp.fromDate(nextDueDate),
    priority: originalReminder.priority,
    category: originalReminder.category,
    completed: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    notificationSent: false,
    recurring,
    parentReminderId: originalReminder.id,
  };
  
  await getFirestore().collection('reminders').add(newReminder);
  console.log('Created recurring reminder for:', nextDueDate);
}

module.exports = {
  scheduleReminderCheck,
  cleanupOldReminders,
  checkPeacefulDaysMilestones,
  handleRecurringReminders,
}; 