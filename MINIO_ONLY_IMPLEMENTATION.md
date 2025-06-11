# MinIO-Only Storage Implementation

## Overview

The storage system has been updated to use **MinIO exclusively**, removing Firebase Storage dependency. This provides a more focused, self-hosted storage solution.

## Changes Made

### 1. Storage Architecture Updates

#### StorageAdapter.js
- Removed Firebase provider initialization
- Set MinIO as the only provider
- Disabled fallback mechanisms (not needed with single provider)
- Simplified provider management logic

#### MinIOStorageProvider.js
- **Complete implementation** replacing skeleton
- Added MinIO JavaScript SDK integration
- Implemented all storage operations:
  - File upload with progress tracking
  - File download with blob conversion
  - File deletion
  - File URL generation (presigned URLs)
  - File listing and metadata
  - Health checks and bucket management

#### StorageConfig.js
- Updated for MinIO-only configuration
- Removed Firebase-specific logic
- Simplified health checks and recommendations
- Disabled auto-switching (single provider)

### 2. Configuration Updates

#### Environment Variables (.env.example)
```bash
# Storage Provider Configuration (MinIO Only)
VITE_STORAGE_PROVIDER=minio
VITE_STORAGE_FALLBACK=false
VITE_PREFERRED_STORAGE_PROVIDER=minio
VITE_STORAGE_AUTO_FAILOVER=false
VITE_STORAGE_HEALTH_CHECK_INTERVAL=60000

# MinIO Configuration
VITE_MINIO_ENDPOINT=localhost
VITE_MINIO_PORT=8080
VITE_MINIO_USE_SSL=false
VITE_MINIO_ACCESS_KEY=minioadmin
VITE_MINIO_SECRET_KEY=minioadmin123
VITE_MINIO_BUCKET_NAME=loveapp-storage
VITE_MINIO_REGION=us-east-1
```

### 3. Dependencies

#### Added MinIO SDK
```bash
npm install minio
```

### 4. Removed Files
- `shared/services/storage/providers/FirebaseStorageProvider.js`

## MinIO Features Implemented

### Core Operations
- ✅ **File Upload**: Resumable uploads with progress tracking
- ✅ **File Download**: Stream to blob conversion
- ✅ **File Deletion**: Direct object removal
- ✅ **File URL**: Presigned URL generation (24h validity)
- ✅ **File Listing**: Directory listing with metadata
- ✅ **Health Checks**: Bucket connectivity verification

### Advanced Features
- ✅ **Bucket Management**: Auto-creation and policy setup
- ✅ **Metadata Support**: Custom metadata preservation
- ✅ **Error Handling**: Comprehensive error mapping
- ✅ **Dynamic Import**: Browser-compatible MinIO loading
- ✅ **Public URLs**: Direct public access URLs
- ✅ **Storage Statistics**: Usage and object count tracking

## Usage Examples

### Basic Upload
```javascript
import { storageAdapter } from 'shared/services/storage';

const result = await storageAdapter.uploadFile(
  file, 
  'uploads/image.jpg',
  { userId: '123', category: 'profile' },
  (progress) => console.log(`${progress}%`)
);

console.log('Uploaded to:', result.url);
console.log('Provider used:', result.provider); // 'minio'
```

### File Management
```javascript
// Get file URL
const { url } = await storageAdapter.getFileUrl('uploads/image.jpg');

// List files
const { files } = await storageAdapter.listFiles('uploads/');

// Delete file
await storageAdapter.deleteFile('uploads/image.jpg');
```

### React Hook Usage
```javascript
import { useStorageAdapter } from 'hooks/useStorageAdapter';

const { 
  uploadFile, 
  storageStatus, 
  isHealthy, 
  getPrimaryProvider 
} = useStorageAdapter();

// Provider will always be 'minio'
console.log('Provider:', getPrimaryProvider()); // 'minio'
```

## MinIO Setup Requirements

### 1. MinIO Server Installation
```bash
# Download and run MinIO server
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server /data --console-address ":9090"
```

### 2. Access Configuration
- **Server**: http://localhost:9000
- **Console**: http://localhost:9090
- **Default Credentials**: minioadmin/minioadmin123

### 3. Bucket Setup
The application automatically:
- Creates bucket if it doesn't exist
- Sets public read policy
- Configures proper permissions

## Testing

### Storage Test Panel
Access the comprehensive test interface at: `/storage-test`

**Features:**
- Upload testing with progress
- File listing and management
- Health monitoring
- Configuration management
- Real-time status display

### Automated Tests
```javascript
import { runStorageTests } from 'test/storage-abstraction-test';

const results = await runStorageTests();
console.log(`${results.passed}/${results.total} tests passed`);
```

## Migration from Firebase

### Backward Compatibility
- ✅ All existing media upload code works unchanged
- ✅ `useMediaUpload` hook maintains same API
- ✅ File upload results include provider information
- ✅ Error handling remains consistent

### Data Migration
If migrating from Firebase Storage:

1. **Export existing files** from Firebase Storage
2. **Upload to MinIO** using the same path structure
3. **Update database URLs** to point to MinIO endpoints
4. **Test functionality** with existing data

## Benefits of MinIO-Only Setup

### 1. Self-Hosted Control
- Complete data ownership
- No external service dependencies
- Customizable storage policies
- Direct server access

### 2. Cost Efficiency
- No per-GB charges
- No API call limits
- Predictable hosting costs
- Scalable storage capacity

### 3. Performance
- Direct server communication
- Configurable performance settings
- Local network speeds
- No external API throttling

### 4. Security
- Private network deployment
- Custom security policies
- Direct access control
- No third-party data exposure

## Monitoring and Maintenance

### Health Monitoring
```javascript
// Check MinIO status
const status = await storageAdapter.getProvidersStatus();
console.log('MinIO healthy:', status.primary.healthy);

// Get storage statistics
const stats = await minioProvider.getStorageStats();
console.log('Total objects:', stats.objectCount);
console.log('Total size:', stats.totalSize);
```

### Configuration Management
```javascript
import { storageConfigManager } from 'shared/services/storage';

// Get current configuration
const config = storageConfigManager.getConfiguration();

// Update health check interval
await storageConfigManager.updateConfiguration({
  healthCheckInterval: 30000 // 30 seconds
});
```

## Error Handling

### Common Issues and Solutions

#### 1. Connection Errors
```javascript
// Error: Cannot connect to MinIO server
// Solution: Check MinIO server is running and accessible
```

#### 2. Authentication Errors
```javascript
// Error: Invalid MinIO access credentials
// Solution: Verify VITE_MINIO_ACCESS_KEY and VITE_MINIO_SECRET_KEY
```

#### 3. Bucket Errors
```javascript
// Error: Bucket not found
// Solution: Application auto-creates buckets, check permissions
```

## Production Deployment

### 1. Environment Configuration
```bash
# Production MinIO setup
VITE_MINIO_ENDPOINT=your-minio-server.com
VITE_MINIO_PORT=443
VITE_MINIO_USE_SSL=true
VITE_MINIO_ACCESS_KEY=your-access-key
VITE_MINIO_SECRET_KEY=your-secret-key
VITE_MINIO_BUCKET_NAME=production-storage
```

### 2. Security Considerations
- Use HTTPS in production (`VITE_MINIO_USE_SSL=true`)
- Strong access keys (not default credentials)
- Proper bucket policies
- Network security configuration

### 3. Backup Strategy
- Regular bucket backups
- Cross-region replication
- Data retention policies
- Disaster recovery planning

## Development Workflow

### 1. Local Development
```bash
# Start MinIO server locally
docker run -p 9000:9000 -p 9090:9090 \
  -e "MINIO_ACCESS_KEY=minioadmin" \
  -e "MINIO_SECRET_KEY=minioadmin123" \
  minio/minio server /data --console-address ":9090"
```

### 2. Testing
```bash
# Run application with MinIO
npm run dev

# Access storage test panel
http://localhost:3000/storage-test
```

### 3. Debugging
- Check browser console for MinIO connection logs
- Use MinIO console for bucket inspection
- Monitor health check results
- Review error logs and recommendations

## Conclusion

The MinIO-only implementation provides:

✅ **Complete Storage Solution**: Full-featured file storage
✅ **Self-Hosted Control**: No external dependencies  
✅ **Cost Efficiency**: Predictable hosting costs
✅ **High Performance**: Direct server communication
✅ **Enhanced Security**: Private deployment options
✅ **Easy Maintenance**: Simplified architecture
✅ **Backward Compatibility**: Existing code unchanged
✅ **Comprehensive Testing**: Full test coverage

The system is production-ready and provides all necessary storage functionality through MinIO's robust S3-compatible API.