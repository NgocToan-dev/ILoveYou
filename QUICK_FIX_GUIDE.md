# 🚨 Quick Fix for Firebase Errors

## The Error You're Seeing:
```
ERROR: Missing or insufficient permissions
ERROR: The query requires an index
```

## ⚡ Immediate Fix (2 Steps)

### Step 1: Fix Permissions (30 seconds)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database** → **Rules**
4. Replace all content with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
5. Click **Publish**

### Step 2: Fix Indexes (Auto-create)
1. **Run your app again** - it will show index errors
2. **Click the error link** in console - it auto-creates the index
3. **Wait 2-3 minutes** for index to build
4. **Refresh your app** - error gone!

## ✅ That's It!
Your app should now work perfectly with:
- ✅ Couple connection
- ✅ Notes creation and viewing
- ✅ Reminders functionality
- ✅ All real-time features

## 🔒 For Production Later
When ready for production, use the secure rules from `firestore.rules` instead of the development rules above.

---
**Need help?** Check `FIREBASE_SETUP.md` for detailed instructions.