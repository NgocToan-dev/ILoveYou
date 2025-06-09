#!/bin/bash

# Deploy script for Cloudflare Pages
# Make sure you have wrangler CLI installed: npm install -g wrangler

echo "🚀 Starting Cloudflare Pages deployment..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name=iloveyou-web

echo "✅ Deployment completed!"
echo "🔗 Your app should be available at: https://iloveyou-web.pages.dev" 