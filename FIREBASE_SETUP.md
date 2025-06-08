# Firebase Setup Guide for ILoveYou App

## 🔥 Firebase Configuration Required

The app is getting errors because Firebase needs:
1. **Security Rules** updated for new collections
2. **Database Indexes** created for complex queries

## 🚨 Quick Fix (Two Steps Required)

### Step 1: Deploy Security Rules
1. Open Firebase Console: https://console.firebase.google.com
2. Go to your project → Firestore Database → Rules
3. Copy and paste the content from `firestore-dev.rules`
4. Click "Publish"

### Step 2: Create Database Indexes
**Option A: Auto-create (Recommended)**
1. Click the error link in your app console
2. It will auto-create the required index
3. Wait 2-3 minutes for index to build

**Option B: Manual setup**
1. Go to Firestore Database → Indexes
2. Import `firestore.indexes.json` using Firebase CLI

This allows all authenticated users to read/write all documents (for testing only).

## 🔒 Production Rules (Recommended)

For production, use the secure rules from `firestore.rules` which include:

### Security Features:
- ✅ Users can only access their own data
- ✅ Couple members can access shared data
- ✅ Private notes are truly private
- ✅ Shared notes accessible to couple members only
- ✅ Invitation codes readable by anyone (for joining)
- ✅ Proper ownership validation

### Collections Covered:
- `users` - User profiles and settings
- `couples` - Couple relationship data
- `coupleInvitations` - Invitation codes with expiry
- `notes` - Private and shared notes with categories
- `reminders` - Personal and couple reminders
- `peacefulDays` - Peaceful days counter data

## 🚀 Deployment Steps

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy content from `firestore.rules` (for production) or `firestore-dev.rules` (for testing)
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Firebase CLI
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init firestore

# Deploy rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 📊 Database Indexes Required

The app uses complex queries that require composite indexes. Firebase will show error messages with links to auto-create indexes.

### Auto-Create Indexes (Easiest):
1. Run the app and reproduce the error
2. Click the link in the error message
3. Wait 2-3 minutes for index to build
4. Refresh the app

### Manual Index Creation:
1. Use Firebase CLI: `firebase deploy --only firestore:indexes`
2. Or import `firestore.indexes.json` in Firebase Console

### Required Indexes:
- Notes: `(type, userId, updatedAt)`, `(type, userId, category, updatedAt)`
- Notes: `(type, coupleId, updatedAt)`, `(type, coupleId, category, updatedAt)`
- Reminders: `(type, userId, dueDate)`, `(type, userId, completed, dueDate)`
- Reminders: `(type, coupleId, dueDate)`, `(type, coupleId, completed, dueDate)`
- Invitations: `(code, status)`, `(createdBy, status)`

##  Rule Explanations

### Users Collection
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```
- Users can only access their own profile data

### Couples Collection
```javascript
match /couples/{coupleId} {
  allow read, write: if request.auth != null && (
    resource.data.user1.id == request.auth.uid ||
    resource.data.user2.id == request.auth.uid
  );
}
```
- Only couple members can access couple data

### Notes Collection
```javascript
// Private notes - owner only
allow read, write: if request.auth != null && 
  resource.data.type == 'private' && 
  resource.data.userId == request.auth.uid;

// Shared notes - couple members
allow read, write: if request.auth != null && 
  resource.data.type == 'shared' && (
    resource.data.userId == request.auth.uid ||
    userIsCoupleMembers(request.auth.uid, resource.data.coupleId)
  );
```
- Private notes: owner only
- Shared notes: couple members only

### Reminders Collection
```javascript
// Similar structure to notes
// Personal reminders: owner only
// Couple reminders: couple members only
```

### Couple Invitations
```javascript
match /coupleInvitations/{invitationId} {
  allow read: if request.auth != null; // Anyone can read to join
  allow create: if request.auth != null && 
    request.resource.data.createdBy == request.auth.uid;
}
```
- Anyone authenticated can read (to join with codes)
- Only creators can create/update/delete their invitations

## ⚠️ Important Notes

1. **Test with Development Rules First**: Use `firestore-dev.rules` to test all functionality
2. **Switch to Production Rules**: Once testing is complete, deploy `firestore.rules`
3. **Monitor Security**: Check Firebase Console for any rule violations
4. **User Data Structure**: Ensure users have `coupleId` field for couple-based permissions

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing or insufficient permissions"**
   - Deploy the development rules first
   - Check if user is authenticated
   - Verify document structure matches rule expectations

2. **Rules not taking effect**
   - Wait 1-2 minutes after deployment
   - Clear app cache/restart
   - Check Firebase Console for rule syntax errors

3. **Couple permissions not working**
   - Ensure user profile has `coupleId` field
   - Verify couple document exists
   - Check user is listed in couple members

## 📱 App Collections Schema

### Required Fields for Security Rules:

**users/{userId}:**
```javascript
{
  displayName: string,
  email: string,
  coupleId?: string, // Important for couple permissions
  createdAt: Timestamp
}
```

**couples/{coupleId}:**
```javascript
{
  user1: { id: string, name: string },
  user2: { id: string, name: string },
  createdAt: Timestamp,
  status: string
}
```

**notes/{noteId}:**
```javascript
{
  title: string,
  content: string,
  type: 'private' | 'shared', // Important for permissions
  userId: string, // Creator
  coupleId?: string, // For shared notes
  category: string,
  createdAt: Timestamp
}
```

## ✅ Verification Steps

After deploying rules:
1. ✅ Test user registration/login
2. ✅ Test couple connection
3. ✅ Test private notes creation
4. ✅ Test shared notes creation
5. ✅ Test reminders creation
6. ✅ Test peaceful days counter

If all tests pass, the security rules are working correctly! 🎉