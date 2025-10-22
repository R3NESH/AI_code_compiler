#!/bin/bash

# Build script for production deployment
echo "🏗️  Building Cloud Code Compiler for production..."

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
echo "✅ Frontend build completed"

# Go back to root
cd ..

# Create production directory
echo "📁 Creating production build..."
mkdir -p dist
cp -r frontend/dist/* dist/
cp -r backend dist/
cp backend/requirements.txt dist/

echo "✅ Production build completed in ./dist directory"
echo ""
echo "To deploy:"
echo "1. Copy the dist directory to your server"
echo "2. Install Python dependencies: pip install -r requirements.txt"
echo "3. Start the backend: uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "4. Serve the frontend files with a web server (nginx, Apache, etc.)"

