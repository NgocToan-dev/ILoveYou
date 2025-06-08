import { REMINDER_TYPES, REMINDER_PRIORITIES, REMINDER_CATEGORIES, RECURRING_TYPES } from '../services/firebase/reminders';
import { formatDateString, toDate } from '../utils/dateUtils';

export class Reminder {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || REMINDER_CATEGORIES.SPECIAL_OCCASIONS;
    this.priority = data.priority || REMINDER_PRIORITIES.MEDIUM;
    this.type = data.type || REMINDER_TYPES.PERSONAL;
    this.userId = data.userId || null;
    this.coupleId = data.coupleId || null;
    this.dueDate = data.dueDate || null;
    this.completed = data.completed || false;
    this.completedAt = data.completedAt || null;
    this.completedBy = data.completedBy || null;
    this.recurring = data.recurring || RECURRING_TYPES.NONE;
    this.recurringEndDate = data.recurringEndDate || null;
    this.notifications = data.notifications || [];
    this.tags = data.tags || [];
    this.attachments = data.attachments || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isDeleted = data.isDeleted || false;
    this.deletedAt = data.deletedAt || null;
    this.snoozeUntil = data.snoozeUntil || null;
    this.notes = data.notes || '';
  }

  // Static method to create from Firestore document
  static fromFirestore(doc) {
    if (!doc.exists()) {
      return null;
    }

    const data = doc.data();
    return new Reminder({
      id: doc.id,
      title: data.title || '',
      description: data.description || '',
      category: data.category || REMINDER_CATEGORIES.SPECIAL_OCCASIONS,
      priority: data.priority || REMINDER_PRIORITIES.MEDIUM,
      type: data.type || REMINDER_TYPES.PERSONAL,
      userId: data.userId || null,
      coupleId: data.coupleId || null,
      dueDate: data.dueDate || null,
      completed: data.completed || false,
      completedAt: data.completedAt || null,
      completedBy: data.completedBy || null,
      recurring: data.recurring || RECURRING_TYPES.NONE,
      recurringEndDate: data.recurringEndDate || null,
      notifications: data.notifications || [],
      tags: data.tags || [],
      attachments: data.attachments || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      isDeleted: data.isDeleted || false,
      deletedAt: data.deletedAt || null,
      snoozeUntil: data.snoozeUntil || null,
      notes: data.notes || '',
    });
  }

  // Convert to plain object for Firestore
  toFirestore() {
    return {
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      type: this.type,
      userId: this.userId,
      coupleId: this.coupleId,
      dueDate: this.dueDate,
      completed: this.completed,
      completedAt: this.completedAt,
      completedBy: this.completedBy,
      recurring: this.recurring,
      recurringEndDate: this.recurringEndDate,
      notifications: this.notifications,
      tags: this.tags,
      attachments: this.attachments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      snoozeUntil: this.snoozeUntil,
      notes: this.notes,
    };
  }

  // Check if reminder is valid
  isValid() {
    return this.title.trim().length > 0 && this.dueDate !== null;
  }

  // Check if reminder is shared (couple reminder)
  isShared() {
    return this.type === REMINDER_TYPES.COUPLE && this.coupleId !== null;
  }

  // Check if reminder is personal
  isPersonal() {
    return this.type === REMINDER_TYPES.PERSONAL;
  }  // Get safe due date
  getSafeDueDate() {
    return toDate(this.dueDate);
  }

  // Check if reminder is overdue
  isOverdue() {
    if (this.completed) return false;
    
    const dueDate = this.getSafeDueDate();
    if (!dueDate || isNaN(dueDate.getTime())) return false;
    
    return dueDate < new Date();
  }

  // Check if reminder is due today
  isDueToday() {
    const dueDate = this.getSafeDueDate();
    if (!dueDate || isNaN(dueDate.getTime())) return false;
    
    const today = new Date();
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  }

  // Check if reminder is due tomorrow
  isDueTomorrow() {
    const dueDate = this.getSafeDueDate();
    if (!dueDate || isNaN(dueDate.getTime())) return false;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return (
      dueDate.getDate() === tomorrow.getDate() &&
      dueDate.getMonth() === tomorrow.getMonth() &&
      dueDate.getFullYear() === tomorrow.getFullYear()
    );
  }

  // Check if reminder is upcoming (within next 7 days)
  isUpcoming() {
    const dueDate = this.getSafeDueDate();
    if (!dueDate || isNaN(dueDate.getTime())) return false;
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return dueDate >= now && dueDate <= nextWeek;
  }

  // Get formatted due date
  getFormattedDueDate() {
    const dueDate = this.getSafeDueDate();
    if (!dueDate || isNaN(dueDate.getTime())) return 'Không có hạn';
    
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
      return `Quá hạn ${Math.abs(diffDays)} ngày`;
    } else if (diffDays === 0) {
      return 'Hôm nay';
    } else if (diffDays === 1) {
      return 'Ngày mai';
    } else if (diffDays <= 7) {
      return `${diffDays} ngày nữa`;
    } else {
      return formatDateString(dueDate, 'default', 'vi-VN');
    }
  }
  // Get formatted creation date
  getFormattedCreatedDate() {
    if (!this.createdAt) return 'Không rõ ngày';
    return formatDateString(this.createdAt, 'default', 'vi-VN');
  }

  // Get time until due
  getTimeUntilDue() {
    const dueDate = this.getSafeDueDate();
    if (!dueDate || isNaN(dueDate.getTime())) return null;
    
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    
    if (diffTime < 0) return null; // Overdue
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days: diffDays, hours: diffHours, minutes: diffMinutes };
  }

  // Mark as completed
  markAsCompleted(userId = null) {
    this.completed = true;
    this.completedAt = new Date();
    this.completedBy = userId;
    this.updatedAt = new Date();
    return this;
  }

  // Mark as incomplete
  markAsIncomplete() {
    this.completed = false;
    this.completedAt = null;
    this.completedBy = null;
    this.updatedAt = new Date();
    return this;
  }

  // Snooze reminder
  snooze(minutes = 60) {
    this.snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    this.updatedAt = new Date();
    return this;
  }
  // Check if reminder is snoozed
  isSnoozed() {
    if (!this.snoozeUntil) return false;
    
    const snoozeDate = toDate(this.snoozeUntil);
    if (!snoozeDate) return false;
    
    return snoozeDate > new Date();
  }

  // Clone reminder
  clone() {
    return new Reminder({
      id: this.id,
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      type: this.type,
      userId: this.userId,
      coupleId: this.coupleId,
      dueDate: this.dueDate,
      completed: this.completed,
      completedAt: this.completedAt,
      completedBy: this.completedBy,
      recurring: this.recurring,
      recurringEndDate: this.recurringEndDate,
      notifications: [...this.notifications],
      tags: [...this.tags],
      attachments: [...this.attachments],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      snoozeUntil: this.snoozeUntil,
      notes: this.notes,
    });
  }

  // Update reminder data
  update(data = {}) {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.category !== undefined) this.category = data.category;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.type !== undefined) this.type = data.type;
    if (data.coupleId !== undefined) this.coupleId = data.coupleId;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.recurring !== undefined) this.recurring = data.recurring;
    if (data.recurringEndDate !== undefined) this.recurringEndDate = data.recurringEndDate;
    if (data.notifications !== undefined) this.notifications = data.notifications;
    if (data.tags !== undefined) this.tags = data.tags;
    if (data.attachments !== undefined) this.attachments = data.attachments;
    if (data.notes !== undefined) this.notes = data.notes;
    
    this.updatedAt = new Date();
    return this;
  }

  // Mark as deleted (soft delete)
  markAsDeleted() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    return this;
  }

  // Restore from deleted state
  restore() {
    this.isDeleted = false;
    this.deletedAt = null;
    this.updatedAt = new Date();
    return this;
  }

  // Convert to JSON string
  toJSON() {
    return JSON.stringify(this.toFirestore());
  }

  // Create from JSON string
  static fromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return new Reminder(data);
    } catch (error) {
      console.error('Error parsing Reminder JSON:', error);
      return new Reminder();
    }
  }

  // Get next occurrence for recurring reminders
  getNextOccurrence() {
    if (this.recurring === RECURRING_TYPES.NONE) return null;
    
    const dueDate = this.getSafeDueDate();
    if (!dueDate) return null;
    
    const nextDate = new Date(dueDate);
    
    switch (this.recurring) {
      case RECURRING_TYPES.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RECURRING_TYPES.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RECURRING_TYPES.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RECURRING_TYPES.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        return null;
    }
      // Check if recurring end date is set and passed
    if (this.recurringEndDate) {
      const endDate = toDate(this.recurringEndDate);
      if (endDate && nextDate > endDate) return null;
    }
    
    return nextDate;
  }
}

export default Reminder;