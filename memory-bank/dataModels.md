# Data Models & Firestore Architecture

## Overview
This document defines the complete data architecture for the ILoveYou app enhancement, including new collections for notes, reminders, peaceful days tracking, and internationalization settings.

## Existing Collections

### Users Collection
**Collection**: `users`
**Document ID**: Firebase User UID

```typescript
interface User {
  id: string;                    // Firebase UID
  displayName: string;           // User's display name
  email: string;                 // Email address
  bio: string;                   // Personal bio/description
  phoneNumber: string;           // Phone number (optional)
  createdAt: Timestamp;          // Account creation date
  updatedAt?: Timestamp;         // Last profile update
  
  // Future enhancements
  profilePhotoUrl?: string;      // Firebase Storage URL
  preferences?: {
    notifications: boolean;
    privacy: 'public' | 'private';
  };
}
```

### Couples Collection
**Collection**: `couples`
**Document ID**: Auto-generated

```typescript
interface Couple {
  id: string;                    // Firestore document ID
  members: [string, string];     // Array of exactly 2 user IDs
  createdAt: Timestamp;          // Relationship start date
  updatedAt?: Timestamp;         // Last update
  
  // Future enhancements
  anniversaryDate?: Timestamp;   // Official anniversary
  relationshipStatus: 'dating' | 'engaged' | 'married';
  sharedSettings?: {
    timezone: string;
    language: 'en' | 'vi';
  };
}
```

### Messages Collection
**Collection**: `messages`
**Document ID**: Auto-generated

```typescript
interface Message {
  id: string;                    // Firestore document ID
  participants: [string, string]; // Exactly 2 user IDs
  senderId: string;              // ID of message sender
  content: string;               // Message text content
  timestamp: Timestamp;          // When message was sent
  
  // Future enhancements
  type?: 'text' | 'image' | 'voice'; // Message type
  mediaUrl?: string;             // Firebase Storage URL for media
  reactions?: {
    [userId: string]: '❤️' | '😍' | '😘' | '🥰';
  };
  readBy?: {
    [userId: string]: Timestamp;
  };
}
```

## New Collections for Enhancement Features

### Notes Collection
**Collection**: `notes`
**Document ID**: Auto-generated

```typescript
interface Note {
  id: string;                    // Firestore document ID
  type: 'private' | 'shared';    // Note visibility type
  authorId: string;              // ID of note creator
  coupleId?: string;             // Couple ID (for shared notes)
  
  // Content
  category: 'love_letter' | 'memory' | 'dream' | 'gratitude' | 'daily_thoughts' | 'other';
  title: string;                 // Note title (max 100 chars)
  content: string;               // Note content (max 10,000 chars)
  
  // Media attachments
  mediaUrls: string[];           // Firebase Storage URLs
  mediaTypes: ('image' | 'voice' | 'video')[]; // Corresponding media types
  
  // Organization
  tags: string[];                // User-defined tags
  color?: string;                // Note color theme
  pinned: boolean;               // Pinned to top
  
  // Sharing (for shared notes)
  sharedWith: string[];          // User IDs with access
  permissions: {
    [userId: string]: 'read' | 'edit'; // User permissions
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastViewedAt?: {
    [userId: string]: Timestamp;
  };
  
  // Collaboration tracking
  editHistory?: {
    userId: string;
    action: 'created' | 'edited' | 'shared';
    timestamp: Timestamp;
    changes?: string;            // Description of changes
  }[];
}

// Firestore indexes needed:
// - authorId, createdAt (desc)
// - coupleId, type, createdAt (desc)
// - type, category, createdAt (desc)
// - tags (array), createdAt (desc)
```

### Reminders Collection
**Collection**: `reminders`
**Document ID**: Auto-generated

```typescript
interface Reminder {
  id: string;                    // Firestore document ID
  type: 'personal' | 'couple';   // Reminder scope
  creatorId: string;             // ID of reminder creator
  coupleId?: string;             // Couple ID (for couple reminders)
  
  // Content
  title: string;                 // Reminder title (max 100 chars)
  description: string;           // Optional description (max 500 chars)
  category: 'anniversary' | 'date_night' | 'special_occasion' | 'daily_task' | 'self_care' | 'other';
  
  // Scheduling
  dueDate: Timestamp;            // When reminder is due
  allDay: boolean;               // All-day event or specific time
  
  // Recurring settings
  recurring: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;            // Every X days/weeks/months/years
    endDate?: Timestamp;         // When recurring stops
    customDays?: number[];       // For weekly: [0,1,2,3,4,5,6] (Sun-Sat)
  };
  
  // Notification settings
  notificationSettings: {
    enabled: boolean;
    reminderTimes: number[];     // Minutes before due date [15, 60, 1440]
    customMessage?: string;      // Custom notification text
  };
  
  // Completion tracking
  completed: boolean;
  completedAt?: Timestamp;
  completedBy?: string;          // User ID who completed it
  
  // Partner settings (for couple reminders)
  assignedTo?: string[];         // User IDs responsible
  partnerNotifications: boolean; // Notify partner when completed
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Occurrence tracking (for recurring reminders)
  nextOccurrence?: Timestamp;
  pastOccurrences?: {
    date: Timestamp;
    completed: boolean;
    completedBy?: string;
  }[];
}

// Firestore indexes needed:
// - creatorId, dueDate (asc)
// - coupleId, type, dueDate (asc)
// - type, category, dueDate (asc)
// - dueDate (asc) - for global reminder queries
```

### Peaceful Days Collection
**Collection**: `peacefulDays`
**Document ID**: Couple ID

```typescript
interface PeacefulDays {
  id: string;                    // Couple ID (document ID)
  
  // Current streak tracking
  currentStreak: number;         // Current consecutive peaceful days
  longestStreak: number;         // All-time longest streak
  
  // Date tracking
  lastResetDate?: Timestamp;     // When streak was last reset to 0
  lastIncrementDate?: Timestamp; // When streak was last incremented
  streakStartDate?: Timestamp;   // When current streak started
  
  // Milestone achievements
  milestones: {
    days: number;                // Milestone day count (7, 30, 100, etc.)
    achievedAt: Timestamp;       // When milestone was reached
    celebrated: boolean;         // Whether couple has acknowledged milestone
    celebrationMessage?: string; // Custom celebration message
  }[];
  
  // Historical data
  allTimeStats: {
    totalPeacefulDays: number;   // Total peaceful days ever
    totalResets: number;         // Number of times reset
    averageStreakLength: number; // Average streak length
    longestStreakDuration: {     // Details of longest streak
      days: number;
      startDate: Timestamp;
      endDate: Timestamp;
    };
  };
  
  // Partner synchronization
  lastUpdatedBy: string;         // User ID who last updated
  pendingIncrement?: {           // For partner confirmation
    requestedBy: string;
    requestedAt: Timestamp;
    message?: string;
  };
  
  // Timestamps
  createdAt: Timestamp;          // When tracking started
  updatedAt: Timestamp;          // Last update
  
  // Settings
  settings: {
    requirePartnerConfirmation: boolean; // Both partners must agree on resets
    autoIncrement: boolean;      // Automatically increment daily
    celebrationStyle: 'subtle' | 'enthusiastic'; // Celebration preference
  };
}

// No additional indexes needed - queries by couple ID only
```

### i18n Settings Collection
**Collection**: `i18nSettings`
**Document ID**: User ID

```typescript
interface I18nSettings {
  id: string;                    // User ID (document ID)
  
  // Language settings
  language: 'en' | 'vi';         // Preferred language
  fallbackLanguage: 'en';       // Always English as fallback
  
  // Regional settings
  timezone: string;              // User's timezone (e.g., 'Asia/Ho_Chi_Minh')
  dateFormat: 'US' | 'VN';       // MM/DD/YYYY vs DD/MM/YYYY
  timeFormat: '12h' | '24h';     // 12-hour vs 24-hour time
  
  // Cultural preferences
  formalityLevel: 'casual' | 'respectful' | 'formal'; // Vietnamese formality
  romanticStyle: 'sweet' | 'traditional' | 'modern';  // Romantic expression style
  
  // Notification language
  notificationLanguage: 'en' | 'vi'; // Language for push notifications
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Partner consideration (for couples)
  partnerLanguage?: 'en' | 'vi'; // Partner's language for shared content
  sharedContentLanguage?: 'en' | 'vi' | 'both'; // Language for shared notes
}

// No additional indexes needed - queries by user ID only
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isCoupleMembers(coupleId) {
      return request.auth.uid in get(/databases/$(database)/documents/couples/$(coupleId)).data.members;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Couples collection
    match /couples/{coupleId} {
      allow read, write: if isAuthenticated() && isCoupleMembers(coupleId);
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid in resource.data.participants;
    }
    
    // Notes collection
    match /notes/{noteId} {
      allow read: if isAuthenticated() && (
        isOwner(resource.data.authorId) ||
        request.auth.uid in resource.data.sharedWith
      );
      allow write: if isAuthenticated() && (
        isOwner(resource.data.authorId) ||
        (request.auth.uid in resource.data.sharedWith && 
         resource.data.permissions[request.auth.uid] == 'edit')
      );
    }
    
    // Reminders collection
    match /reminders/{reminderId} {
      allow read, write: if isAuthenticated() && (
        isOwner(resource.data.creatorId) ||
        (resource.data.type == 'couple' && isCoupleMembers(resource.data.coupleId))
      );
    }
    
    // Peaceful days collection
    match /peacefulDays/{coupleId} {
      allow read, write: if isAuthenticated() && isCoupleMembers(coupleId);
    }
    
    // i18n settings collection
    match /i18nSettings/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

## Firebase Storage Structure

```
/couples/{coupleId}/
  ├── notes/{noteId}/
  │   ├── images/
  │   │   ├── {timestamp}_{filename}.jpg
  │   │   └── thumbnails/
  │   │       └── {timestamp}_{filename}_thumb.jpg
  │   ├── voice/
  │   │   └── {timestamp}_{filename}.m4a
  │   └── videos/
  │       └── {timestamp}_{filename}.mp4
  ├── messages/{messageId}/
  │   ├── images/
  │   └── voice/
  └── profiles/
      ├── {userId}_profile.jpg
      └── {userId}_cover.jpg
```

## Data Migration Strategy

### Phase 1: Collection Creation
1. Create new collections with initial documents
2. Set up Firestore indexes
3. Configure security rules
4. Test with sample data

### Phase 2: Existing Data Enhancement
1. Add new fields to existing collections (couples, users)
2. Migrate existing data to new structure
3. Update existing Firebase functions

### Phase 3: Feature Integration
1. Connect new collections to app features
2. Implement real-time listeners
3. Add offline support

## Performance Considerations

### Query Optimization
- **Pagination**: Implement pagination for large note collections
- **Indexing**: Create composite indexes for common query patterns
- **Caching**: Use local caching for frequently accessed data

### Storage Optimization
- **Image Compression**: Compress images before upload
- **Thumbnail Generation**: Create thumbnails for images
- **Voice Compression**: Use efficient audio codecs

### Real-time Listener Management
- **Selective Listening**: Only listen to relevant data
- **Proper Cleanup**: Unsubscribe listeners when components unmount
- **Batched Updates**: Group related updates together

This data architecture provides a solid foundation for all four enhancement features while maintaining performance, security, and scalability.