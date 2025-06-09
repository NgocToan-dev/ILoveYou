# Deploy script for Cloudflare Pages (PowerShell version)
# Make sure you have wrangler CLI installed: npm install -g wrangler

Write-Host "🚀 Starting Cloudflare Pages deployment..." -ForegroundColor Green

# Check if wrangler is installed
try {
    wrangler --version | Out-Null
} catch {
    Write-Host "❌ Wrangler CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

# Build the project
Write-Host "📦 Building the project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to Cloudflare Pages
Write-Host "🌐 Deploying to Cloudflare Pages..." -ForegroundColor Blue
wrangler pages deploy dist --project-name=iloveyou-web

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🔗 Your app should be available at: https://iloveyou-web.pages.dev" -ForegroundColor Cyan 