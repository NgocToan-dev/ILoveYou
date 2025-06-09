const { Alert } = require('react-native');
const notificationService = require('../notifications');
const { getCurrentUser } = require('@shared/services/firebase/auth');
const { getUserProfile } = require('@shared/services/firebase/couples');
const { 
  getUserPersonalReminders, 
  getCoupleReminders,
  getOverdueReminders,
  updateReminder,
  REMINDER_PRIORITIES 
} = require('../index');
const { toDate } = require('@shared/utils/dateUtils');

class ReminderNotificationJob {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.scheduledReminders = new Set(); // Track already scheduled reminders
  }

  // Start the background job
  start() {
    if (this.isRunning) {
      console.log('Reminder notification job is already running');
      return;
    }

    console.log('Starting reminder notification job...');
    this.isRunning = true;
    
    // Run immediately
    this.checkAndScheduleNotifications();
    
    // Set interval for periodic checks
    this.intervalId = setInterval(() => {
      this.checkAndScheduleNotifications();
    }, this.checkInterval);
  }

  // Stop the background job
  stop() {
    if (!this.isRunning) {
      console.log('Reminder notification job is not running');
      return;
    }

    console.log('Stopping reminder notification job...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  // Main job function - check and schedule notifications
  async checkAndScheduleNotifications() {
    try {
      console.log('🔔 Checking reminders for notifications...');
      
      // Get current user from Firebase Auth
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.log('No current user, skipping notification check');
        return;
      }

      // Get user profile for couple information
      let userProfile = null;
      try {
        userProfile = await getUserProfile(currentUser.uid);
      } catch (error) {
        console.warn('Could not get user profile:', error);
        // Continue with personal reminders only
      }

      await this.processPersonalReminders(currentUser.uid);
      
      if (userProfile?.coupleId) {
        await this.processCoupleReminders(userProfile.coupleId);
      }

      await this.processOverdueReminders(currentUser.uid, userProfile?.coupleId);
      await this.updateBadgeCount(currentUser.uid, userProfile?.coupleId);

    } catch (error) {
      console.error('Error in reminder notification job:', error);
    }
  }

  // Process personal reminders
  async processPersonalReminders(userId) {
    try {
      const reminders = await getUserPersonalReminders(userId, false); // Get incomplete reminders only
      const upcomingReminders = this.filterUpcomingReminders(reminders);

      for (const reminder of upcomingReminders) {
        await this.scheduleReminderIfNeeded(reminder);
      }

      console.log(`✅ Processed ${upcomingReminders.length} personal reminders`);
    } catch (error) {
      console.error('Error processing personal reminders:', error);
    }
  }

  // Process couple reminders
  async processCoupleReminders(coupleId) {
    try {
      const reminders = await getCoupleReminders(coupleId, false); // Get incomplete reminders only
      const upcomingReminders = this.filterUpcomingReminders(reminders);

      for (const reminder of upcomingReminders) {
        await this.scheduleReminderIfNeeded(reminder);
      }

      console.log(`✅ Processed ${upcomingReminders.length} couple reminders`);
    } catch (error) {
      console.error('Error processing couple reminders:', error);
    }
  }

  // Process overdue reminders
  async processOverdueReminders(userId, coupleId) {
    try {
      const overdueReminders = await getOverdueReminders(userId, coupleId);
      
      if (overdueReminders.length > 0) {
        console.log(`⚠️ Found ${overdueReminders.length} overdue reminders`);
        
        // Separate recurring and non-recurring overdue reminders
        const { recurringOverdue, regularOverdue } = this.separateRecurringOverdue(overdueReminders);
        
        // Process recurring overdue reminders
        await this.processOverdueRecurringReminders(recurringOverdue);
        
        // Send notification for regular overdue reminders
        if (regularOverdue.length > 0) {
          await this.sendOverdueNotification(regularOverdue.length);
        }
      }
    } catch (error) {
      console.error('Error processing overdue reminders:', error);
    }
  }

  // Separate recurring and regular overdue reminders - use shared utility
  separateRecurringOverdue(overdueReminders) {
    const { separateRecurringOverdue } = require('@shared/services/notifications/utils');
    return separateRecurringOverdue(overdueReminders);
  }

  // Process overdue recurring reminders by rescheduling them
  async processOverdueRecurringReminders(recurringOverdue) {
    try {
      for (const reminder of recurringOverdue) {
        const nextDate = notificationService.calculateNextRecurringDate(reminder);
        
        if (nextDate && !notificationService.isRecurringReminderExpired(reminder, nextDate)) {
          // Update the reminder to the next occurrence
          const updateData = {
            dueDate: nextDate,
            completed: false,
            completedAt: null,
            completedBy: null,
            updatedAt: new Date()
          };
          
          try {
            await updateReminder(reminder.id, updateData);
            console.log(`🔄 Rescheduled overdue recurring reminder: ${reminder.title} to ${nextDate}`);
            
            // Schedule notification for the new date
            await this.scheduleReminderIfNeeded({
              ...reminder,
              dueDate: nextDate
            });
          } catch (updateError) {
            console.error(`Failed to update recurring reminder ${reminder.id}:`, updateError);
          }
        } else {
          console.log(`Recurring reminder ${reminder.title} has reached its end or cannot be rescheduled`);
        }
      }
    } catch (error) {
      console.error('Error processing overdue recurring reminders:', error);
    }
  }

  // Filter reminders that are due within the next 24 hours
  // Filter upcoming reminders (within next 24 hours) - use shared utility
  filterUpcomingReminders(reminders) {
    const { filterUpcomingReminders } = require('@shared/services/notifications/utils');
    return filterUpcomingReminders(reminders);
  }
  // Schedule notification for a reminder if not already scheduled
  async scheduleReminderIfNeeded(reminder) {
    const { RECURRING_TYPES } = require('@shared/services/firebase/reminders');
    const reminderKey = `${reminder.id}_${reminder.dueDate}`;
    
    if (this.scheduledReminders.has(reminderKey)) {
      console.log(`Notification already scheduled for reminder: ${reminder.title}`);
      return;
    }

    let result;
    
    // Handle recurring reminders differently
    if (reminder.recurring && reminder.recurring !== RECURRING_TYPES.NONE) {
      result = await notificationService.scheduleRecurringReminder(reminder);
      
      if (result.success) {
        this.scheduledReminders.add(reminderKey);
        console.log(`🔄 Scheduled ${result.scheduled} recurring notifications for: ${reminder.title}`);
        
        // Also schedule for handling completed recurring reminders
        await this.handleRecurringReminderCompletion(reminder);
      }
    } else {
      result = await notificationService.scheduleReminderNotification(reminder);
      
      if (result.success) {
        this.scheduledReminders.add(reminderKey);
        console.log(`📅 Scheduled notification for: ${reminder.title}`);
      }
    }
    
    if (!result.success) {
      console.error(`Failed to schedule notification for: ${reminder.title}`, result.error);
    }
  }

  // Handle completion of recurring reminders
  async handleRecurringReminderCompletion(reminder) {
    try {
      const { RECURRING_TYPES } = require('@shared/services/firebase/reminders');
      
      if (!reminder.recurring || reminder.recurring === RECURRING_TYPES.NONE) {
        return;
      }

      // Calculate next occurrence date
      const nextDate = notificationService.calculateNextRecurringDate(reminder);
      
      if (!nextDate || notificationService.isRecurringReminderExpired(reminder, nextDate)) {
        console.log(`Recurring reminder ${reminder.title} has reached its end`);
        return;
      }

      // Update the reminder with the next occurrence date
      const updateData = {
        dueDate: nextDate,
        completed: false,
        completedAt: null,
        completedBy: null,
        updatedAt: new Date()
      };

      console.log(`🔄 Updating recurring reminder ${reminder.title} to next occurrence: ${nextDate}`);
      // Note: This would need to be called when a recurring reminder is marked as completed
      // The actual update should happen in the UI layer when user marks reminder as done
      
    } catch (error) {
      console.error('Error handling recurring reminder completion:', error);
    }
  }

  // Send notification about overdue reminders
  async sendOverdueNotification(count) {
    const title = '⚠️ Nhắc nhở quá hạn';
    const body = count === 1 
      ? 'Bạn có 1 nhắc nhở đã quá hạn'
      : `Bạn có ${count} nhắc nhở đã quá hạn`;

    await notificationService.sendImmediateNotification(title, body, {
      type: 'overdue-reminders',
      count,
    });
  }

  // Update app badge count with total pending reminders
  async updateBadgeCount(userId, coupleId) {
    try {
      const personalReminders = await getUserPersonalReminders(userId, false);
      let totalCount = personalReminders.length;

      if (coupleId) {
        const coupleReminders = await getCoupleReminders(coupleId, false);
        totalCount += coupleReminders.length;
      }

      await notificationService.setBadgeCount(totalCount);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  // Send daily summary notification
  async sendDailySummary(userId, coupleId) {
    try {
      const personalReminders = await getUserPersonalReminders(userId, false);
      const todayReminders = this.getTodayReminders(personalReminders);
      
      let totalTodayCount = todayReminders.length;
      let coupleReminders = [];
      
      if (coupleId) {
        coupleReminders = await getCoupleReminders(coupleId, false);
        const coupleTodayReminders = this.getTodayReminders(coupleReminders);
        totalTodayCount += coupleTodayReminders.length;
      }

      if (totalTodayCount > 0) {
        const title = '📋 Nhắc nhở hôm nay';
        const body = totalTodayCount === 1 
          ? 'Bạn có 1 nhắc nhở cần hoàn thành hôm nay'
          : `Bạn có ${totalTodayCount} nhắc nhở cần hoàn thành hôm nay`;

        await notificationService.sendImmediateNotification(title, body, {
          type: 'daily-summary',
          count: totalTodayCount,
        });
      }
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  // Get reminders due today
  getTodayReminders(reminders) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return reminders.filter(reminder => {
      const dueDate = toDate(reminder.dueDate);
      if (!dueDate) return false;

      return dueDate >= startOfDay && dueDate <= endOfDay;
    });
  }

  // Send weekly summary notification
  async sendWeeklySummary(userId, coupleId) {
    try {
      const personalReminders = await getUserPersonalReminders(userId, false);
      const weekReminders = this.getThisWeekReminders(personalReminders);
      
      let totalWeekCount = weekReminders.length;
      
      if (coupleId) {
        const coupleReminders = await getCoupleReminders(coupleId, false);
        const coupleWeekReminders = this.getThisWeekReminders(coupleReminders);
        totalWeekCount += coupleWeekReminders.length;
      }

      if (totalWeekCount > 0) {
        const title = '📅 Nhắc nhở tuần này';
        const body = totalWeekCount === 1 
          ? 'Bạn có 1 nhắc nhở cần hoàn thành tuần này'
          : `Bạn có ${totalWeekCount} nhắc nhở cần hoàn thành tuần này`;

        await notificationService.sendImmediateNotification(title, body, {
          type: 'weekly-summary',
          count: totalWeekCount,
        });
      }
    } catch (error) {
      console.error('Error sending weekly summary:', error);
    }
  }

  // Get reminders due this week
  getThisWeekReminders(reminders) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    return reminders.filter(reminder => {
      const dueDate = toDate(reminder.dueDate);
      if (!dueDate) return false;

      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    });
  }

  // Send motivation notification
  async sendMotivationNotification() {
    const motivationMessages = [
      '💪 Hôm nay cũng là một ngày tuyệt vời để hoàn thành mục tiêu!',
      '🌟 Mỗi bước nhỏ đều đưa bạn đến gần thành công hơn!',
      '💕 Tình yêu thật đẹp khi có kế hoạch và mục tiêu rõ ràng!',
      '⭐ Hãy biến những nhắc nhở thành những khoảnh khắc đặc biệt!',
      '🎯 Từng ngày một, bạn đang xây dựng một tương lai tuyệt vời!',
    ];

    const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];

    await notificationService.sendImmediateNotification(
      '🌈 Động lực mỗi ngày',
      randomMessage,
      { type: 'motivation' }
    );
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('🔧 Manual trigger: Checking reminders...');
    await this.checkAndScheduleNotifications();
  }

  // Cleanup scheduled reminders cache
  clearScheduledCache() {
    this.scheduledReminders.clear();
    console.log('✨ Cleared scheduled reminders cache');
  }
  // Schedule daily summary for specific time (e.g., 8:00 AM)
  scheduleDailySummary(hour = 8, minute = 0) {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(hour, minute, 0, 0);

    // If target time has passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const timeUntilTarget = targetTime.getTime() - now.getTime();

    setTimeout(async () => {
      const currentUser = getCurrentUser();
      
      if (currentUser) {
        let userProfile = null;
        try {
          userProfile = await getUserProfile(currentUser.uid);
        } catch (error) {
          console.warn('Could not get user profile for daily summary:', error);
        }
        
        await this.sendDailySummary(currentUser.uid, userProfile?.coupleId);
      }

      // Schedule next day
      this.scheduleDailySummary(hour, minute);
    }, timeUntilTarget);

    console.log(`📅 Daily summary scheduled for ${targetTime.toLocaleString()}`);
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledRemindersCount: this.scheduledReminders.size,
      checkInterval: this.checkInterval,
      lastCheck: this.lastCheck || null,
    };
  }
}

// Create singleton instance
const reminderNotificationJob = new ReminderNotificationJob();

module.exports = reminderNotificationJob;
module.exports.ReminderNotificationJob = ReminderNotificationJob;
