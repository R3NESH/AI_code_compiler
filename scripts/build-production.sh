#!/bin/bash
# Production Build Script for AI Code Compiler

set -e

echo "🚀 Starting Production Build..."

# Build Backend
echo "📦 Building Backend..."
cd backend
pip install -r requirements.txt
echo "✅ Backend dependencies installed"
cd ..

# Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
echo "✅ Frontend built successfully"
cd ..

echo "✨ Production build complete!"
echo ""
echo "Backend: Ready for deployment"
echo "Frontend: Built to frontend/dist/"
