# 📋 Deployment Checklist cho Cloudflare Pages

## ✅ Required Environment Variables

### 🔥 Firebase Configuration (Bắt buộc)
- [ ] `VITE_FIREBASE_API_KEY=AIzaSyBzQwGg_Hh9dDVNbkVZR3da0pmKjInpHE0`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN=loveapp-30-5.firebaseapp.com`
- [ ] `VITE_FIREBASE_PROJECT_ID=loveapp-30-5`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET=loveapp-30-5.firebasestorage.app`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID=983282809749`
- [ ] `VITE_FIREBASE_APP_ID=1:983282809749:android:b03d92d5f2c8fb4c50149c`

### 📱 App Configuration (Bắt buộc)
- [ ] `VITE_APP_ENV=production`
- [ ] `VITE_APP_VERSION=1.0.0`

### 🔔 Push Notifications (Bắt buộc)
- [ ] `VITE_VAPID_PUBLIC_KEY=BK7ULrATQ3qHjRl1tLgcwD5zrytEqDnt63_tJiCzyQy3lp6BFna-EUlI8Y47A3978oVPd9xQSfRvAFKhyUAViqM`
- [ ] `VITE_FIREBASE_VAPID_KEY=BK7ULrATQ3qHjRl1tLgcwD5zrytEqDnt63_tJiCzyQy3lp6BFna-EUlI8Y47A3978oVPd9xQSfRvAFKhyUAViqM`

### ⚙️ Optional Configuration
- [ ] `VITE_FIREBASE_FUNCTIONS_REGION=asia-southeast1` (Singapore - tốt hơn cho khu vực SEA)
- [ ] `VITE_ANALYTICS_ENDPOINT=` (để trống nếu không dùng custom analytics)

## 🌐 Cloudflare Configuration

### Account Setup
- [ ] Account ID: `c93c9befa696020e7a06670ff164a30a` (đã có trong wrangler.toml)
- [ ] Wrangler CLI được cài đặt: `npm install -g wrangler`

### Build Settings (Dashboard deployment)
- [ ] **Framework preset**: Vite
- [ ] **Build command**: `cd web && npm run build`
- [ ] **Build output directory**: `web/dist`
- [ ] **Root directory**: `/` (để trống)

## 🔧 GitHub Actions Secrets (Nếu dùng CI/CD)

### Required Secrets
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_VAPID_PUBLIC_KEY`
- [ ] `VITE_FIREBASE_VAPID_KEY`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`

## 🧪 Pre-deployment Tests

### Local Testing
- [ ] `cd web && npm run test:build` - Test build locally
- [ ] `cd web && npm run preview` - Test preview server
- [ ] Kiểm tra `/test-push-notifications.html` hoạt động

### Firebase Setup
- [ ] Firebase Authentication domain includes Cloudflare domain
- [ ] Firestore rules cho phép web domain
- [ ] Firebase Functions deploy (nếu có)

## 🚀 Deployment Methods

### Method 1: Cloudflare Dashboard (Khuyến nghị)
- [ ] Repository được connect
- [ ] Environment variables đã set
- [ ] Build settings configured
- [ ] Auto-deploy enabled

### Method 2: Wrangler CLI
- [ ] `wrangler login` thành công
- [ ] `cd web && npm run deploy:cloudflare`

### Method 3: GitHub Actions
- [ ] All secrets configured
- [ ] Workflow file active
- [ ] Auto-deploy on push

## ✨ Post-deployment Verification

### Functionality Check
- [ ] App loads successfully
- [ ] Firebase authentication works
- [ ] Firestore data loads
- [ ] Push notifications work
- [ ] PWA install works
- [ ] Service Worker active

### Performance Check
- [ ] Lighthouse score > 90
- [ ] Web Vitals trong green zone
- [ ] Assets loading fast

### Security Check
- [ ] HTTPS enabled
- [ ] Environment variables not exposed
- [ ] Firebase rules secure

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor Cloudflare Analytics
- [ ] Check error logs
- [ ] Update dependencies
- [ ] Backup Firestore data

### Monitoring URLs
- [ ] Main app: `https://iloveyou-web.pages.dev`
- [ ] Test notifications: `https://iloveyou-web.pages.dev/test-push-notifications.html`
- [ ] Cloudflare Dashboard: https://dash.cloudflare.com
- [ ] GitHub Actions: Repository > Actions tab

---

## 📞 Support

Nếu gặp lỗi:
1. Check Cloudflare Pages build logs
2. Check browser console errors
3. Verify environment variables
4. Test push notifications
5. Check Firebase console

**Ready to deploy? Run:** `cd web && npm run deploy:cloudflare` 