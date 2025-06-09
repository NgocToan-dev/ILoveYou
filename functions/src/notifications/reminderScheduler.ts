import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FCMManager } from './fcmManager';
import { ReminderData, NotificationResult, CoupleNotificationResult } from '../types';

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  memory: '256MiB'
});

/**
 * Scheduled function that runs every minute to check for reminders that need notifications
 * This function looks for reminders that are due within the next 5 minutes and haven't been notified yet
 */
export const scheduleReminderCheck = onSchedule({
  schedule: 'every 1 minutes',
  timeZone: 'Asia/Ho_Chi_Minh'
}, async (_event) => {
  console.log('Running scheduled reminder check...');
  
  const now = Timestamp.now();
  const fiveMinutesFromNow = Timestamp.fromMillis(
    now.toMillis() + (5 * 60 * 1000) // 5 minutes in milliseconds
  );

  try {
      // Query for reminders that are due within next 5 minutes and haven't been notified
      const remindersQuery = getFirestore()
        .collection('reminders')
        .where('dueDate', '<=', fiveMinutesFromNow)
        .where('completed', '==', false)
        .where('notificationSent', '==', false);

      const remindersSnapshot = await remindersQuery.get();
      
      if (remindersSnapshot.empty) {
        console.log('No reminders found that need notifications');
        return;
      }

      console.log(`Found ${remindersSnapshot.size} reminders that need notifications`);

      // Process each reminder
      const batch = getFirestore().batch();
      const notificationPromises: Promise<NotificationResult | CoupleNotificationResult | { success: boolean; error: string; reminderId: string }>[] = [];

      for (const doc of remindersSnapshot.docs) {
        const reminderData = doc.data() as ReminderData;
        const reminder = { id: doc.id, ...reminderData };
        
        console.log(`Processing reminder: ${reminder.title} (${reminder.id})`);

        try {
          // Determine user's language preference
          let language: 'vi' | 'en' = 'vi'; // Default to Vietnamese
          
          if (reminder.userId || reminder.creatorId) {
            const userId = reminder.userId || reminder.creatorId;
            const userDoc = await getFirestore()
              .collection('users')
              .doc(userId)
              .get();
            
            if (userDoc.exists) {
              const userData = userDoc.data();
              language = userData?.notificationPreferences?.language || 'vi';
            }
          }

          // Handle different reminder types
          if (reminder.type === 'couple' && reminder.coupleId) {
            // Send couple reminder to both partners
            console.log(`Sending couple reminder: ${reminder.title}`);
            
            notificationPromises.push(
              FCMManager.sendCoupleReminderNotification(
                reminder.coupleId,
                reminder,
                reminder.creatorId,
                language
              ).catch((error) => {
                console.error(`Failed to send couple reminder ${reminder.id}:`, error);
                return { success: false, error: error.message, reminderId: reminder.id };
              })
            );
            
          } else if (reminder.type === 'personal' && reminder.userId) {
            // Send personal reminder
            console.log(`Sending personal reminder: ${reminder.title}`);
            
            notificationPromises.push(
              FCMManager.sendReminderNotification(
                reminder.userId,
                reminder,
                language
              ).catch((error) => {
                console.error(`Failed to send personal reminder ${reminder.id}:`, error);
                return { success: false, error: error.message, reminderId: reminder.id };
              })
            );
            
          } else {
            console.warn(`Reminder ${reminder.id} has invalid type or missing user info`);
          }

          // Mark notification as sent (we'll update this regardless of notification success)
          batch.update(doc.ref, {
            notificationSent: true,
            lastNotificationSent: FieldValue.serverTimestamp(),
            notificationAttempts: FieldValue.increment(1)
          });

        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          
          // Mark as attempted even if failed
          batch.update(doc.ref, {
            notificationSent: true, // Mark as sent to prevent retry loops
            lastNotificationSent: FieldValue.serverTimestamp(),
            notificationAttempts: FieldValue.increment(1),
            lastNotificationError: (error as Error).message
          });
        }
      }

      // Execute all notification promises
      const notificationResults = await Promise.allSettled(notificationPromises);
      
      // Update all reminder documents in batch
      await batch.commit();
      
      // Log results
      let successCount = 0;
      let failureCount = 0;
      
      notificationResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.success) {
          successCount++;
          console.log(`✅ Notification ${index + 1} sent successfully`);
        } else {
          failureCount++;
          console.error(`❌ Notification ${index + 1} failed:`, 
            result.status === 'rejected' ? result.reason : result.value?.error);
        }
      });

      console.log(`Reminder check completed: ${successCount} successful, ${failureCount} failed`);
      
      // Optional: Send summary to monitoring/analytics
      if (failureCount > 0) {
        console.warn(`⚠️ Some notifications failed. Success: ${successCount}, Failed: ${failureCount}`);
      }

    } catch (error) {
      console.error('Error in scheduled reminder check:', error);
      
      // Optional: Send alert to monitoring system for critical failures
      throw error; // Re-throw to trigger Cloud Functions retry
  }
});

/**
 * Scheduled function to clean up old completed reminders and failed notifications
 * Runs daily at 2 AM Vietnamese time
 */
export const cleanupOldReminders = onSchedule({
  schedule: '0 2 * * *',
  timeZone: 'Asia/Ho_Chi_Minh'
}, async (_event) => {
  console.log('Running scheduled cleanup of old reminders...');
  
  const thirtyDaysAgo = Timestamp.fromMillis(
    Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
  );

  try {
      // Clean up completed reminders older than 30 days
      const oldCompletedQuery = getFirestore()
        .collection('reminders')
        .where('completed', '==', true)
        .where('completedAt', '<=', thirtyDaysAgo)
        .limit(100); // Process in batches to avoid timeout

      const oldCompletedSnapshot = await oldCompletedQuery.get();
      
      if (!oldCompletedSnapshot.empty) {
        const batch = getFirestore().batch();
        
        oldCompletedSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`Cleaned up ${oldCompletedSnapshot.size} old completed reminders`);
      }

      // Clean up old notification history (keep last 100 per user)
      // This would require a separate collection for notification history
      // For now, we'll just log that this feature could be implemented
      console.log('Old reminder cleanup completed');

    } catch (error) {
      console.error('Error in cleanup job:', error);
      throw error;
  }
});

/**
 * Scheduled function to check for peaceful days milestones
 * Runs daily at 9 AM Vietnamese time
 */
export const checkPeacefulDaysMilestones = onSchedule({
  schedule: '0 9 * * *',
  timeZone: 'Asia/Ho_Chi_Minh'
}, async (_event) => {
  console.log('Checking for peaceful days milestones...');
  
  try {
      // Get all couples with peaceful days tracking
      const couplesSnapshot = await getFirestore()
        .collection('couples')
        .where('peacefulDays.enabled', '==', true)
        .get();

      if (couplesSnapshot.empty) {
        console.log('No couples with peaceful days tracking found');
        return;
      }

      const today = new Date();
      const milestones = [7, 14, 30, 60, 100, 365]; // Days to celebrate

      for (const coupleDoc of couplesSnapshot.docs) {
        const coupleData = coupleDoc.data();
        const peacefulDays = coupleData.peacefulDays;
        
        if (!peacefulDays?.currentStreak || !peacefulDays?.lastUpdated) {
          continue;
        }

        const lastUpdated = peacefulDays.lastUpdated.toDate();
        const daysSinceUpdate = Math.floor((today.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if it's been updated today (within last 24 hours)
        if (daysSinceUpdate > 1) {
          // Haven't updated in more than a day, peaceful streak might be broken
          continue;
        }

        const currentStreak = peacefulDays.currentStreak;
        
        // Check if current streak is a milestone and hasn't been celebrated today
        if (milestones.includes(currentStreak)) {
          const lastCelebrated = peacefulDays.lastMilestoneCelebrated?.toDate();
          const isSameDay = lastCelebrated && 
            lastCelebrated.toDateString() === today.toDateString();
          
          if (!isSameDay) {
            console.log(`Celebrating ${currentStreak} peaceful days for couple ${coupleDoc.id}`);
            
            // Determine language preference (check first user's preference)
            let language: 'vi' | 'en' = 'vi';
            const members = coupleData.members || [];
            
            if (members.length > 0) {
              const firstUserDoc = await getFirestore()
                .collection('users')
                .doc(members[0])
                .get();
              
              if (firstUserDoc.exists) {
                const userData = firstUserDoc.data();
                language = userData?.notificationPreferences?.language || 'vi';
              }
            }

            // Send milestone notification
            try {
              await FCMManager.sendPeacefulDaysMilestone(
                coupleDoc.id,
                currentStreak,
                language
              );

              // Update last milestone celebrated
              await coupleDoc.ref.update({
                'peacefulDays.lastMilestoneCelebrated': FieldValue.serverTimestamp()
              });

              console.log(`✅ Milestone notification sent for ${currentStreak} days`);
              
            } catch (error) {
              console.error(`Failed to send milestone notification for couple ${coupleDoc.id}:`, error);
            }
          }
        }
      }

      console.log('Peaceful days milestone check completed');

    } catch (error) {
      console.error('Error checking peaceful days milestones:', error);
      throw error;
  }
});

/**
 * Function to handle recurring reminder creation
 * This creates new instances of recurring reminders when they're completed
 */
export const handleRecurringReminders = onDocumentUpdated({
  document: 'reminders/{reminderId}'
}, async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const reminderId = event.params?.reminderId;

  if (!before || !after || !reminderId) {
    console.log('Missing required data for recurring reminder handler');
    return;
  }

  // Check if reminder was just completed and has recurring settings
    if (!before.completed && after.completed && after.recurring?.enabled) {
      console.log(`Handling recurring reminder: ${reminderId}`);
      
      try {
        const recurring = after.recurring;
        const originalDueDate = after.dueDate.toDate();
        let nextDueDate: Date;

        // Calculate next due date based on frequency
        switch (recurring.frequency) {
          case 'daily':
            nextDueDate = new Date(originalDueDate.getTime() + (recurring.interval || 1) * 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            nextDueDate = new Date(originalDueDate.getTime() + (recurring.interval || 1) * 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            nextDueDate = new Date(originalDueDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + (recurring.interval || 1));
            break;
          case 'yearly':
            nextDueDate = new Date(originalDueDate);
            nextDueDate.setFullYear(nextDueDate.getFullYear() + (recurring.interval || 1));
            break;
          default:
            console.warn(`Unknown recurring frequency: ${recurring.frequency}`);
            return;
        }

        // Check if end date has been reached
        if (recurring.endDate && nextDueDate > recurring.endDate.toDate()) {
          console.log(`Recurring reminder ${reminderId} has reached end date`);
          return;
        }

        // Create new reminder instance
        const newReminder = {
          ...after,
          id: undefined, // Will be auto-generated
          completed: false,
          completedAt: null,
          notificationSent: false,
          lastNotificationSent: null,
          notificationAttempts: 0,
          dueDate: Timestamp.fromDate(nextDueDate),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          parentReminderId: reminderId // Link to original reminder
        };

        // Remove the id field that was set to undefined
        delete newReminder.id;

        await getFirestore()
          .collection('reminders')
          .add(newReminder);

        console.log(`✅ Created new recurring reminder instance for ${reminderId}`);

      } catch (error) {
        console.error(`Error creating recurring reminder for ${reminderId}:`, error);
    }
  }
});