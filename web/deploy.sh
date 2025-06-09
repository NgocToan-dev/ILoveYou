#!/bin/bash

# ILoveYou Web App Deployment Script
# This script builds and deploys the web application to Firebase Hosting

set -e  # Exit on any error

echo "🚀 Starting ILoveYou Web App Deployment..."

# Color codes for output
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

# Check if we're in the web directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "This script must be run from the web directory"
    exit 1
fi

# Check for required files
if [ ! -f ".env.production" ]; then
    print_warning "No .env.production file found. Using .env or defaults."
fi

# Parse command line arguments
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BUILD=false
PREVIEW_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --preview)
            PREVIEW_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --env ENV         Set environment (production, staging, development)"
            echo "  --skip-tests      Skip running tests"
            echo "  --skip-build      Skip build step (use existing dist)"
            echo "  --preview         Deploy to preview channel only"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Deploying to environment: $ENVIRONMENT"

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check Firebase login status
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    print_status "Running tests..."
    npm run test:coverage
    
    # Check if tests passed
    if [ $? -ne 0 ]; then
        print_error "Tests failed. Deployment aborted."
        exit 1
    fi
    print_success "All tests passed!"
else
    print_warning "Skipping tests as requested"
fi

# Run linting
print_status "Running linting..."
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting issues found. Continuing with deployment..."
fi

# Build the application (unless skipped)
if [ "$SKIP_BUILD" = false ]; then
    print_status "Building application for $ENVIRONMENT..."
    
    # Set environment variables
    if [ "$ENVIRONMENT" = "production" ]; then
        export NODE_ENV=production
        export VITE_BUILD_ENV=production
    elif [ "$ENVIRONMENT" = "staging" ]; then
        export NODE_ENV=production
        export VITE_BUILD_ENV=staging
    else
        export NODE_ENV=development
        export VITE_BUILD_ENV=development
    fi
    
    npm run build
    
    if [ $? -ne 0 ]; then
        print_error "Build failed. Deployment aborted."
        exit 1
    fi
    print_success "Build completed successfully!"
else
    print_warning "Skipping build as requested"
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    print_error "Build directory 'dist' not found. Please run build first."
    exit 1
fi

# Bundle analysis (optional)
if command -v npx &> /dev/null; then
    print_status "Analyzing bundle size..."
    npm run build:analyze > bundle-analysis.log 2>&1 || true
fi

# Run Lighthouse audit (production only)
if [ "$ENVIRONMENT" = "production" ] && command -v lighthouse &> /dev/null; then
    print_status "Running Lighthouse audit..."
    npm run lighthouse > lighthouse-audit.log 2>&1 || true
    print_status "Lighthouse audit results saved to lighthouse-audit.log"
fi

# Firebase deployment
print_status "Deploying to Firebase..."

if [ "$PREVIEW_ONLY" = true ]; then
    # Deploy to preview channel
    CHANNEL_ID="preview-$(date +%s)"
    print_status "Deploying to preview channel: $CHANNEL_ID"
    
    firebase hosting:channel:deploy $CHANNEL_ID --expires 7d
    
    if [ $? -eq 0 ]; then
        print_success "Preview deployment successful!"
        print_status "Preview URL will be displayed above"
    else
        print_error "Preview deployment failed"
        exit 1
    fi
else
    # Deploy to live site
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Deploying to production..."
        firebase deploy --only hosting
    else
        print_status "Deploying to $ENVIRONMENT environment..."
        firebase deploy --only hosting --project $ENVIRONMENT
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Deployment successful!"
        
        # Get the hosting URL
        PROJECT_ID=$(firebase use --no-interactive)
        if [ "$ENVIRONMENT" = "production" ]; then
            HOSTING_URL="https://$PROJECT_ID.web.app"
        else
            HOSTING_URL="https://$ENVIRONMENT-$PROJECT_ID.web.app"
        fi
        
        print_success "Application is live at: $HOSTING_URL"
        
        # Open in browser (optional)
        if command -v open &> /dev/null; then
            read -p "Open application in browser? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open $HOSTING_URL
            fi
        fi
    else
        print_error "Deployment failed"
        exit 1
    fi
fi

# Cleanup
print_status "Cleaning up..."
rm -f bundle-analysis.log lighthouse-audit.log

# Post-deployment checks
print_status "Running post-deployment checks..."

# Check if site is accessible
if command -v curl &> /dev/null && [ "$PREVIEW_ONLY" = false ]; then
    print_status "Checking site accessibility..."
    if curl -f -s $HOSTING_URL > /dev/null; then
        print_success "Site is accessible"
    else
        print_warning "Site accessibility check failed"
    fi
fi

# Deployment summary
print_success "🎉 Deployment completed successfully!"
echo
echo "Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Build: $([ "$SKIP_BUILD" = true ] && echo "Skipped" || echo "Completed")"
echo "  Tests: $([ "$SKIP_TESTS" = true ] && echo "Skipped" || echo "Passed")"
echo "  Deployment Type: $([ "$PREVIEW_ONLY" = true ] && echo "Preview" || echo "Live")"

if [ "$PREVIEW_ONLY" = false ]; then
    echo "  Live URL: $HOSTING_URL"
fi

echo
print_status "For monitoring and analytics, check:"
print_status "  - Firebase Console: https://console.firebase.google.com/"
print_status "  - Google Analytics: https://analytics.google.com/"
print_status "  - Lighthouse reports in Firebase Console"

print_success "Happy coding! 💕"