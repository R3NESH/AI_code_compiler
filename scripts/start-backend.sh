#!/bin/bash

# Backend startup script
echo "🔧 Starting Cloud Code Compiler Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Navigate to backend directory
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration"
fi

# Start the server
echo "🚀 Starting FastAPI server..."
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🔧 API Base URL: http://localhost:8000"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

