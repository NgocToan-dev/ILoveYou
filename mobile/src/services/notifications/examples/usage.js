/**
 * Practical examples of using the ILoveYou notification system
 * These examples show how to integrate the notification service in various scenarios
 */

import notificationService from '../index';
import ReminderNotificationJob from '../reminderJob';
import { RECURRING_TYPES, REMINDER_PRIORITIES } from '@shared/services/firebase/reminders';

// Example 1: Initialize notification service in your app
export const initializeNotifications = async () => {
  try {
    console.log('🔔 Initializing notification service...');
    
    const result = await notificationService.initialize();
    
    if (result.success) {
      console.log('✅ Notification service initialized successfully');
      
      // Start the background reminder job
      const reminderJob = new ReminderNotificationJob();
      reminderJob.start();
      
      console.log('🚀 Background reminder job started');
      
      return { success: true, reminderJob };
    } else {
      console.error('❌ Failed to initialize notifications:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('💥 Error initializing notifications:', error);
    return { success: false, error: error.message };
  }
};

// Example 2: Schedule a single reminder notification
export const scheduleAnniversaryReminder = async () => {
  const anniversaryReminder = {
    id: 'anniversary-2024',
    title: 'Our Anniversary! 💕',
    description: 'Today marks another year of our beautiful journey together',
    dueDate: new Date('2024-06-15T18:00:00'), // 6 PM on anniversary date
    priority: REMINDER_PRIORITIES.URGENT,
    recurring: RECURRING_TYPES.YEARLY,
    recurringEndDate: null, // No end date - remind every year
    type: 'couple',
    category: 'special_occasions',
    userId: 'user-123',
    coupleId: 'couple-456'
  };

  try {
    const result = await notificationService.scheduleReminderNotification(anniversaryReminder);
    
    if (result.success) {
      console.log(`🎉 Scheduled ${result.scheduled} notification(s) for anniversary`);
      return result;
    } else {
      console.error('❌ Failed to schedule anniversary reminder:', result.error);
      return result;
    }
  } catch (error) {
    console.error('💥 Error scheduling anniversary reminder:', error);
    return { success: false, error: error.message };
  }
};

// Example 3: Schedule recurring daily check-in reminders
export const scheduleDailyCheckIn = async () => {
  const dailyCheckIn = {
    id: 'daily-checkin',
    title: 'Daily Love Check-in 🌅',
    description: 'Take a moment to appreciate and connect with your partner',
    dueDate: new Date(new Date().setHours(20, 0, 0, 0)), // 8 PM today
    priority: REMINDER_PRIORITIES.MEDIUM,
    recurring: RECURRING_TYPES.DAILY,
    recurringEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    type: 'couple',
    category: 'personal_growth',
    userId: 'user-123',
    coupleId: 'couple-456'
  };

  try {
    const result = await notificationService.scheduleRecurringReminder(dailyCheckIn);
    
    if (result.success) {
      console.log(`📅 Scheduled ${result.scheduled} recurring check-in notifications`);
      return result;
    } else {
      console.error('❌ Failed to schedule daily check-in:', result.error);
      return result;
    }
  } catch (error) {
    console.error('💥 Error scheduling daily check-in:', error);
    return { success: false, error: error.message };
  }
};

// Example 4: Send immediate love message notification
export const sendLoveMessage = async (message, recipientName) => {
  try {
    const result = await notificationService.sendImmediateNotification(
      `💝 Love message from ${recipientName}`,
      message,
      {
        type: 'love-message',
        sender: recipientName,
        timestamp: new Date().toISOString()
      }
    );

    if (result.success) {
      console.log(`💌 Love message sent successfully`);
      return result;
    } else {
      console.error('❌ Failed to send love message:', result.error);
      return result;
    }
  } catch (error) {
    console.error('💥 Error sending love message:', error);
    return { success: false, error: error.message };
  }
};

// Example 5: Handle notification when user taps on it
export const setupNotificationHandlers = () => {
  // This would typically be called in your main App component
  console.log('🎯 Setting up notification response handlers...');
  
  // The notification service automatically handles responses through the navigation service
  // But you can add custom logic by extending the handleNotificationResponse method
  
  const originalHandler = notificationService.handleNotificationResponse;
  notificationService.handleNotificationResponse = (response) => {
    const data = response.notification.request.content.data;
    
    // Custom analytics tracking
    console.log('📊 Notification interaction tracked:', {
      type: data.type,
      timestamp: new Date().toISOString(),
      reminderId: data.reminderId
    });
    
    // Call the original handler
    originalHandler.call(notificationService, response);
  };
};

// Example 6: Clean up notifications when user completes a reminder
export const handleReminderCompletion = async (reminderId) => {
  try {
    // Cancel any pending notifications for this reminder
    const result = await notificationService.cancelReminderNotifications(reminderId);
    
    if (result.success) {
      console.log(`🗑️ Cancelled ${result.canceled} notifications for completed reminder`);
      
      // Update badge count (this would typically be done automatically by the reminder job)
      const currentBadgeCount = await getCurrentBadgeCount();
      if (currentBadgeCount > 0) {
        await notificationService.setBadgeCount(currentBadgeCount - 1);
      }
      
      return result;
    } else {
      console.error('❌ Failed to cancel reminder notifications:', result.error);
      return result;
    }
  } catch (error) {
    console.error('💥 Error handling reminder completion:', error);
    return { success: false, error: error.message };
  }
};

// Example 7: Weekly relationship activities
export const scheduleWeeklyActivities = async () => {
  const activities = [
    {
      title: 'Date Night Planning 🌟',
      description: 'Plan something special for this weekend',
      dayOfWeek: 1, // Monday
      time: '19:00'
    },
    {
      title: 'Gratitude Sharing 🙏',
      description: 'Share three things you appreciate about each other',
      dayOfWeek: 3, // Wednesday  
      time: '20:30'
    },
    {
      title: 'Future Dreams Discussion 🌈',
      description: 'Talk about your dreams and goals together',
      dayOfWeek: 5, // Friday
      time: '21:00'
    }
  ];

  const results = [];
  
  for (const activity of activities) {
    const nextOccurrence = getNextDayOfWeek(activity.dayOfWeek, activity.time);
    
    const activityReminder = {
      id: `weekly-activity-${activity.dayOfWeek}`,
      title: activity.title,
      description: activity.description,
      dueDate: nextOccurrence,
      priority: REMINDER_PRIORITIES.MEDIUM,
      recurring: RECURRING_TYPES.WEEKLY,
      recurringEndDate: null,
      type: 'couple',
      category: 'dates',
      userId: 'user-123',
      coupleId: 'couple-456'
    };

    try {
      const result = await notificationService.scheduleRecurringReminder(activityReminder);
      results.push({ activity: activity.title, result });
      
      if (result.success) {
        console.log(`✅ Scheduled weekly activity: ${activity.title}`);
      }
    } catch (error) {
      console.error(`❌ Failed to schedule ${activity.title}:`, error);
      results.push({ activity: activity.title, result: { success: false, error: error.message } });
    }
  }

  return results;
};

// Example 8: Emergency/urgent reminders
export const sendUrgentReminder = async (title, message, minutesFromNow = 5) => {
  const urgentReminder = {
    id: `urgent-${Date.now()}`,
    title: `🚨 ${title}`,
    description: message,
    dueDate: new Date(Date.now() + minutesFromNow * 60 * 1000),
    priority: REMINDER_PRIORITIES.URGENT,
    recurring: RECURRING_TYPES.NONE,
    type: 'personal',
    category: 'other'
  };

  try {
    const result = await notificationService.scheduleReminderNotification(urgentReminder);
    
    if (result.success) {
      console.log(`⚡ Urgent reminder scheduled for ${minutesFromNow} minutes from now`);
      return result;
    } else {
      console.error('❌ Failed to schedule urgent reminder:', result.error);
      return result;
    }
  } catch (error) {
    console.error('💥 Error scheduling urgent reminder:', error);
    return { success: false, error: error.message };
  }
};

// Example 9: Test notification system
export const testNotificationSystem = async () => {
  console.log('🧪 Testing notification system...');
  
  try {
    // Test immediate notification
    await notificationService.sendTestNotification();
    
    // Test badge count
    await notificationService.setBadgeCount(3);
    
    // Test scheduling a notification for 1 minute from now
    const testReminder = {
      id: 'test-notification',
      title: 'Test Notification 🧪',
      description: 'This is a test notification to verify the system works',
      dueDate: new Date(Date.now() + 60 * 1000), // 1 minute from now
      priority: REMINDER_PRIORITIES.MEDIUM,
      recurring: RECURRING_TYPES.NONE,
      type: 'personal',
      category: 'other'
    };
    
    const scheduleResult = await notificationService.scheduleReminderNotification(testReminder);
    
    console.log('✅ Test notifications sent successfully');
    return {
      success: true,
      immediate: true,
      scheduled: scheduleResult.success,
      badgeSet: true
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions
const getCurrentBadgeCount = async () => {
  // This would fetch the current badge count from your app state or notification service
  return 0; // Placeholder
};

const getNextDayOfWeek = (dayOfWeek, timeString) => {
  const now = new Date();
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  // Calculate days until next occurrence
  const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
  if (daysUntilTarget === 0 && nextDate <= now) {
    // If it's today but time has passed, schedule for next week
    nextDate.setDate(nextDate.getDate() + 7);
  } else {
    nextDate.setDate(nextDate.getDate() + daysUntilTarget);
  }
  
  return nextDate;
};

// Example usage in a React component:
/*
import React, { useEffect } from 'react';
import { 
  initializeNotifications,
  scheduleAnniversaryReminder,
  setupNotificationHandlers
} from './path/to/usage';

const App = () => {
  useEffect(() => {
    // Initialize notifications when app starts
    initializeNotifications();
    
    // Setup notification handlers
    setupNotificationHandlers();
    
    // Schedule any default reminders
    scheduleAnniversaryReminder();
  }, []);

  return (
    // Your app content
  );
};
*/
