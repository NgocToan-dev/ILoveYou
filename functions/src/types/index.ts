import { Timestamp } from 'firebase-admin/firestore';

export interface ReminderData {
  id?: string;
  title: string;
  description?: string;
  type: 'personal' | 'couple';
  userId?: string;
  creatorId: string;
  coupleId?: string;
  dueDate: Timestamp;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  completed: boolean;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notificationSent?: boolean;
  lastNotificationSent?: Timestamp;
  notificationAttempts?: number;
  lastNotificationError?: string;
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: Timestamp;
  };
  parentReminderId?: string;
}

export interface UserData {
  displayName?: string;
  email?: string;
  fcmToken?: string;
  fcmTokenUpdated?: Timestamp;
  notificationPreferences?: {
    enabled: boolean;
    reminders: boolean;
    coupleReminders: boolean;
    loveMessages: boolean;
    peacefulDaysMilestones: boolean;
    language: 'vi' | 'en';
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
    vibration: boolean;
    sound: boolean;
  };
  timezone?: string;
}

export interface CoupleData {
  members: string[];
  peacefulDays?: {
    enabled: boolean;
    currentStreak: number;
    lastUpdated: Timestamp;
    lastMilestoneCelebrated?: Timestamp;
  };
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  userId?: string;
  reminderId?: string;
  partnerId?: string;
  error?: string;
}

export interface CoupleNotificationResult {
  success: boolean;
  partner?: NotificationResult;
  creator?: NotificationResult;
  coupleId?: string;
  reminderId?: string;
  error?: string;
}