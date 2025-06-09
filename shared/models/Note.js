import { NOTE_TYPES, NOTE_CATEGORIES } from '../constants/notes';
import { formatDateString, toDate } from '../utils/dateUtils';

export class Note {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.content = data.content || '';
    this.category = data.category || NOTE_CATEGORIES.LOVE_LETTERS;
    this.type = data.type || NOTE_TYPES.PRIVATE;
    this.userId = data.userId || null;
    this.coupleId = data.coupleId || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.tags = data.tags || [];
    this.attachments = data.attachments || [];
    this.isDeleted = data.isDeleted || false;
    this.deletedAt = data.deletedAt || null;
  }

  // Static method to create from Firestore document
  static fromFirestore(doc) {
    if (!doc.exists()) {
      return null;
    }

    const data = doc.data();
    return new Note({
      id: doc.id,
      title: data.title || '',
      content: data.content || '',
      category: data.category || NOTE_CATEGORIES.LOVE_LETTERS,
      type: data.type || NOTE_TYPES.PRIVATE,
      userId: data.userId || null,
      coupleId: data.coupleId || null,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      tags: data.tags || [],
      attachments: data.attachments || [],
      isDeleted: data.isDeleted || false,
      deletedAt: data.deletedAt || null,
    });
  }

  // Convert to plain object for Firestore
  toFirestore() {
    return {
      title: this.title,
      content: this.content,
      category: this.category,
      type: this.type,
      userId: this.userId,
      coupleId: this.coupleId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
      attachments: this.attachments,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
    };
  }

  // Check if note is valid
  isValid() {
    return this.title.trim().length > 0 && this.content.trim().length > 0;
  }

  // Check if note is shared (couple note)
  isShared() {
    return this.type === NOTE_TYPES.SHARED && this.coupleId !== null;
  }

  // Check if note is private
  isPrivate() {
    return this.type === NOTE_TYPES.PRIVATE;
  }
  // Get formatted creation date
  getFormattedCreatedDate() {
    if (!this.createdAt) return 'Không rõ ngày';
    return formatDateString(this.createdAt, 'default', 'vi-VN');
  }

  // Get formatted update date
  getFormattedUpdatedDate() {
    if (!this.updatedAt) return 'Không rõ ngày';
    return formatDateString(this.updatedAt, 'default', 'vi-VN');
  }
  // Check if note was edited
  wasEdited() {
    if (!this.createdAt || !this.updatedAt) return false;
    
    try {
      const createdDate = toDate(this.createdAt);
      const updatedDate = toDate(this.updatedAt);
      
      if (!createdDate || !updatedDate) return false;
      
      return updatedDate.getTime() > createdDate.getTime();
    } catch (error) {
      console.error('Error comparing dates:', error);
      return false;
    }
  }

  // Get word count
  getWordCount() {
    if (!this.content) return 0;
    return this.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Get character count
  getCharacterCount() {
    return this.content ? this.content.length : 0;
  }

  // Get reading time estimate (average 200 words per minute)
  getReadingTimeMinutes() {
    const wordCount = this.getWordCount();
    return Math.ceil(wordCount / 200);
  }

  // Clone note
  clone() {
    return new Note({
      id: this.id,
      title: this.title,
      content: this.content,
      category: this.category,
      type: this.type,
      userId: this.userId,
      coupleId: this.coupleId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: [...this.tags],
      attachments: [...this.attachments],
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
    });
  }

  // Update note data
  update(data = {}) {
    if (data.title !== undefined) this.title = data.title;
    if (data.content !== undefined) this.content = data.content;
    if (data.category !== undefined) this.category = data.category;
    if (data.type !== undefined) this.type = data.type;
    if (data.coupleId !== undefined) this.coupleId = data.coupleId;
    if (data.tags !== undefined) this.tags = data.tags;
    if (data.attachments !== undefined) this.attachments = data.attachments;
    
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
      return new Note(data);
    } catch (error) {
      console.error('Error parsing Note JSON:', error);
      return new Note();
    }
  }
}

export default Note;