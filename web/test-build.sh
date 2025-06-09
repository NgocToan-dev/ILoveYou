#!/bin/bash

# Test build script for local testing before Cloudflare deployment

echo "🧪 Testing build locally..."

# Clean previous build
if [ -d "dist" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf dist
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Check if critical files exist
echo "🔍 Checking build output..."

if [ ! -f "dist/index.html" ]; then
    echo "❌ index.html not found in build output"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ assets directory not found in build output"
    exit 1
fi

if [ ! -f "dist/_redirects" ]; then
    echo "❌ _redirects file not found in build output"
    exit 1
fi

# Check build size
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "📊 Build size: $BUILD_SIZE"

# Start preview server
echo "🚀 Starting preview server..."
echo "📱 Open http://localhost:3000 to test"
echo "🛑 Press Ctrl+C to stop"

npm run preview 