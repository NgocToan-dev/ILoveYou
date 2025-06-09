# Mobile Notifications Complete Deployment Guide

## 🎯 Overview

This comprehensive guide provides step-by-step instructions for deploying the ILoveYou mobile notifications system to production using **Cloudflare Pages** for the web application and **Firebase Functions** for the backend infrastructure.

## 📋 Prerequisites

### Required Accounts & Services
- ✅ **Firebase Project** with billing enabled (for Functions)
- ✅ **Google Cloud Console** access (for FCM API)
- ✅ **Cloudflare Account** with Pages enabled
- ✅ **GitHub Repository** with latest code
- ✅ **Domain Name** (optional, for custom domain)

### Development Environment
- ✅ **Node.js 18+** installed locally
- ✅ **Firebase CLI** (`npm install -g firebase-tools`)
- ✅ **Git** configured with repository access
- ✅ **Text Editor** for environment configuration

### Knowledge Requirements
- 📚 Basic understanding of Firebase services
- 📚 Familiarity with Cloudflare Pages deployment
- 📚 Understanding of environment variables
- 📚 Basic knowledge of DNS configuration

## 🔥 Firebase Project Setup

### 1. Firebase Project Configuration

#### Enable Required APIs
```bash
# Login to Firebase CLI
firebase login

# Select your project
firebase use your-project-id

# Enable required APIs in Google Cloud Console
# Visit: https://console.cloud.google.com/apis/library
# Enable these APIs:
# - Firebase Cloud Messaging API
# - Cloud Functions for Firebase API
# - Firebase Admin SDK API
```

#### Verify Project Structure
```bash
# Your project should have this structure:
firebase projects:list

# Expected output:
# ✔ your-project-id (Your Project Name)
```

### 2. Firebase Cloud Messaging Setup

#### Generate VAPID Keys
```bash
# Install Firebase Admin SDK globally
npm install -g firebase-admin

# Generate VAPID key pair
firebase messaging:generate-vapid-key

# Save the generated VAPID key - you'll need it for environment variables
# Example output: BNJxw9HNK... (keep this secure!)
```

#### Configure FCM Settings
1. **Firebase Console** → Your Project → **Project Settings**
2. **Cloud Messaging** tab
3. Note down:
   - **Server Key** (Legacy - for reference)
   - **Sender ID** (already in your config)
   - **VAPID Key** (just generated)

### 3. Firestore Database Setup

#### Deploy Security Rules
```bash
# Navigate to project root
cd /path/to/ILoveYou

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Expected output:
# ✔ Deploy complete!
```

#### Verify Security Rules
```javascript
// Verify these rules are active in firestore.rules:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User FCM tokens
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        request.auth.uid == userId && 
        request.writeFields.hasOnly(['fcmToken', 'fcmTokenUpdated', 'notificationPreferences']);
    }
    
    // Reminders with notification access
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && (
        resource.data.creatorId == request.auth.uid ||
        (resource.data.type == 'couple' && 
         resource.data.coupleId in getUserCouples(request.auth.uid))
      );
    }
  }
}
```

## ⚙️ Firebase Functions Deployment

### 1. Functions Environment Setup

#### Install Dependencies
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Verify TypeScript compilation
npm run build

# Expected output: Compilation successful
```

#### Configure Environment Variables
```bash
# Set Firebase Functions environment variables
firebase functions:config:set \
  notification.vapid_key="YOUR_VAPID_KEY_HERE" \
  notification.web_app_url="https://your-domain.pages.dev"

# For Vietnamese timezone support
firebase functions:config:set \
  app.timezone="Asia/Ho_Chi_Minh" \
  app.language="vi"

# Verify configuration
firebase functions:config:get
```

### 2. Deploy Firebase Functions

#### Build and Deploy
```bash
# From project root
cd functions

# Build TypeScript
npm run build

# Deploy all functions
firebase deploy --only functions

# Alternative: Deploy specific functions
firebase deploy --only functions:updateFCMToken,functions:scheduleReminderCheck
```

#### Verify Deployment
```bash
# Check function status
firebase functions:log

# Test function endpoints (after web deployment)
curl -X POST https://us-central1-your-project.cloudfunctions.net/updateFCMToken \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"token": "test-token"}'
```

### 3. Scheduled Functions Configuration

#### Verify Scheduled Jobs
```bash
# Check if scheduled functions are running
firebase functions:log --only scheduleReminderCheck

# Expected output every minute:
# Function execution took 234 ms, finished with status: 'ok'
```

#### Monitor Function Performance
```bash
# View function metrics in Firebase Console
# Navigate to: Firebase Console → Functions → Usage tab
# Monitor:
# - Invocations per minute
# - Execution time
# - Error rate
# - Memory usage
```

## ☁️ Cloudflare Pages Configuration

### 1. Repository Connection

#### Connect GitHub Repository
1. **Cloudflare Dashboard** → **Pages** → **Create a project**
2. **Connect to Git** → Select **GitHub**
3. Choose **ILoveYou** repository
4. Configure deployment settings:
   - **Project name**: `iloveyou-web`
   - **Production branch**: `main`
   - **Build command**: `cd web && npm run build`
   - **Build output directory**: `web/dist`

### 2. Build Configuration

#### Build Settings
```yaml
# Cloudflare Pages build configuration
Build command: cd web && npm install && npm run build
Build output directory: web/dist
Root directory: /
Node.js version: 18
```

#### Environment Variables Setup
```bash
# In Cloudflare Pages → Settings → Environment Variables
# Add these production variables:

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# FCM Configuration
VITE_FIREBASE_VAPID_KEY=BNJxw9HNK... # VAPID key from step 2
VITE_FIREBASE_FUNCTIONS_REGION=us-central1

# App Configuration
VITE_APP_NAME=ILoveYou
VITE_APP_VERSION=1.0.0
VITE_WEB_APP_URL=https://your-domain.pages.dev
```

### 3. PWA Configuration

#### Service Worker Registration
```javascript
// Verify in web/vite.config.js:
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-project\.firebaseapp\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
            },
          }
        ]
      },
      manifest: {
        name: 'ILoveYou - Tình Yêu Đôi Lứa',
        short_name: 'ILoveYou',
        start_url: '/',
        display: 'standalone',
        background_color: '#fce7f3',
        theme_color: '#ec4899',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
```

### 4. Domain Configuration (Optional)

#### Custom Domain Setup
```bash
# In Cloudflare Pages → Custom domains
# 1. Add your custom domain: yourdomain.com
# 2. Update DNS records in Cloudflare:
#    - CNAME: yourdomain.com → iloveyou-web.pages.dev
#    - CNAME: www.yourdomain.com → iloveyou-web.pages.dev
```

#### SSL Configuration
```bash
# Cloudflare automatically provisions SSL certificates
# Verify SSL status:
# - Universal SSL: Active
# - Edge Certificates: Active
# - Always Use HTTPS: Enabled
```

## 🔒 Security Configuration

### 1. Firebase Security Rules

#### Validate Security Rules
```bash
# Test security rules locally
firebase emulators:start --only firestore

# Run security tests
cd web
npm run test:security

# Deploy rules to production
firebase deploy --only firestore:rules
```

#### Monitor Security
```bash
# Enable Firestore security monitoring
# Firebase Console → Firestore → Usage tab
# Monitor:
# - Read/Write operations
# - Security rule denials
# - Quota usage
```

### 2. Environment Security

#### Secure VAPID Keys
```bash
# VAPID keys should be:
# 1. Generated uniquely for your project
# 2. Stored securely in environment variables
# 3. Never committed to version control
# 4. Rotated periodically (recommended: every 6 months)

# Verify VAPID key security:
echo $VITE_FIREBASE_VAPID_KEY | wc -c
# Should output: 88 (87 characters + newline)
```

#### API Key Restrictions
```bash
# In Google Cloud Console → APIs & Services → Credentials
# For your Firebase API key:
# 1. Set application restrictions to your domain
# 2. Set API restrictions to required Firebase services only
# 3. Monitor usage regularly
```

## 🧪 Testing & Validation

### 1. Deployment Verification

#### Test Web Application
```bash
# 1. Visit your deployed URL: https://your-domain.pages.dev
# 2. Verify PWA installation prompt appears
# 3. Test user registration and login
# 4. Create a test reminder
# 5. Verify notification settings page works
```

#### Test Notification System
```bash
# 1. Grant notification permissions
# 2. Test local notifications:
#    - Go to Profile → Notification Settings
#    - Click "Test Local Notification"
#    - Verify notification appears

# 3. Test FCM notifications:
#    - Click "Test FCM Notification"
#    - Verify notification appears
#    - Check browser console for errors

# 4. Test reminder notifications:
#    - Create a reminder for 1 minute from now
#    - Wait for notification to appear
#    - Verify notification actions work
```

### 2. Function Testing

#### Test Firebase Functions
```bash
# Test FCM token update
curl -X POST https://us-central1-your-project.cloudfunctions.net/updateFCMToken \
  -H "Authorization: Bearer $(firebase auth:print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token-123"}'

# Expected response: {"success": true}
```

#### Monitor Function Logs
```bash
# Real-time function monitoring
firebase functions:log --only scheduleReminderCheck

# Check for errors
firebase functions:log --only scheduleReminderCheck | grep ERROR
```

### 3. Performance Testing

#### Web Performance
```bash
# Use Lighthouse to test PWA performance
# Target scores:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - SEO: >90
# - PWA: 100

# Command line testing:
npx lighthouse https://your-domain.pages.dev --chrome-flags="--headless"
```

#### Notification Performance
```bash
# Test notification delivery times
# 1. Create reminder for immediate delivery
# 2. Measure time from creation to notification
# 3. Target: <30 seconds end-to-end delivery
```

## 📊 Production Monitoring

### 1. Firebase Monitoring

#### Set Up Alerts
```bash
# Firebase Console → Project Settings → Integrations
# Enable Google Cloud Monitoring
# Set up alerts for:
# - Function errors (>5 per hour)
# - Function timeout (>10% of executions)
# - Firestore quota usage (>80%)
# - Authentication failures (>10 per hour)
```

#### Monitor Key Metrics
```bash
# Daily monitoring checklist:
# ✅ Function execution success rate >95%
# ✅ Average notification delivery time <30s
# ✅ Firestore read/write quotas <80%
# ✅ No critical errors in function logs
# ✅ FCM delivery success rate >90%
```

### 2. Cloudflare Monitoring

#### Analytics Setup
```bash
# Cloudflare Dashboard → Analytics & Logs
# Monitor:
# - Page views and unique visitors
# - Response times and error rates
# - Security events and bot traffic
# - Origin server health
```

#### Performance Monitoring
```bash
# Set up alerts for:
# - Response time >2 seconds
# - Error rate >1%
# - Origin server downtime
# - SSL certificate expiration
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] VAPID keys generated and secured
- [ ] Security rules tested and deployed
- [ ] Functions built and tested locally
- [ ] Web app built and tested locally

### Deployment Steps
- [ ] Deploy Firestore security rules
- [ ] Deploy Firebase Functions
- [ ] Verify function deployment and logs
- [ ] Deploy web app to Cloudflare Pages
- [ ] Configure custom domain (if applicable)
- [ ] Test end-to-end notification flow

### Post-Deployment
- [ ] Verify all endpoints accessible
- [ ] Test notification permissions flow
- [ ] Test reminder creation and delivery
- [ ] Monitor function logs for errors
- [ ] Set up monitoring and alerts
- [ ] Document any deployment-specific configurations

## 🔧 Troubleshooting

### Common Issues

#### "Service Worker registration failed"
```bash
# Solution:
# 1. Verify HTTPS is enabled
# 2. Check service worker file exists at /sw.js
# 3. Verify Cloudflare is not blocking /sw.js
# 4. Check browser console for specific errors
```

#### "FCM token generation failed"
```bash
# Solution:
# 1. Verify VAPID key is correctly set
# 2. Check if FCM API is enabled in Google Cloud Console
# 3. Verify service worker is registered
# 4. Check browser supports FCM (not incognito mode)
```

#### "Notifications not received"
```bash
# Debugging steps:
# 1. Check Firebase Functions logs
# 2. Verify user has FCM token in Firestore
# 3. Test with manual function call
# 4. Check if user has notifications enabled
# 5. Verify time zone configuration
```

#### "Function deployment fails"
```bash
# Solution:
# 1. Check Node.js version compatibility
# 2. Verify billing is enabled on Firebase project
# 3. Check function timeout limits
# 4. Review function logs for specific errors
```

### Support Resources

#### Documentation Links
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [PWA Service Worker Guide](https://web.dev/service-workers/)

#### Emergency Contacts
- **Firebase Support**: Firebase Console → Support
- **Cloudflare Support**: Cloudflare Dashboard → Support
- **Development Team**: [Your contact information]

---

## 📝 Deployment Summary

### What You've Deployed
✅ **Firebase Functions** with scheduled reminder processing  
✅ **FCM Token Management** with secure token handling  
✅ **Firestore Security Rules** with proper access control  
✅ **PWA Web Application** with offline capabilities  
✅ **Notification System** with Vietnamese localization  
✅ **Monitoring & Alerts** for production stability  

### Next Steps
1. **User Training**: Share user guide with your team
2. **Monitoring Setup**: Regular check of metrics and logs  
3. **Backup Strategy**: Implement regular Firestore backups
4. **Performance Optimization**: Monitor and optimize based on usage
5. **Feature Expansion**: Plan Phase 4 advanced features

Your ILoveYou mobile notifications system is now live and ready for production use! 🎉

---

*Deployment Guide Version: 1.0*  
*Last Updated: June 9, 2025*  
*Compatible with: Firebase v11.9.0, Node.js 18+, Cloudflare Pages*