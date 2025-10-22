#!/bin/bash

# Test setup script for Cloud Code Compiler
echo "🧪 Testing Cloud Code Compiler Setup..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python 3: $(python3 --version)"
else
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm is not installed"
    exit 1
fi

# Check Java (optional)
if command -v java &> /dev/null; then
    echo "✅ Java: $(java -version 2>&1 | head -n 1)"
else
    echo "⚠️  Java is not installed (required for Java code execution)"
fi

# Check GCC (optional)
if command -v g++ &> /dev/null; then
    echo "✅ GCC/G++: $(g++ --version | head -n 1)"
else
    echo "⚠️  GCC/G++ is not installed (required for C++ code execution)"
fi

echo ""
echo "🔧 Setting up environment files..."

# Setup backend environment
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp backend/env.example backend/.env
    echo "✅ Backend .env created (please edit with your API keys)"
else
    echo "✅ Backend .env already exists"
fi

# Setup frontend environment
if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend .env.local file..."
    cp frontend/env.example frontend/.env.local
    echo "✅ Frontend .env.local created"
else
    echo "✅ Frontend .env.local already exists"
fi

echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "   ./scripts/start-dev.sh"
echo ""
echo "📚 For individual services:"
echo "   Backend only:  ./scripts/start-backend.sh"
echo "   Frontend only: ./scripts/start-frontend.sh"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
