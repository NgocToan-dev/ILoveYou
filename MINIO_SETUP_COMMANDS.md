# MinIO Development Setup Commands
*Complete setup script and commands for MinIO development environment*

## 🚀 AUTOMATED SETUP SCRIPT

### Create Setup Script
Create a file called `setup-minio-development.sh` in your project root with the following content:

```bash
#!/bin/bash

echo "🚀 Starting MinIO Development Environment Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

print_success "Docker is available"

# Create backup branch
print_status "Creating backup branch..."
git branch backup-pre-minio-$(date +%Y%m%d) 2>/dev/null || true
git push origin backup-pre-minio-$(date +%Y%m%d) 2>/dev/null || true

# Create development branch
print_status "Creating development branch..."
git checkout -b feature/minio-integration 2>/dev/null || git checkout feature/minio-integration

# Create MinIO data directory
print_status "Creating MinIO data directory..."
mkdir -p ./minio-data
chmod 755 ./minio-data

# Create Docker Compose file for MinIO
print_status "Creating Docker Compose configuration..."
cat > docker-compose.minio.yml << 'EOF'
version: '3.8'
services:
  minio:
    image: minio/minio:latest
    container_name: iloveyou-minio-dev
    ports:
      - "9000:9000"
      - "9090:9090"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
      - MINIO_BROWSER_REDIRECT_URL=http://localhost:9090
    command: server /data --console-address ":9090"
    volumes:
      - ./minio-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - minio-network

  # Optional: MinIO Client (mc) for administration
  minio-client:
    image: minio/mc:latest
    container_name: iloveyou-minio-client
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 10;
      /usr/bin/mc alias set local http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb local/iloveyou-media-dev --ignore-existing;
      /usr/bin/mc anonymous set public local/iloveyou-media-dev/public;
      echo 'MinIO setup completed';
      tail -f /dev/null
      "
    networks:
      - minio-network

networks:
  minio-network:
    driver: bridge
EOF

print_success "Docker Compose configuration created"

# Create .env.local file if it doesn't exist
if [ ! -f "web/.env.local" ]; then
    print_status "Creating environment configuration..."
    cat > web/.env.local << 'EOF'
# Firebase Configuration (update with your values)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# MinIO Configuration (Development)
VITE_MINIO_ENDPOINT=localhost
VITE_MINIO_PORT=9000
VITE_MINIO_USE_SSL=false
VITE_MINIO_ACCESS_KEY=minioadmin
VITE_MINIO_SECRET_KEY=minioadmin123
VITE_MINIO_BUCKET=iloveyou-media-dev
VITE_MINIO_BASE_URL=http://localhost:9000

# Storage Provider Selection
VITE_STORAGE_PROVIDER=firebase
VITE_STORAGE_FALLBACK=firebase
VITE_ENABLE_STORAGE_MONITOR=true
VITE_DEBUG_STORAGE=true
EOF
    print_success "Environment configuration created"
else
    print_warning ".env.local already exists, skipping environment setup"
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
cd web
npm install sharp uuid
npm install --save-dev @types/uuid
cd ..

print_success "Dependencies installed"

# Start MinIO
print_status "Starting MinIO server..."
docker-compose -f docker-compose.minio.yml up -d

# Wait for MinIO to be ready
print_status "Waiting for MinIO to be ready..."
timeout=60
counter=0
while ! curl -f http://localhost:9000/minio/health/live &>/dev/null; do
    if [ $counter -ge $timeout ]; then
        print_error "MinIO did not start within $timeout seconds"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""

print_success "MinIO is running!"

# Check if MinIO is accessible
print_status "Verifying MinIO accessibility..."
if curl -f http://localhost:9000/minio/health/live &>/dev/null; then
    print_success "MinIO server is accessible at http://localhost:9000"
    print_success "MinIO Console is accessible at http://localhost:9090"
    print_success "Default credentials: minioadmin / minioadmin123"
else
    print_error "MinIO server is not accessible"
    exit 1
fi

# Create useful scripts
print_status "Creating utility scripts..."

# MinIO management script
cat > minio-dev.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "Starting MinIO..."
        docker-compose -f docker-compose.minio.yml up -d
        ;;
    stop)
        echo "Stopping MinIO..."
        docker-compose -f docker-compose.minio.yml down
        ;;
    restart)
        echo "Restarting MinIO..."
        docker-compose -f docker-compose.minio.yml restart
        ;;
    logs)
        echo "Showing MinIO logs..."
        docker-compose -f docker-compose.minio.yml logs -f minio
        ;;
    status)
        echo "MinIO status..."
        docker-compose -f docker-compose.minio.yml ps
        ;;
    clean)
        echo "Cleaning MinIO data..."
        docker-compose -f docker-compose.minio.yml down
        sudo rm -rf ./minio-data/*
        docker-compose -f docker-compose.minio.yml up -d
        ;;
    console)
        echo "Opening MinIO console..."
        open http://localhost:9090 || xdg-open http://localhost:9090
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|clean|console}"
        exit 1
        ;;
esac
EOF

chmod +x minio-dev.sh

print_success "Utility scripts created"

# Create .gitignore entries
print_status "Updating .gitignore..."
if [ -f ".gitignore" ]; then
    echo "" >> .gitignore
    echo "# MinIO Development" >> .gitignore
    echo "minio-data/" >> .gitignore
    echo "docker-compose.minio.yml.backup" >> .gitignore
    echo "*.minio.log" >> .gitignore
else
    print_warning ".gitignore not found, creating one..."
    cat > .gitignore << 'EOF'
# MinIO Development
minio-data/
docker-compose.minio.yml.backup
*.minio.log

# Environment files
.env.local
.env.production.local
EOF
fi

print_success ".gitignore updated"

# Final verification
print_status "Running final verification..."

# Check if web dev server can start
cd web
if npm run build &>/dev/null; then
    print_success "Web build successful"
else
    print_warning "Web build failed - check dependencies"
fi
cd ..

# Check MinIO bucket creation
sleep 5
if docker exec iloveyou-minio-client mc ls local/iloveyou-media-dev &>/dev/null; then
    print_success "MinIO bucket 'iloveyou-media-dev' created successfully"
else
    print_warning "MinIO bucket creation may have failed"
fi

echo ""
echo "🎉 MinIO Development Environment Setup Complete!"
echo ""
print_success "Next steps:"
echo "1. Update web/.env.local with your Firebase configuration"
echo "2. Start development server: cd web && npm run dev"
echo "3. Access MinIO Console: http://localhost:9090"
echo "4. Begin Phase 1 implementation following MINIO_IMPLEMENTATION_CHECKLIST.md"
echo ""
print_status "Useful commands:"
echo "  ./minio-dev.sh start|stop|restart|logs|status"
echo "  docker-compose -f docker-compose.minio.yml logs -f minio"
echo "  curl http://localhost:9000/minio/health/live"
echo ""
print_warning "Remember to commit your changes: git add . && git commit -m 'Setup MinIO development environment'"
```

### Make Script Executable and Run
```bash
# Save the above content to setup-minio-development.sh
chmod +x setup-minio-development.sh
./setup-minio-development.sh
```

---

## 🔧 MANUAL SETUP COMMANDS

If you prefer to run commands manually instead of using the script:

### 1. Prerequisites Check
```bash
# Check Docker installation
docker --version
docker-compose --version

# Check Node.js and npm
node --version
npm --version

# Check Git
git --version
```

### 2. Project Backup
```bash
# Create backup branch
git branch backup-pre-minio-$(date +%Y%m%d)
git push origin backup-pre-minio-$(date +%Y%m%d)

# Create development branch
git checkout -b feature/minio-integration
```

### 3. Create MinIO Docker Configuration
```bash
# Create minio-data directory
mkdir -p ./minio-data

# Create docker-compose.minio.yml (copy content from script above)
```

### 4. Install Dependencies
```bash
cd web
npm install sharp uuid
npm install --save-dev @types/uuid
cd ..
```

### 5. Start MinIO
```bash
# Start MinIO container
docker-compose -f docker-compose.minio.yml up -d

# Verify MinIO is running
curl http://localhost:9000/minio/health/live

# Check container status
docker-compose -f docker-compose.minio.yml ps
```

### 6. Create Development Environment
```bash
# Create .env.local (copy content from script above)
# Update with your Firebase configuration
```

---

## 🧪 VERIFICATION COMMANDS

### Health Checks
```bash
# MinIO server health
curl -f http://localhost:9000/minio/health/live

# MinIO console accessibility
curl -f http://localhost:9090

# Container status
docker-compose -f docker-compose.minio.yml ps

# Container logs
docker-compose -f docker-compose.minio.yml logs minio
```

### Functional Tests
```bash
# Test bucket creation
docker exec iloveyou-minio-client mc ls local/

# Test file upload (manual)
echo "test content" > test.txt
docker exec -i iloveyou-minio-client mc cp /dev/stdin local/iloveyou-media-dev/test.txt < test.txt

# Test file download
docker exec iloveyou-minio-client mc cat local/iloveyou-media-dev/test.txt

# Cleanup test file
docker exec iloveyou-minio-client mc rm local/iloveyou-media-dev/test.txt
rm test.txt
```

### Web Application Test
```bash
# Start development server
cd web
npm run dev

# Open browser to http://localhost:3000
# Navigate to notes page
# Try uploading an image
```

---

## 🔄 MANAGEMENT COMMANDS

### Daily Operations
```bash
# Start MinIO
docker-compose -f docker-compose.minio.yml up -d

# Stop MinIO
docker-compose -f docker-compose.minio.yml down

# Restart MinIO
docker-compose -f docker-compose.minio.yml restart

# View logs
docker-compose -f docker-compose.minio.yml logs -f minio

# Check status
docker-compose -f docker-compose.minio.yml ps
```

### Maintenance Commands
```bash
# Clean MinIO data (DESTRUCTIVE)
docker-compose -f docker-compose.minio.yml down
rm -rf ./minio-data/*
docker-compose -f docker-compose.minio.yml up -d

# Update MinIO image
docker-compose -f docker-compose.minio.yml pull
docker-compose -f docker-compose.minio.yml up -d

# Check disk usage
du -sh ./minio-data

# Backup MinIO data
tar -czf minio-backup-$(date +%Y%m%d).tar.gz ./minio-data
```

### Troubleshooting Commands
```bash
# Check port usage
netstat -tulpn | grep :9000
netstat -tulpn | grep :9090

# Kill processes using MinIO ports
sudo lsof -ti:9000 | xargs kill -9
sudo lsof -ti:9090 | xargs kill -9

# Reset Docker network
docker network prune -f

# Complete Docker cleanup
docker system prune -af
docker volume prune -f
```

---

## 🎯 SUCCESS VERIFICATION

After running the setup, verify everything is working:

### ✅ MinIO Server
- [ ] MinIO server responds: `curl http://localhost:9000/minio/health/live`
- [ ] MinIO console accessible: Open http://localhost:9090
- [ ] Can login with minioadmin/minioadmin123
- [ ] Bucket 'iloveyou-media-dev' exists

### ✅ Development Environment
- [ ] Web app starts: `cd web && npm run dev`
- [ ] No console errors in browser
- [ ] Can navigate to notes page
- [ ] Environment variables loaded correctly

### ✅ File Structure
- [ ] `docker-compose.minio.yml` exists
- [ ] `minio-data/` directory created
- [ ] `web/.env.local` configured
- [ ] Dependencies installed (sharp, uuid)

### ✅ Git Setup
- [ ] Backup branch created
- [ ] Development branch active
- [ ] `.gitignore` updated

**When all items are ✅, you're ready to start Phase 1!**

---

## 📞 SUPPORT

### If Setup Fails
1. **Check Docker**: Ensure Docker Desktop is running
2. **Check Ports**: Ensure ports 9000/9090 are available
3. **Check Permissions**: Ensure user has Docker permissions
4. **Check Network**: Ensure no firewall blocking ports
5. **Check Logs**: Run `docker-compose -f docker-compose.minio.yml logs`

### Get Help
- Create GitHub issue with error logs
- Check Docker status: `docker info`
- Verify system requirements
- Review error messages in detail

---

*MinIO Development Setup Complete*  
*Ready for Phase 1 Implementation*