# 🚀 How to Run the Project

## Prerequisites
- Docker Desktop installed and running
- Python 3.12+ installed
- Node.js 16+ installed

---

## Quick Start (3 Steps)

### Step 1: Start Ollama (AI Service)
```powershell
docker compose up -d
```

### Step 2: Start Backend
Open a new PowerShell window:
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Start Frontend
Open another new PowerShell window:
```powershell
cd frontend
npm run dev
```

### Step 4: Open Browser
Go to: **http://localhost:5173**

---

## First Time Setup

If running for the first time, install dependencies:

### Backend Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### Frontend Dependencies
```powershell
cd frontend
npm install
```

---

## Testing the Setup

### Test Ollama
```powershell
curl http://localhost:11434/api/tags
```

### Test Backend
```powershell
curl http://localhost:8000/api/ping
```

### Test Frontend
Open browser: http://localhost:5173

---

## Stopping Services

### Stop Ollama
```powershell
docker compose down
```

### Stop Backend/Frontend
Press `Ctrl+C` in their respective PowerShell windows

---

## Troubleshooting

### Port Already in Use
```powershell
# Find process on port 8000
netstat -ano | findstr :8000

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

### Backend Not Starting
```powershell
# Recreate virtual environment
cd backend
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Not Starting
```powershell
# Reinstall dependencies
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Ollama | http://localhost:11434 |

---

## Project Structure

```
cloud_finalyear/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── models/           # AI models
├── scripts/          # Helper scripts
├── docker-compose.yml
└── README.md
```

---

**That's it! Your code compiler should now be running.** 🎉
