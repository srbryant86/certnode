#!/bin/bash
# CertNode Automated Vercel Deployment Script (Unix/Mac/WSL)
# Run this script to deploy CertNode to Vercel automatically

DOMAIN="certnode.io"
PRODUCTION=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        *)
            echo "Usage: $0 [--domain certnode.io] [--production]"
            exit 1
            ;;
    esac
done

echo "🚀 CertNode Vercel Deployment Automation"
echo "========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI. Please install Node.js first."
        exit 1
    fi
fi

# Verify we're in the right directory
if [ ! -f "api/src/index.js" ]; then
    echo "❌ Please run this script from the CertNode root directory"
    exit 1
fi

# Run tests before deployment
echo "🧪 Running tests before deployment..."
node tools/test-fast.js
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

# Login to Vercel (will prompt if not logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Please log in to Vercel:"
    vercel login
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [ "$PRODUCTION" = true ]; then
    vercel --prod --yes
else
    vercel --yes
fi

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "Next steps:"
    echo "1. Go to your Vercel dashboard: https://vercel.com/dashboard"
    echo "2. Click on your certnode project"
    echo "3. Go to Settings > Domains"
    echo "4. Add '$DOMAIN' as a custom domain"
    echo "5. Update your Cloudflare DNS to point to Vercel"
    echo ""
    echo "🔧 Don't forget to set environment variables in Vercel dashboard!"
    echo "See scripts/vercel-env-template.txt for the list"
else
    echo "❌ Deployment failed. Check the output above for errors."
    exit 1
fi