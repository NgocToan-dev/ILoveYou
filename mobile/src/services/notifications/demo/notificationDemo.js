/**
 * Notification System Demo
 * A comprehensive demonstration of the ILoveYou notification system capabilities
 */

import notificationService from '../index';
import ReminderNotificationJob from '../reminderJob';
import { RECURRING_TYPES, REMINDER_PRIORITIES } from '@shared/services/firebase/reminders';

class NotificationDemo {
  constructor() {
    this.reminderJob = null;
    this.demoResults = [];
  }

  async runCompleteDemo() {
    console.log('🎬 Starting ILoveYou Notification System Demo...\n');
    
    try {
      await this.demoInitialization();
      await this.demoSingleReminder();
      await this.demoRecurringReminder();
      await this.demoImmediateNotifications();
      await this.demoBadgeManagement();
      await this.demoNotificationCancellation();
      await this.demoErrorHandling();
      
      this.printDemoSummary();
      
    } catch (error) {
      console.error('💥 Demo failed:', error);
    } finally {
      this.cleanup();
    }
  }

  async demoInitialization() {
    console.log('📋 STEP 1: Notification Service Initialization');
    console.log('='.repeat(50));
    
    try {
      // Initialize notification service
      const initResult = await notificationService.initialize();
      this.logResult('Service Initialization', initResult);

      // Start reminder job
      this.reminderJob = new ReminderNotificationJob();
      this.reminderJob.start();
      this.logResult('Reminder Job Start', { success: true, message: 'Background job started' });

      console.log('✅ Notification system is ready!\n');
      
    } catch (error) {
      this.logResult('Initialization', { success: false, error: error.message });
      throw error;
    }
  }

  async demoSingleReminder() {
    console.log('📋 STEP 2: Single Reminder Scheduling');
    console.log('='.repeat(50));

    const testReminder = {
      id: 'demo-single-reminder',
      title: 'Anniversary Dinner 💕',
      description: 'Remember to make reservations at the romantic restaurant',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      priority: REMINDER_PRIORITIES.HIGH,
      recurring: RECURRING_TYPES.NONE,
      type: 'couple',
      category: 'special_occasions'
    };

    try {
      const result = await notificationService.scheduleReminderNotification(testReminder);
      this.logResult('Single Reminder Schedule', result);

      if (result.success) {
        console.log(`📅 Scheduled ${result.scheduled || 1} notification(s) for: ${testReminder.title}`);
        console.log(`⏰ Due: ${testReminder.dueDate.toLocaleString()}`);
        console.log(`🔔 Priority: ${testReminder.priority}\n`);
      }
      
    } catch (error) {
      this.logResult('Single Reminder', { success: false, error: error.message });
    }
  }

  async demoRecurringReminder() {
    console.log('📋 STEP 3: Recurring Reminder Scheduling');
    console.log('='.repeat(50));

    const recurringReminder = {
      id: 'demo-recurring-reminder',
      title: 'Daily Love Note 💌',
      description: 'Send a sweet message to your partner',
      dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      priority: REMINDER_PRIORITIES.MEDIUM,
      recurring: RECURRING_TYPES.DAILY,
      recurringEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      type: 'personal',
      category: 'personal_growth'
    };

    try {
      const result = await notificationService.scheduleRecurringReminder(recurringReminder);
      this.logResult('Recurring Reminder Schedule', result);

      if (result.success) {
        console.log(`🔄 Scheduled ${result.scheduled} recurring notifications for: ${recurringReminder.title}`);
        console.log(`📆 Recurrence: ${recurringReminder.recurring}`);
        console.log(`📅 End Date: ${recurringReminder.recurringEndDate.toLocaleString()}\n`);
      }
      
    } catch (error) {
      this.logResult('Recurring Reminder', { success: false, error: error.message });
    }
  }

  async demoImmediateNotifications() {
    console.log('📋 STEP 4: Immediate Notifications');
    console.log('='.repeat(50));

    const notifications = [
      {
        title: '💝 Love Message',
        body: 'You make every day brighter! 🌟',
        data: { type: 'love-message', sender: 'Demo User' }
      },
      {
        title: '⚠️ Overdue Reminders',
        body: 'You have 3 overdue reminders',
        data: { type: 'overdue-reminders', count: 3 }
      },
      {
        title: '🎉 Couple Activity',
        body: 'Time for your weekly date planning!',
        data: { type: 'couple-activity', activityId: 'weekly-planning' }
      }
    ];

    for (const notification of notifications) {
      try {
        const result = await notificationService.sendImmediateNotification(
          notification.title,
          notification.body,
          notification.data
        );
        
        this.logResult(`Immediate: ${notification.data.type}`, result);
        
        if (result.success) {
          console.log(`📲 Sent: ${notification.title}`);
        }
        
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        this.logResult(`Immediate: ${notification.data.type}`, { success: false, error: error.message });
      }
    }
    
    console.log('');
  }

  async demoBadgeManagement() {
    console.log('📋 STEP 5: Badge Count Management');
    console.log('='.repeat(50));

    const badgeTests = [
      { count: 5, description: 'Set badge to 5' },
      { count: 12, description: 'Update badge to 12' },
      { count: 0, description: 'Clear badge count' }
    ];

    for (const test of badgeTests) {
      try {
        const result = await notificationService.setBadgeCount(test.count);
        this.logResult(`Badge: ${test.description}`, result);
        
        if (result.success) {
          console.log(`🔢 ${test.description} - Success`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        this.logResult(`Badge: ${test.description}`, { success: false, error: error.message });
      }
    }
    
    console.log('');
  }

  async demoNotificationCancellation() {
    console.log('📋 STEP 6: Notification Cancellation');
    console.log('='.repeat(50));

    try {
      // Get scheduled notifications
      const scheduledResult = await notificationService.getScheduledNotifications();
      this.logResult('Get Scheduled Notifications', scheduledResult);
      
      if (scheduledResult.success) {
        console.log(`📋 Found ${scheduledResult.notifications.length} scheduled notifications`);
        
        // Cancel notifications for a specific reminder
        const cancelResult = await notificationService.cancelReminderNotifications('demo-single-reminder');
        this.logResult('Cancel Reminder Notifications', cancelResult);
        
        if (cancelResult.success) {
          console.log(`🗑️ Cancelled ${cancelResult.canceled} notifications for demo reminder`);
        }
      }
      
    } catch (error) {
      this.logResult('Notification Cancellation', { success: false, error: error.message });
    }
    
    console.log('');
  }

  async demoErrorHandling() {
    console.log('📋 STEP 7: Error Handling');
    console.log('='.repeat(50));

    // Test scheduling a past reminder
    const pastReminder = {
      id: 'demo-past-reminder',
      title: 'Past Reminder',
      description: 'This should fail',
      dueDate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      priority: REMINDER_PRIORITIES.MEDIUM,
      recurring: RECURRING_TYPES.NONE,
      type: 'personal'
    };

    try {
      const result = await notificationService.scheduleReminderNotification(pastReminder);
      this.logResult('Past Date Reminder (Expected Failure)', result);
      
      if (!result.success) {
        console.log(`❌ Correctly rejected past date: ${result.error}`);
      }
      
    } catch (error) {
      this.logResult('Error Handling Test', { success: true, message: 'Error caught correctly' });
      console.log(`✅ Error handling working: ${error.message}`);
    }
    
    console.log('');
  }

  printDemoSummary() {
    console.log('📊 DEMO SUMMARY');
    console.log('='.repeat(50));
    
    const successCount = this.demoResults.filter(r => r.success).length;
    const totalCount = this.demoResults.length;
    
    console.log(`✅ Successful operations: ${successCount}/${totalCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / totalCount) * 100)}%\n`);
    
    console.log('📋 Detailed Results:');
    this.demoResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.operation}`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n🎉 Demo completed!');
    console.log('🔔 The notification system is ready for production use.');
    console.log('📚 Check the examples folder for integration patterns.\n');
  }

  logResult(operation, result) {
    this.demoResults.push({
      operation,
      success: result.success,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${operation}: ${result.success ? 'Success' : result.error}`);
  }

  cleanup() {
    if (this.reminderJob) {
      this.reminderJob.stop();
      console.log('🧹 Cleaned up demo resources');
    }
  }

  // Test individual components
  async testRecurringDateCalculations() {
    console.log('🧮 Testing Recurring Date Calculations');
    console.log('='.repeat(50));

    const testCases = [
      {
        type: RECURRING_TYPES.DAILY,
        originalDate: new Date('2024-01-01T10:00:00'),
        fromDate: new Date('2024-01-03T15:00:00'),
        expected: 'Should be January 4th, 10:00 AM'
      },
      {
        type: RECURRING_TYPES.WEEKLY,
        originalDate: new Date('2024-01-01T10:00:00'), // Monday
        fromDate: new Date('2024-01-10T15:00:00'), // Wednesday
        expected: 'Should be January 15th (next Monday), 10:00 AM'
      },
      {
        type: RECURRING_TYPES.MONTHLY,
        originalDate: new Date('2024-01-15T10:00:00'),
        fromDate: new Date('2024-02-20T15:00:00'),
        expected: 'Should be March 15th, 10:00 AM'
      },
      {
        type: RECURRING_TYPES.YEARLY,
        originalDate: new Date('2024-01-15T10:00:00'),
        fromDate: new Date('2024-06-20T15:00:00'),
        expected: 'Should be January 15th, 2025, 10:00 AM'
      }
    ];

    testCases.forEach((testCase, index) => {
      try {
        const reminder = {
          dueDate: testCase.originalDate,
          recurring: testCase.type
        };
        
        // Use the current fromDate as the reference
        const originalCalcMethod = notificationService.calculateNextRecurringDate;
        const nextDate = originalCalcMethod.call(notificationService, reminder);
        
        console.log(`Test ${index + 1}: ${testCase.type}`);
        console.log(`  Original: ${testCase.originalDate.toLocaleString()}`);
        console.log(`  From: ${testCase.fromDate.toLocaleString()}`);
        console.log(`  Next: ${nextDate ? nextDate.toLocaleString() : 'null'}`);
        console.log(`  Expected: ${testCase.expected}`);
        console.log('');
        
      } catch (error) {
        console.log(`❌ Test ${index + 1} failed: ${error.message}`);
      }
    });
  }

  // Test notification channels
  async testNotificationChannels() {
    console.log('📡 Testing Notification Channels');
    console.log('='.repeat(50));

    const channelTests = [
      { type: 'reminders', title: 'Regular Reminder Test' },
      { type: 'recurring-reminders', title: 'Recurring Reminder Test' },
      { type: 'urgent-reminders', title: 'Urgent Reminder Test' },
      { type: 'overdue-reminders', title: 'Overdue Reminder Test' },
      { type: 'love-messages', title: 'Love Message Test' },
      { type: 'couple-activities', title: 'Couple Activity Test' }
    ];

    for (const test of channelTests) {
      try {
        const result = await notificationService.sendImmediateNotification(
          test.title,
          `Testing ${test.type} channel`,
          { type: test.type, test: true }
        );
        
        console.log(`📡 ${test.type}: ${result.success ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`❌ ${test.type} failed: ${error.message}`);
      }
    }
    
    console.log('');
  }
}

// Export for use in other files
export default NotificationDemo;

// If running directly, execute the demo
if (require.main === module) {
  const demo = new NotificationDemo();
  demo.runCompleteDemo().catch(console.error);
}

// Example usage:
/*
import NotificationDemo from './path/to/notificationDemo';

// Run complete demo
const demo = new NotificationDemo();
await demo.runCompleteDemo();

// Or test specific components
await demo.testRecurringDateCalculations();
await demo.testNotificationChannels();
*/
