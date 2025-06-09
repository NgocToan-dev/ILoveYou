"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCoupleReminderNotification = exports.sendReminderNotification = exports.sendTestNotification = exports.updateFCMToken = exports.FCMManager = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
// Set global options for all functions
(0, v2_1.setGlobalOptions)({
    maxInstances: 10,
    region: 'us-central1',
    memory: '256MiB'
});
// Vietnamese notification templates for couples
const NOTIFICATION_TEMPLATES = {
    reminder: {
        vi: {
            title: '💕 Nhắc nhở yêu thương',
            bodyPersonal: (title) => `Đừng quên: ${title}`,
            bodyCouple: (title, partnerName) => `💕 Nhắc nhở từ ${partnerName || 'người yêu'}: ${title}`,
            actions: {
                complete: '✅ Hoàn thành',
                snooze: '⏰ Nhắc lại sau',
                view: '👀 Xem chi tiết'
            }
        },
        en: {
            title: '💕 Love Reminder',
            bodyPersonal: (title) => `Don't forget: ${title}`,
            bodyCouple: (title, partnerName) => `💕 Reminder from ${partnerName || 'your love'}: ${title}`,
            actions: {
                complete: '✅ Complete',
                snooze: '⏰ Snooze',
                view: '👀 View Details'
            }
        }
    },
    loveMessage: {
        vi: {
            title: '💝 Tin nhắn yêu thương',
            body: (message) => message
        },
        en: {
            title: '💝 Love Message',
            body: (message) => message
        }
    },
    peacefulDaysMilestone: {
        vi: {
            title: '🕊️ Cột mốc ngày hòa bình!',
            body: (days) => `Chúc mừng! Bạn đã có ${days} ngày hòa bình cùng nhau! 💕`
        },
        en: {
            title: '🕊️ Peaceful Days Milestone!',
            body: (days) => `Congratulations! You've had ${days} peaceful days together! 💕`
        }
    }
};
/**
 * FCM Manager class for handling Firebase Cloud Messaging operations
 */
class FCMManager {
    /**
     * Send reminder notification to a specific user
     */
    static async sendReminderNotification(userId, reminder, language = 'vi') {
        try {
            console.log(`Sending reminder notification to user: ${userId}`);
            // Get user document to retrieve FCM token
            const userDoc = await (0, firestore_1.getFirestore)()
                .collection('users')
                .doc(userId)
                .get();
            if (!userDoc.exists) {
                console.log(`User not found: ${userId}`);
                return { success: false, error: 'User not found' };
            }
            const userData = userDoc.data();
            const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
            if (!fcmToken) {
                console.log(`No FCM token for user: ${userId}`);
                return { success: false, error: 'No FCM token available' };
            }
            // Check notification preferences
            const notificationPrefs = (userData === null || userData === void 0 ? void 0 : userData.notificationPreferences) || {};
            if (!notificationPrefs.enabled || !notificationPrefs.reminders) {
                console.log(`Notifications disabled for user: ${userId}`);
                return { success: false, error: 'Notifications disabled' };
            }
            // Check quiet hours
            if (this.isQuietHours(notificationPrefs.quietHours, userData === null || userData === void 0 ? void 0 : userData.timezone)) {
                console.log(`Currently in quiet hours for user: ${userId}`);
                return { success: false, error: 'Quiet hours active' };
            }
            // Prepare notification content
            const template = NOTIFICATION_TEMPLATES.reminder[language];
            const title = template.title;
            const body = template.bodyPersonal(reminder.title);
            // Prepare FCM message
            const message = {
                token: fcmToken,
                notification: {
                    title,
                    body
                },
                data: {
                    type: 'reminder',
                    reminderId: reminder.id || '',
                    coupleId: reminder.coupleId || '',
                    priority: reminder.priority || 'medium',
                    language,
                    url: `/reminders/${reminder.id}`
                },
                webpush: {
                    fcmOptions: {
                        link: `${process.env.WEB_APP_URL || 'https://ilove-you.app'}/reminders/${reminder.id}`
                    },
                    notification: {
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/badge-72x72.png',
                        requireInteraction: reminder.priority === 'high',
                        tag: `reminder-${reminder.id}`,
                        actions: [
                            {
                                action: 'mark-complete',
                                title: template.actions.complete
                            },
                            {
                                action: 'snooze',
                                title: template.actions.snooze
                            },
                            {
                                action: 'view',
                                title: template.actions.view
                            }
                        ],
                        vibrate: [200, 100, 200],
                        silent: false
                    }
                },
                android: {
                    notification: {
                        icon: 'ic_notification',
                        color: '#FF69B4',
                        sound: 'default',
                        channelId: 'reminders'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };
            // Send the message
            const response = await (0, messaging_1.getMessaging)().send(message);
            console.log('FCM reminder notification sent successfully:', response);
            // Update reminder with notification sent status
            await (0, firestore_1.getFirestore)()
                .collection('reminders')
                .doc(reminder.id)
                .update({
                notificationSent: true,
                lastNotificationSent: firestore_1.FieldValue.serverTimestamp()
            });
            return {
                success: true,
                messageId: response,
                userId,
                reminderId: reminder.id
            };
        }
        catch (error) {
            console.error('Error sending FCM reminder notification:', error);
            // Handle specific FCM errors
            if (error.code === 'messaging/registration-token-not-registered') {
                // Token is invalid, remove it from user document
                await this.removeInvalidToken(userId);
                return { success: false, error: 'Invalid FCM token, removed' };
            }
            return { success: false, error: error.message };
        }
    }
    /**
     * Send reminder notification to couple (both partners)
     */
    static async sendCoupleReminderNotification(coupleId, reminder, creatorId, language = 'vi') {
        var _a;
        try {
            console.log(`Sending couple reminder notification for couple: ${coupleId}`);
            // Get couple document to find both partners
            const coupleDoc = await (0, firestore_1.getFirestore)()
                .collection('couples')
                .doc(coupleId)
                .get();
            if (!coupleDoc.exists) {
                console.log(`Couple not found: ${coupleId}`);
                return { success: false, error: 'Couple not found' };
            }
            const coupleData = coupleDoc.data();
            const members = (coupleData === null || coupleData === void 0 ? void 0 : coupleData.members) || [];
            if (members.length !== 2) {
                console.log(`Invalid couple members count: ${members.length}`);
                return { success: false, error: 'Invalid couple configuration' };
            }
            // Find partner (the one who didn't create the reminder)
            const partnerId = members.find((id) => id !== creatorId);
            if (!partnerId) {
                console.log(`Partner not found for creator: ${creatorId}`);
                return { success: false, error: 'Partner not found' };
            }
            // Get creator name for personalized message
            const creatorDoc = await (0, firestore_1.getFirestore)()
                .collection('users')
                .doc(creatorId)
                .get();
            const creatorName = creatorDoc.exists ?
                ((_a = creatorDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) || 'người yêu' : 'người yêu';
            // Send notification to partner
            const partnerResult = await this.sendPartnerReminderNotification(partnerId, reminder, creatorName, language);
            // Also send to creator (for their own reminder)
            const creatorResult = await this.sendReminderNotification(creatorId, reminder, language);
            return {
                success: true,
                partner: partnerResult,
                creator: creatorResult,
                coupleId,
                reminderId: reminder.id
            };
        }
        catch (error) {
            console.error('Error sending couple reminder notification:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Send reminder notification to partner with personalized message
     */
    static async sendPartnerReminderNotification(partnerId, reminder, creatorName, language = 'vi') {
        try {
            // Get partner FCM token and preferences
            const partnerDoc = await (0, firestore_1.getFirestore)()
                .collection('users')
                .doc(partnerId)
                .get();
            if (!partnerDoc.exists) {
                return { success: false, error: 'Partner not found' };
            }
            const partnerData = partnerDoc.data();
            const fcmToken = partnerData === null || partnerData === void 0 ? void 0 : partnerData.fcmToken;
            if (!fcmToken) {
                return { success: false, error: 'No FCM token for partner' };
            }
            // Check notification preferences
            const notificationPrefs = (partnerData === null || partnerData === void 0 ? void 0 : partnerData.notificationPreferences) || {};
            if (!notificationPrefs.enabled || !notificationPrefs.coupleReminders) {
                return { success: false, error: 'Couple notifications disabled' };
            }
            // Check quiet hours
            if (this.isQuietHours(notificationPrefs.quietHours, partnerData === null || partnerData === void 0 ? void 0 : partnerData.timezone)) {
                return { success: false, error: 'Partner in quiet hours' };
            }
            // Prepare partner-specific notification content
            const template = NOTIFICATION_TEMPLATES.reminder[language];
            const title = `💕 ${template.title}`;
            const body = template.bodyCouple(reminder.title, creatorName);
            const message = {
                token: fcmToken,
                notification: {
                    title,
                    body
                },
                data: {
                    type: 'couple_reminder',
                    reminderId: reminder.id || '',
                    coupleId: reminder.coupleId || '',
                    creatorId: reminder.creatorId || '',
                    priority: reminder.priority || 'medium',
                    language,
                    url: `/reminders/${reminder.id}`
                },
                webpush: {
                    fcmOptions: {
                        link: `${process.env.WEB_APP_URL || 'https://ilove-you.app'}/reminders/${reminder.id}`
                    },
                    notification: {
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/badge-72x72.png',
                        requireInteraction: reminder.priority === 'high',
                        tag: `couple-reminder-${reminder.id}`,
                        actions: [
                            {
                                action: 'view',
                                title: template.actions.view
                            },
                            {
                                action: 'snooze',
                                title: template.actions.snooze
                            }
                        ],
                        vibrate: [200, 100, 200, 100, 200],
                        silent: false
                    }
                }
            };
            const response = await (0, messaging_1.getMessaging)().send(message);
            console.log('Partner reminder notification sent successfully:', response);
            return {
                success: true,
                messageId: response,
                partnerId
            };
        }
        catch (error) {
            console.error('Error sending partner reminder notification:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Check if current time is within quiet hours
     */
    static isQuietHours(quietHours, _timezone = 'Asia/Ho_Chi_Minh') {
        if (!(quietHours === null || quietHours === void 0 ? void 0 : quietHours.enabled)) {
            return false;
        }
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;
            const [startHour, startMinute] = (quietHours.start || '22:00').split(':').map(Number);
            const [endHour, endMinute] = (quietHours.end || '08:00').split(':').map(Number);
            const startTime = startHour * 60 + startMinute;
            const endTime = endHour * 60 + endMinute;
            // Handle overnight quiet hours (e.g., 22:00 to 08:00)
            if (startTime > endTime) {
                return currentTime >= startTime || currentTime <= endTime;
            }
            else {
                return currentTime >= startTime && currentTime <= endTime;
            }
        }
        catch (error) {
            console.error('Error checking quiet hours:', error);
            return false;
        }
    }
    /**
     * Remove invalid FCM token from user document
     */
    static async removeInvalidToken(userId) {
        try {
            await (0, firestore_1.getFirestore)()
                .collection('users')
                .doc(userId)
                .update({
                fcmToken: firestore_1.FieldValue.delete(),
                fcmTokenUpdated: firestore_1.FieldValue.delete()
            });
            console.log(`Removed invalid FCM token for user: ${userId}`);
        }
        catch (error) {
            console.error('Error removing invalid token:', error);
        }
    }
    /**
     * Send love message notification
     */
    static async sendLoveMessage(fromUserId, toUserId, message, language = 'vi') {
        try {
            const userDoc = await (0, firestore_1.getFirestore)()
                .collection('users')
                .doc(toUserId)
                .get();
            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }
            const userData = userDoc.data();
            const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
            if (!fcmToken) {
                return { success: false, error: 'No FCM token available' };
            }
            const notificationPrefs = (userData === null || userData === void 0 ? void 0 : userData.notificationPreferences) || {};
            if (!notificationPrefs.enabled || !notificationPrefs.loveMessages) {
                return { success: false, error: 'Love messages disabled' };
            }
            const template = NOTIFICATION_TEMPLATES.loveMessage[language];
            const fcmMessage = {
                token: fcmToken,
                notification: {
                    title: template.title,
                    body: template.body(message)
                },
                data: {
                    type: 'love_message',
                    fromUserId,
                    language,
                    url: '/messages'
                },
                webpush: {
                    notification: {
                        icon: '/icons/icon-192x192.png',
                        tag: 'love-message',
                        requireInteraction: false,
                        vibrate: [100, 50, 100]
                    }
                }
            };
            const response = await (0, messaging_1.getMessaging)().send(fcmMessage);
            return { success: true, messageId: response };
        }
        catch (error) {
            console.error('Error sending love message:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Send peaceful days milestone notification
     */
    static async sendPeacefulDaysMilestone(coupleId, days, language = 'vi') {
        var _a;
        try {
            const coupleDoc = await (0, firestore_1.getFirestore)()
                .collection('couples')
                .doc(coupleId)
                .get();
            if (!coupleDoc.exists) {
                return { success: false, error: 'Couple not found' };
            }
            const members = ((_a = coupleDoc.data()) === null || _a === void 0 ? void 0 : _a.members) || [];
            const template = NOTIFICATION_TEMPLATES.peacefulDaysMilestone[language];
            const results = await Promise.all(members.map(async (userId) => {
                const userDoc = await (0, firestore_1.getFirestore)()
                    .collection('users')
                    .doc(userId)
                    .get();
                if (!userDoc.exists)
                    return { success: false, userId };
                const userData = userDoc.data();
                const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
                if (!fcmToken)
                    return { success: false, userId };
                const notificationPrefs = (userData === null || userData === void 0 ? void 0 : userData.notificationPreferences) || {};
                if (!notificationPrefs.enabled || !notificationPrefs.peacefulDaysMilestones) {
                    return { success: false, userId };
                }
                const message = {
                    token: fcmToken,
                    notification: {
                        title: template.title,
                        body: template.body(days)
                    },
                    data: {
                        type: 'peaceful_days_milestone',
                        coupleId,
                        days: days.toString(),
                        language,
                        url: '/home'
                    },
                    webpush: {
                        notification: {
                            icon: '/icons/icon-192x192.png',
                            tag: 'peaceful-milestone',
                            requireInteraction: true,
                            vibrate: [200, 100, 200, 100, 200, 100, 200]
                        }
                    }
                };
                const response = await (0, messaging_1.getMessaging)().send(message);
                return { success: true, messageId: response, userId };
            }));
            return { success: true, results, coupleId, days };
        }
        catch (error) {
            console.error('Error sending peaceful days milestone:', error);
            return { success: false, error: error.message };
        }
    }
}
exports.FCMManager = FCMManager;
/**
 * Cloud Function to update FCM token for a user
 */
exports.updateFCMToken = (0, https_1.onCall)(async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { token } = request.data;
    const userId = request.auth.uid;
    if (!token || typeof token !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Valid FCM token is required');
    }
    try {
        // Update user document with new FCM token
        await (0, firestore_1.getFirestore)()
            .collection('users')
            .doc(userId)
            .update({
            fcmToken: token,
            fcmTokenUpdated: firestore_1.FieldValue.serverTimestamp()
        });
        console.log(`FCM token updated for user: ${userId}`);
        return { success: true, userId, token };
    }
    catch (error) {
        console.error('Error updating FCM token:', error);
        throw new https_1.HttpsError('internal', 'Failed to update FCM token');
    }
});
/**
 * Cloud Function to send test notification
 */
exports.sendTestNotification = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { language = 'vi' } = request.data;
    try {
        const testReminder = {
            id: 'test',
            title: language === 'vi' ? 'Thông báo thử nghiệm' : 'Test Notification',
            description: language === 'vi' ? 'Đây là thông báo thử nghiệm' : 'This is a test notification',
            type: 'personal',
            creatorId: userId,
            dueDate: firestore_1.Timestamp.now(),
            priority: 'medium',
            completed: false,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now()
        };
        const result = await FCMManager.sendReminderNotification(userId, testReminder, language);
        return result;
    }
    catch (error) {
        console.error('Error sending test notification:', error);
        throw new https_1.HttpsError('internal', 'Failed to send test notification');
    }
});
/**
 * Cloud Function to send reminder notification (for manual triggers)
 */
exports.sendReminderNotification = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { reminderId, language = 'vi' } = request.data;
    const userId = request.auth.uid;
    if (!reminderId) {
        throw new https_1.HttpsError('invalid-argument', 'Reminder ID is required');
    }
    try {
        // Get reminder data
        const reminderDoc = await (0, firestore_1.getFirestore)()
            .collection('reminders')
            .doc(reminderId)
            .get();
        if (!reminderDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Reminder not found');
        }
        const reminderData = reminderDoc.data();
        const reminder = Object.assign({ id: reminderId }, reminderData);
        // Verify user has access to this reminder
        if (reminder.userId !== userId && reminder.creatorId !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Access denied to this reminder');
        }
        const result = await FCMManager.sendReminderNotification(userId, reminder, language);
        return result;
    }
    catch (error) {
        console.error('Error sending reminder notification:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to send reminder notification');
    }
});
/**
 * Cloud Function to send couple reminder notification
 */
exports.sendCoupleReminderNotification = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { reminderId, language = 'vi' } = request.data;
    const userId = request.auth.uid;
    if (!reminderId) {
        throw new https_1.HttpsError('invalid-argument', 'Reminder ID is required');
    }
    try {
        // Get reminder data
        const reminderDoc = await (0, firestore_1.getFirestore)()
            .collection('reminders')
            .doc(reminderId)
            .get();
        if (!reminderDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Reminder not found');
        }
        const reminderData = reminderDoc.data();
        const reminder = Object.assign({ id: reminderId }, reminderData);
        // Verify this is a couple reminder and user has access
        if (reminder.type !== 'couple' || !reminder.coupleId) {
            throw new https_1.HttpsError('invalid-argument', 'Not a couple reminder');
        }
        if (reminder.creatorId !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Access denied to this reminder');
        }
        const result = await FCMManager.sendCoupleReminderNotification(reminder.coupleId, reminder, userId, language);
        return result;
    }
    catch (error) {
        console.error('Error sending couple reminder notification:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to send couple reminder notification');
    }
});
//# sourceMappingURL=fcmManager.js.map