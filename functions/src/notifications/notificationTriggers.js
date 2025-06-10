const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { getFirestore } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');

const db = getFirestore();

// Trigger khi có reminder mới được tạo
const onReminderCreated = onDocumentCreated('reminders/{reminderId}', async (event) => {
  try {
    const reminder = event.data.data();
    const reminderId = event.params.reminderId;
    
    logger.info('New reminder created:', { reminderId, title: reminder.title });

    // Tạo notification cho user tạo reminder
    if (reminder.userId) {
      await createNotificationForUser(reminder.userId, {
        title: 'Nhắc nhở mới đã được tạo',
        body: `"${reminder.title}" đã được thêm vào danh sách nhắc nhở`,
        type: 'reminder',
        data: {
          reminderId,
          action: 'created'
        },
        actionUrl: `/reminders/${reminderId}`
      });
    }

    // Nếu là reminder cho couple, tạo notification cho partner
    if (reminder.coupleId && reminder.partnerId && reminder.partnerId !== reminder.userId) {
      await createNotificationForUser(reminder.partnerId, {
        title: 'Nhắc nhở mới từ người yêu',
        body: `"${reminder.title}" - ${reminder.description || 'Không có mô tả'}`,
        type: 'reminder',
        data: {
          reminderId,
          action: 'shared'
        },
        actionUrl: `/reminders/${reminderId}`
      });
    }

  } catch (error) {
    logger.error('Error handling reminder creation:', error);
  }
});

// Trigger khi reminder được cập nhật (hoàn thành, snooze, etc.)
const onReminderUpdated = onDocumentUpdated('reminders/{reminderId}', async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const reminderId = event.params.reminderId;

    // Kiểm tra nếu reminder được đánh dấu hoàn thành
    if (!beforeData.completed && afterData.completed) {
      logger.info('Reminder completed:', { reminderId, title: afterData.title });

      // Tạo notification cho user hoàn thành
      if (afterData.userId) {
        await createNotificationForUser(afterData.userId, {
          title: 'Nhắc nhở đã hoàn thành',
          body: `Bạn đã hoàn thành: "${afterData.title}"`,
          type: 'reminder',
          data: {
            reminderId,
            action: 'completed'
          },
          actionUrl: `/reminders/${reminderId}`
        });
      }

      // Thông báo cho partner nếu có
      if (afterData.coupleId && afterData.partnerId && afterData.partnerId !== afterData.userId) {
        await createNotificationForUser(afterData.partnerId, {
          title: 'Người yêu đã hoàn thành nhắc nhở',
          body: `"${afterData.title}" đã được hoàn thành`,
          type: 'reminder',
          data: {
            reminderId,
            action: 'partner_completed'
          },
          actionUrl: `/reminders/${reminderId}`
        });
      }
    }

    // Kiểm tra nếu reminder được snooze
    if (beforeData.dueDate && afterData.dueDate && 
        beforeData.dueDate.toMillis() !== afterData.dueDate.toMillis() &&
        afterData.dueDate.toMillis() > Date.now()) {
      
      logger.info('Reminder snoozed:', { reminderId, title: afterData.title });

      if (afterData.userId) {
        // Kiểm tra user preferences để xem có muốn nhận thông báo hoãn không
        try {
          const userPrefsDoc = await db.collection('userNotificationPreferences')
            .doc(afterData.userId)
            .get();
          
          const userPrefs = userPrefsDoc.exists ? userPrefsDoc.data() : {};
          
          // Mặc định là true nếu không có setting, hoặc kiểm tra setting cụ thể
          const shouldNotifySnooze = userPrefs.notifyOnSnooze !== false;
          
          if (shouldNotifySnooze) {
            // Format date with Vietnam timezone
            const snoozeDate = afterData.dueDate.toDate();
            const formattedDate = snoozeDate.toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });

            await createNotificationForUser(afterData.userId, {
              title: 'Nhắc nhở đã được hoãn',
              body: `"${afterData.title}" đã được hoãn đến ${formattedDate}`,
              type: 'reminder',
              data: {
                reminderId,
                action: 'snoozed'
              },
              actionUrl: `/reminders/${reminderId}`
            });
          } else {
            logger.info('Snooze notification skipped due to user preference:', { 
              userId: afterData.userId, 
              reminderId 
            });
          }
        } catch (prefError) {
          logger.error('Error checking user preferences for snooze notification:', prefError);
          // Fallback: không gửi thông báo nếu có lỗi khi kiểm tra preferences
        }
      }
    }

  } catch (error) {
    logger.error('Error handling reminder update:', error);
  }
});

// Helper function để tạo notification cho user
async function createNotificationForUser(userId, notificationData) {
  try {
    const notification = {
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type || 'info',
      data: notificationData.data || {},
      read: false,
      createdAt: new Date(),
      actionUrl: notificationData.actionUrl || null
    };

    await db.collection('notifications').add(notification);
    logger.info('Notification created for user:', { userId, title: notification.title });

  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
}

// Trigger để dọn dẹp notifications cũ (chạy hàng ngày)
const cleanupOldNotifications = require('firebase-functions/v2/scheduler').onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'Asia/Ho_Chi_Minh'
}, async (event) => {
  try {
    logger.info('Starting cleanup of old notifications');

    // Xóa notifications cũ hơn 30 ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotificationsQuery = db.collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo);

    const snapshot = await oldNotificationsQuery.get();
    
    if (snapshot.empty) {
      logger.info('No old notifications to cleanup');
      return;
    }

    const batch = db.batch();
    let deleteCount = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    await batch.commit();
    logger.info(`Cleaned up ${deleteCount} old notifications`);

  } catch (error) {
    logger.error('Error cleaning up old notifications:', error);
  }
});

module.exports = {
  onReminderCreated,
  onReminderUpdated,
  cleanupOldNotifications
}; 