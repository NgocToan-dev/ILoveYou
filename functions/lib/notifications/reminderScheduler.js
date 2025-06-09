"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRecurringReminders = exports.checkPeacefulDaysMilestones = exports.cleanupOldReminders = exports.scheduleReminderCheck = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const v2_1 = require("firebase-functions/v2");
const firestore_2 = require("firebase-admin/firestore");
const fcmManager_1 = require("./fcmManager");
// Set global options for all functions
(0, v2_1.setGlobalOptions)({
    maxInstances: 10,
    region: 'us-central1',
    memory: '256MiB'
});
/**
 * Scheduled function that runs every minute to check for reminders that need notifications
 * This function looks for reminders that are due within the next 5 minutes and haven't been notified yet
 */
exports.scheduleReminderCheck = (0, scheduler_1.onSchedule)({
    schedule: 'every 1 minutes',
    timeZone: 'Asia/Ho_Chi_Minh'
}, async (_event) => {
    var _a;
    console.log('Running scheduled reminder check...');
    const now = firestore_2.Timestamp.now();
    const fiveMinutesFromNow = firestore_2.Timestamp.fromMillis(now.toMillis() + (5 * 60 * 1000) // 5 minutes in milliseconds
    );
    try {
        // Query for reminders that are due within next 5 minutes and haven't been notified
        const remindersQuery = (0, firestore_2.getFirestore)()
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
        const batch = (0, firestore_2.getFirestore)().batch();
        const notificationPromises = [];
        for (const doc of remindersSnapshot.docs) {
            const reminderData = doc.data();
            const reminder = Object.assign({ id: doc.id }, reminderData);
            console.log(`Processing reminder: ${reminder.title} (${reminder.id})`);
            try {
                // Determine user's language preference
                let language = 'vi'; // Default to Vietnamese
                if (reminder.userId || reminder.creatorId) {
                    const userId = reminder.userId || reminder.creatorId;
                    const userDoc = await (0, firestore_2.getFirestore)()
                        .collection('users')
                        .doc(userId)
                        .get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        language = ((_a = userData === null || userData === void 0 ? void 0 : userData.notificationPreferences) === null || _a === void 0 ? void 0 : _a.language) || 'vi';
                    }
                }
                // Handle different reminder types
                if (reminder.type === 'couple' && reminder.coupleId) {
                    // Send couple reminder to both partners
                    console.log(`Sending couple reminder: ${reminder.title}`);
                    notificationPromises.push(fcmManager_1.FCMManager.sendCoupleReminderNotification(reminder.coupleId, reminder, reminder.creatorId, language).catch((error) => {
                        console.error(`Failed to send couple reminder ${reminder.id}:`, error);
                        return { success: false, error: error.message, reminderId: reminder.id };
                    }));
                }
                else if (reminder.type === 'personal' && reminder.userId) {
                    // Send personal reminder
                    console.log(`Sending personal reminder: ${reminder.title}`);
                    notificationPromises.push(fcmManager_1.FCMManager.sendReminderNotification(reminder.userId, reminder, language).catch((error) => {
                        console.error(`Failed to send personal reminder ${reminder.id}:`, error);
                        return { success: false, error: error.message, reminderId: reminder.id };
                    }));
                }
                else {
                    console.warn(`Reminder ${reminder.id} has invalid type or missing user info`);
                }
                // Mark notification as sent (we'll update this regardless of notification success)
                batch.update(doc.ref, {
                    notificationSent: true,
                    lastNotificationSent: firestore_2.FieldValue.serverTimestamp(),
                    notificationAttempts: firestore_2.FieldValue.increment(1)
                });
            }
            catch (error) {
                console.error(`Error processing reminder ${reminder.id}:`, error);
                // Mark as attempted even if failed
                batch.update(doc.ref, {
                    notificationSent: true, // Mark as sent to prevent retry loops
                    lastNotificationSent: firestore_2.FieldValue.serverTimestamp(),
                    notificationAttempts: firestore_2.FieldValue.increment(1),
                    lastNotificationError: error.message
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
            var _a, _b;
            if (result.status === 'fulfilled' && ((_a = result.value) === null || _a === void 0 ? void 0 : _a.success)) {
                successCount++;
                console.log(`✅ Notification ${index + 1} sent successfully`);
            }
            else {
                failureCount++;
                console.error(`❌ Notification ${index + 1} failed:`, result.status === 'rejected' ? result.reason : (_b = result.value) === null || _b === void 0 ? void 0 : _b.error);
            }
        });
        console.log(`Reminder check completed: ${successCount} successful, ${failureCount} failed`);
        // Optional: Send summary to monitoring/analytics
        if (failureCount > 0) {
            console.warn(`⚠️ Some notifications failed. Success: ${successCount}, Failed: ${failureCount}`);
        }
    }
    catch (error) {
        console.error('Error in scheduled reminder check:', error);
        // Optional: Send alert to monitoring system for critical failures
        throw error; // Re-throw to trigger Cloud Functions retry
    }
});
/**
 * Scheduled function to clean up old completed reminders and failed notifications
 * Runs daily at 2 AM Vietnamese time
 */
exports.cleanupOldReminders = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * *',
    timeZone: 'Asia/Ho_Chi_Minh'
}, async (_event) => {
    console.log('Running scheduled cleanup of old reminders...');
    const thirtyDaysAgo = firestore_2.Timestamp.fromMillis(Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
    );
    try {
        // Clean up completed reminders older than 30 days
        const oldCompletedQuery = (0, firestore_2.getFirestore)()
            .collection('reminders')
            .where('completed', '==', true)
            .where('completedAt', '<=', thirtyDaysAgo)
            .limit(100); // Process in batches to avoid timeout
        const oldCompletedSnapshot = await oldCompletedQuery.get();
        if (!oldCompletedSnapshot.empty) {
            const batch = (0, firestore_2.getFirestore)().batch();
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
    }
    catch (error) {
        console.error('Error in cleanup job:', error);
        throw error;
    }
});
/**
 * Scheduled function to check for peaceful days milestones
 * Runs daily at 9 AM Vietnamese time
 */
exports.checkPeacefulDaysMilestones = (0, scheduler_1.onSchedule)({
    schedule: '0 9 * * *',
    timeZone: 'Asia/Ho_Chi_Minh'
}, async (_event) => {
    var _a, _b;
    console.log('Checking for peaceful days milestones...');
    try {
        // Get all couples with peaceful days tracking
        const couplesSnapshot = await (0, firestore_2.getFirestore)()
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
            if (!(peacefulDays === null || peacefulDays === void 0 ? void 0 : peacefulDays.currentStreak) || !(peacefulDays === null || peacefulDays === void 0 ? void 0 : peacefulDays.lastUpdated)) {
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
                const lastCelebrated = (_a = peacefulDays.lastMilestoneCelebrated) === null || _a === void 0 ? void 0 : _a.toDate();
                const isSameDay = lastCelebrated &&
                    lastCelebrated.toDateString() === today.toDateString();
                if (!isSameDay) {
                    console.log(`Celebrating ${currentStreak} peaceful days for couple ${coupleDoc.id}`);
                    // Determine language preference (check first user's preference)
                    let language = 'vi';
                    const members = coupleData.members || [];
                    if (members.length > 0) {
                        const firstUserDoc = await (0, firestore_2.getFirestore)()
                            .collection('users')
                            .doc(members[0])
                            .get();
                        if (firstUserDoc.exists) {
                            const userData = firstUserDoc.data();
                            language = ((_b = userData === null || userData === void 0 ? void 0 : userData.notificationPreferences) === null || _b === void 0 ? void 0 : _b.language) || 'vi';
                        }
                    }
                    // Send milestone notification
                    try {
                        await fcmManager_1.FCMManager.sendPeacefulDaysMilestone(coupleDoc.id, currentStreak, language);
                        // Update last milestone celebrated
                        await coupleDoc.ref.update({
                            'peacefulDays.lastMilestoneCelebrated': firestore_2.FieldValue.serverTimestamp()
                        });
                        console.log(`✅ Milestone notification sent for ${currentStreak} days`);
                    }
                    catch (error) {
                        console.error(`Failed to send milestone notification for couple ${coupleDoc.id}:`, error);
                    }
                }
            }
        }
        console.log('Peaceful days milestone check completed');
    }
    catch (error) {
        console.error('Error checking peaceful days milestones:', error);
        throw error;
    }
});
/**
 * Function to handle recurring reminder creation
 * This creates new instances of recurring reminders when they're completed
 */
exports.handleRecurringReminders = (0, firestore_1.onDocumentUpdated)({
    document: 'reminders/{reminderId}'
}, async (event) => {
    var _a, _b, _c, _d;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    const reminderId = (_c = event.params) === null || _c === void 0 ? void 0 : _c.reminderId;
    if (!before || !after || !reminderId) {
        console.log('Missing required data for recurring reminder handler');
        return;
    }
    // Check if reminder was just completed and has recurring settings
    if (!before.completed && after.completed && ((_d = after.recurring) === null || _d === void 0 ? void 0 : _d.enabled)) {
        console.log(`Handling recurring reminder: ${reminderId}`);
        try {
            const recurring = after.recurring;
            const originalDueDate = after.dueDate.toDate();
            let nextDueDate;
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
            const newReminder = Object.assign(Object.assign({}, after), { id: undefined, completed: false, completedAt: null, notificationSent: false, lastNotificationSent: null, notificationAttempts: 0, dueDate: firestore_2.Timestamp.fromDate(nextDueDate), createdAt: firestore_2.FieldValue.serverTimestamp(), updatedAt: firestore_2.FieldValue.serverTimestamp(), parentReminderId: reminderId // Link to original reminder
             });
            // Remove the id field that was set to undefined
            delete newReminder.id;
            await (0, firestore_2.getFirestore)()
                .collection('reminders')
                .add(newReminder);
            console.log(`✅ Created new recurring reminder instance for ${reminderId}`);
        }
        catch (error) {
            console.error(`Error creating recurring reminder for ${reminderId}:`, error);
        }
    }
});
//# sourceMappingURL=reminderScheduler.js.map