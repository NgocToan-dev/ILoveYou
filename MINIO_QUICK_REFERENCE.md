# MinIO Integration Quick Reference Guide
*Essential commands, configurations, and troubleshooting for MinIO implementation*

## 🚀 QUICK START COMMANDS

### Immediate Setup (< 5 minutes)
```bash
# 1. Backup current state
git branch backup-pre-minio && git push origin backup-pre-minio

# 2. Create development branch
git checkout -b feature/minio-integration

# 3. Start MinIO locally (Docker required)
docker-compose -f docker-compose.minio.yml up -d

# 4. Verify MinIO is running
curl http://localhost:9000/minio/health/live

# 5. Access MinIO Console
open http://localhost:9090
# Login: minioadmin / minioadmin123
```

### Daily Development Commands
```bash
# Start development environment
cd web && npm run dev

# Start MinIO (if not running)
docker-compose -f docker-compose.minio.yml up -d

# Check MinIO status
docker-compose -f docker-compose.minio.yml ps

# View MinIO logs
docker-compose -f docker-compose.minio.yml logs -f minio

# Stop MinIO
docker-compose -f docker-compose.minio.yml down
```

---

## 📁 FILE STRUCTURE REFERENCE

### New Files to Create (Phase 1)
```
shared/services/firebase/
├── storage.js                     # Firebase storage service
└── config.js                      # (existing, may need updates)

shared/services/storage/
├── interfaces/
│   └── IStorageProvider.js        # Storage interface definition
├── providers/
│   ├── FirebaseStorageProvider.js # Firebase adapter
│   └── MinIOStorageProvider.js    # MinIO adapter (Phase 3)
├── config/
│   └── StorageConfig.js           # Configuration management
├── monitoring/
│   └── StorageMonitor.js          # Performance monitoring
└── StorageManager.js              # Main storage manager

web/src/hooks/
└── useMediaUpload.js              # Enhanced upload hook

scripts/
├── migrate-firebase-to-minio.js   # Migration tool (Phase 4)
├── setup-minio-production.sh      # Production setup script
└── docker-compose.minio.yml       # Local development setup
```

### Modified Files
```
web/src/hooks/usePhotoUpload.js     # May be replaced by useMediaUpload.js
web/src/components/notes/PhotoUpload.jsx  # Enhanced for video support
web/package.json                    # New dependencies
web/.env.local                      # MinIO configuration
```

---

## ⚙️ CONFIGURATION REFERENCE

### Environment Variables (.env.local)
```bash
# Firebase Configuration (existing)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# MinIO Configuration (new)
VITE_MINIO_ENDPOINT=localhost
VITE_MINIO_PORT=9000
VITE_MINIO_USE_SSL=false
VITE_MINIO_ACCESS_KEY=minioadmin
VITE_MINIO_SECRET_KEY=minioadmin123
VITE_MINIO_BUCKET=iloveyou-media-dev

# Storage Provider Selection
VITE_STORAGE_PROVIDER=firebase      # Options: firebase, minio, hybrid
VITE_STORAGE_FALLBACK=firebase      # Fallback provider
VITE_ENABLE_STORAGE_MONITOR=true    # Enable performance monitoring
```

### Production Environment Variables
```bash
# Production MinIO Configuration
VITE_MINIO_ENDPOINT=your-domain.com
VITE_MINIO_PORT=443
VITE_MINIO_USE_SSL=true
VITE_MINIO_ACCESS_KEY=your-production-access-key
VITE_MINIO_SECRET_KEY=your-production-secret-key
VITE_MINIO_BUCKET=iloveyou-media-prod

# CDN Configuration (optional)
VITE_CDN_BASE_URL=https://cdn.your-domain.com
VITE_CDN_ENABLED=true
```

---

## 📦 DEPENDENCIES REFERENCE

### Phase 1 Dependencies
```json
{
  "dependencies": {
    "sharp": "^0.32.6",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.7"
  }
}
```

### Phase 3 Dependencies (MinIO)
```json
{
  "dependencies": {
    "minio": "^7.1.3",
    "sharp": "^0.32.6",
    "uuid": "^9.0.1"
  }
}
```

### Installation Commands
```bash
# Phase 1
cd web && npm install sharp uuid

# Phase 3
cd web && npm install minio

# All at once
cd web && npm install minio sharp uuid
```

---

## 🔧 TROUBLESHOOTING GUIDE

### Common Issues & Quick Fixes

#### MinIO Docker Issues
```bash
# Container won't start
docker-compose -f docker-compose.minio.yml down
docker system prune -f
docker-compose -f docker-compose.minio.yml up -d

# Port already in use
sudo lsof -i :9000
sudo lsof -i :9090
# Kill processes using ports 9000/9090, then restart

# Permission issues
sudo chown -R $USER:$USER ./minio-data
```

#### Firebase Connection Issues
```bash
# Check Firebase configuration
npm run dev
# Open browser console, look for Firebase errors

# Verify service account
firebase projects:list
firebase use your-project-id

# Check storage rules
firebase storage:rules:get
```

#### Upload Failures
```javascript
// Debug upload issues
console.log('Storage provider:', process.env.VITE_STORAGE_PROVIDER);
console.log('Fallback provider:', process.env.VITE_STORAGE_FALLBACK);

// Check file size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

#### CORS Issues with MinIO
```bash
# Check MinIO CORS settings
docker exec -it iloveyou-minio-dev mc alias set local http://localhost:9000 minioadmin minioadmin123
docker exec -it iloveyou-minio-dev mc cors set local/iloveyou-media-dev --allow-origin "*" --allow-methods "GET,PUT,POST,DELETE"
```

### Performance Issues
```javascript
// Monitor upload performance
const startTime = Date.now();
await uploadFile(file);
const duration = Date.now() - startTime;
console.log(`Upload took ${duration}ms for ${file.size} bytes`);

// Check memory usage
console.log('Memory usage:', performance.memory?.usedJSHeapSize);
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=minio*
npm run dev

# Enable verbose Firebase logging
localStorage.setItem('debug', 'firebase:*');
```

---

## 📊 MONITORING & METRICS

### Key Metrics to Track
```javascript
// Performance Metrics
- Upload success rate (target: >99%)
- Average upload time (target: <5s for 5MB)
- Error rate (target: <1%)
- Fallback activation rate (target: <5%)
- Storage cost per month (target: <$10)

// User Experience Metrics
- File preview load time (target: <2s)
- UI responsiveness during upload
- Error message clarity
- Mobile device compatibility

// Technical Metrics
- MinIO server uptime (target: >99.9%)
- Disk usage growth rate
- Network bandwidth usage
- Memory consumption
```

### Monitoring Commands
```bash
# Check MinIO server health
curl http://localhost:9000/minio/health/live

# Monitor disk usage
df -h ./minio-data

# Check upload logs
docker-compose -f docker-compose.minio.yml logs minio | grep "PUT\|POST"

# Monitor memory usage
docker stats iloveyou-minio-dev

# Check network usage
docker exec iloveyou-minio-dev netstat -i
```

---

## 🎯 TESTING CHECKLIST

### Quick Smoke Test (5 minutes)
```bash
# 1. Start environment
npm run dev
docker-compose -f docker-compose.minio.yml up -d

# 2. Test image upload
# Navigate to http://localhost:3000
# Go to notes page
# Upload an image file
# Verify image appears

# 3. Test video upload (if Phase 1 complete)
# Upload a small video file
# Verify video preview

# 4. Check storage
# MinIO Console: http://localhost:9090
# Firebase Console: https://console.firebase.google.com
```

### Comprehensive Test Suite
```bash
# Run all tests
npm run test

# Test specific components
npm run test -- --testNamePattern="PhotoUpload"
npm run test -- --testNamePattern="MediaUpload"

# Test storage providers
npm run test -- --testNamePattern="StorageProvider"

# Integration tests
npm run test:e2e
```

---

## 🔄 ROLLBACK PROCEDURES

### Emergency Rollback (< 5 minutes)
```bash
# If everything breaks, quick rollback
git checkout main
git pull origin main
cd web && npm install && npm run dev

# Or to specific backup
git checkout backup-pre-minio
cd web && npm install && npm run dev
```

### Selective Rollback
```bash
# Rollback to specific day
git checkout backup-day-N-YYYYMMDD

# Rollback specific files
git checkout HEAD~1 -- web/src/hooks/usePhotoUpload.js
git checkout HEAD~1 -- web/src/components/notes/PhotoUpload.jsx

# Rollback dependencies
cd web
npm uninstall minio sharp uuid
npm install
```

### Provider Switching (Runtime)
```javascript
// Switch to Firebase only (emergency)
localStorage.setItem('storage_provider_override', 'firebase');
window.location.reload();

// Switch to MinIO
localStorage.setItem('storage_provider_override', 'minio');
window.location.reload();

// Clear override
localStorage.removeItem('storage_provider_override');
window.location.reload();
```

---

## 🔐 SECURITY CHECKLIST

### MinIO Security
- [ ] **Change default credentials**: Never use minioadmin in production
- [ ] **Enable SSL**: Always use SSL in production
- [ ] **Bucket policies**: Restrict access appropriately
- [ ] **Network security**: Use firewall rules
- [ ] **Regular updates**: Keep MinIO updated

### Firebase Security
- [ ] **Storage rules**: Review Firebase Storage rules
- [ ] **Authentication**: Verify user authentication
- [ ] **CORS settings**: Configure CORS properly
- [ ] **API keys**: Secure API key management

### Application Security
- [ ] **File validation**: Validate file types and sizes
- [ ] **Input sanitization**: Sanitize file names and paths
- [ ] **Error handling**: Don't expose sensitive information
- [ ] **Rate limiting**: Implement upload rate limiting

---

## 📚 HELPFUL RESOURCES

### Documentation Links
- [MinIO JavaScript SDK](https://docs.min.io/docs/javascript-client-quickstart-guide.html)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [React Dropzone](https://react-dropzone.js.org/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)

### Community Resources
- [MinIO Community](https://github.com/minio/minio/discussions)
- [Firebase Community](https://firebase.google.com/support)
- [Stack Overflow Tags](https://stackoverflow.com/questions/tagged/minio+javascript)

### Monitoring Tools
- [MinIO Console](http://localhost:9090) (Development)
- [Firebase Console](https://console.firebase.google.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Container monitoring)

---

## 💡 OPTIMIZATION TIPS

### Performance Tips
```javascript
// Compress images before upload
const compressedFile = await compressImage(file, { quality: 0.8 });

// Use WebP format when supported
const supportsWebP = document.createElement('canvas')
  .toDataURL('image/webp').indexOf('data:image/webp') === 0;

// Implement progressive loading
const loadImageProgressively = (url) => {
  // Load low-quality placeholder first
  // Then load full-quality image
};

// Use request deduplication
const uploadCache = new Map();
const dedupedUpload = (file) => {
  const key = `${file.name}-${file.size}-${file.lastModified}`;
  if (uploadCache.has(key)) {
    return uploadCache.get(key);
  }
  const promise = uploadFile(file);
  uploadCache.set(key, promise);
  return promise;
};
```

### Cost Optimization Tips
```javascript
// Implement smart storage routing
const getOptimalProvider = (file) => {
  // Large files (>5MB) → MinIO
  if (file.size > 5 * 1024 * 1024) return 'minio';
  
  // Critical files → Firebase (for reliability)
  if (file.type.includes('profile') || file.type.includes('avatar')) {
    return 'firebase';
  }
  
  // Default → MinIO (for cost)
  return 'minio';
};

// Implement file cleanup
const cleanupOldFiles = async () => {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
  // Delete files older than cutoff
};
```

---

*Quick Reference Guide for MinIO Integration*  
*Keep this document handy during implementation*  
*Last updated: 2025-01-11*