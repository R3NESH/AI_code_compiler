#!/bin/bash

# Frontend startup script
echo "🎨 Starting Cloud Code Compiler Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local file found. Copying from env.example..."
    cp env.example .env.local
    echo "📝 Please edit .env.local file with your configuration"
fi

# Start the development server
echo "🚀 Starting Vite development server..."
echo "📱 Frontend: http://localhost:5173"
echo ""
npm run dev

