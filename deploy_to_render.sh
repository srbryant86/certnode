#!/bin/bash

# Deploy CertNode to Render.com
# This bypasses browser authentication issues

echo "🚀 Deploying CertNode to Render..."

# Create render.yaml for automatic deployment
cat > render.yaml << 'EOF'
services:
  - type: web
    name: certnode
    env: python
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
    repo: https://github.com/srbryant86/certnode.git
    branch: main
    envVars:
      - key: PYTHON_VERSION
        value: "3.9"
      - key: PORT
        value: "10000"
EOF

echo "✅ Created render.yaml configuration"
echo "📋 Next steps:"
echo "1. Go to https://render.com"
echo "2. Sign up/login with GitHub"
echo "3. Click 'New Web Service'"
echo "4. Connect your GitHub repository: srbryant86/certnode"
echo "5. Render will automatically detect the render.yaml and deploy"
echo ""
echo "🎯 This should work in under 5 minutes!"

