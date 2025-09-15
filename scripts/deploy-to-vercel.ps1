# CertNode Automated Vercel Deployment Script
# Run this script to deploy CertNode to Vercel automatically

param(
    [string]$Domain = "certnode.io",
    [switch]$Production = $false
)

Write-Host "CertNode Vercel Deployment Automation" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if Vercel CLI is installed
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Vercel CLI. Please install Node.js first."
        exit 1
    }
}

# Verify we're in the right directory
if (-not (Test-Path "api/src/index.js")) {
    Write-Error "Please run this script from the CertNode root directory"
    exit 1
}

# Run tests before deployment
Write-Host "Running tests before deployment..." -ForegroundColor Green
node tools/test-fast.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed. Deployment aborted."
    exit 1
}

# Login to Vercel (will prompt if not logged in)
Write-Host "Checking Vercel authentication..." -ForegroundColor Green
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please log in to Vercel:" -ForegroundColor Yellow
    vercel login
}

# Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Green
if ($Production) {
    vercel --prod --yes
} else {
    vercel --yes
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to your Vercel dashboard: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Click on your certnode project" -ForegroundColor White
    Write-Host "3. Go to Settings > Domains" -ForegroundColor White
    Write-Host "4. Add '$Domain' as a custom domain" -ForegroundColor White
    Write-Host "5. Update your Cloudflare DNS to point to Vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "Don't forget to set environment variables in Vercel dashboard!" -ForegroundColor Yellow
    Write-Host "See scripts/vercel-env-template.txt for the list" -ForegroundColor Yellow
} else {
    Write-Error "Deployment failed. Check the output above for errors."
    exit 1
}