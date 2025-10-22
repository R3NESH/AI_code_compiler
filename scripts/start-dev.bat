@echo off
echo 🚀 Starting Cloud Code Compiler in development mode...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Start backend
echo 🔧 Starting backend server...
cd backend
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

echo 📦 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📦 Installing backend dependencies...
pip install -r requirements.txt

echo 🚀 Starting FastAPI server...
start "Backend Server" cmd /k "venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting frontend development server...
cd ..\frontend

echo 📦 Installing frontend dependencies...
npm install

echo 🚀 Starting Vite development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 🎉 Cloud Code Compiler is starting up!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close the windows to stop the servers.
pause

