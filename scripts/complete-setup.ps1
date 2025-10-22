# Cloud Compiler - Complete Setup and Verification Script
# This script sets up everything and verifies all components work

param(
    [switch]$SkipInstall,
    [switch]$SkipTests
)

$ErrorActionPreference = 'Continue'
$ProjectRoot = "c:\Users\suman\Desktop\cloud_finalyear"

function Write-Step($msg) {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  $msg" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
}

function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }

Set-Location $ProjectRoot

# ============================================
# STEP 1: VERIFY PROJECT STRUCTURE
# ============================================
Write-Step "STEP 1: Verify Project Structure"

$requiredPaths = @(
    "backend\app\main.py",
    "backend\requirements.txt",
    "backend\venv",
    "frontend\package.json",
    "docker-compose.yml",
    "models"
)

$structureOk = $true
foreach ($path in $requiredPaths) {
    if (Test-Path (Join-Path $ProjectRoot $path)) {
        Write-Success "$path exists"
    } else {
        Write-Error "$path MISSING"
        $structureOk = $false
    }
}

if (-not $structureOk) {
    Write-Error "Project structure incomplete. Exiting."
    exit 1
}

# ============================================
# STEP 2: CREATE ENVIRONMENT FILES
# ============================================
Write-Step "STEP 2: Environment Files"

# Backend .env
if (-not (Test-Path "$ProjectRoot\backend\.env")) {
    Write-Info "Creating backend\.env from template..."
    if (Test-Path "$ProjectRoot\backend\env.example") {
        Copy-Item "$ProjectRoot\backend\env.example" "$ProjectRoot\backend\.env"
        Write-Success "Created backend\.env"
    } else {
        Write-Error "backend\env.example not found"
    }
} else {
    Write-Success "backend\.env already exists"
}

# Frontend .env.local
if (-not (Test-Path "$ProjectRoot\frontend\.env.local")) {
    Write-Info "Creating frontend\.env.local from template..."
    if (Test-Path "$ProjectRoot\frontend\env.example") {
        Copy-Item "$ProjectRoot\frontend\env.example" "$ProjectRoot\frontend\.env.local"
        Write-Success "Created frontend\.env.local"
    } else {
        Write-Error "frontend\env.example not found"
    }
} else {
    Write-Success "frontend\.env.local already exists"
}

# ============================================
# STEP 3: VERIFY SYSTEM DEPENDENCIES
# ============================================
Write-Step "STEP 3: System Dependencies"

$depsOk = $true

# Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Success "Docker: $(docker --version)"
} else {
    Write-Error "Docker not found"
    $depsOk = $false
}

# Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Success "Python: $(python --version)"
} else {
    Write-Error "Python not found"
    $depsOk = $false
}

# Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Success "Node.js: $(node --version)"
} else {
    Write-Error "Node.js not found"
    $depsOk = $false
}

# npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Success "npm: $(npm --version)"
} else {
    Write-Error "npm not found"
    $depsOk = $false
}

if (-not $depsOk) {
    Write-Error "Missing dependencies. Please install and re-run."
    exit 1
}

# ============================================
# STEP 4: START OLLAMA
# ============================================
Write-Step "STEP 4: Start Ollama Service"

Write-Info "Starting Ollama container..."
docker compose up -d
Start-Sleep -Seconds 5

$ollamaRunning = docker ps --filter "name=ollama" --format "{{.Names}}"
if ($ollamaRunning) {
    Write-Success "Ollama container running: $ollamaRunning"
} else {
    Write-Error "Ollama container failed to start"
    docker ps -a --filter "name=ollama"
}

# Test Ollama
Write-Info "Testing Ollama API..."
try {
    $tags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
    Write-Success "Ollama API responding"
    if ($tags.models) {
        Write-Info "Available models:"
        foreach ($model in $tags.models) {
            Write-Info "  - $($model.name)"
        }
    }
} catch {
    Write-Error "Ollama API not responding: $_"
}

# ============================================
# STEP 5: SETUP BACKEND
# ============================================
Write-Step "STEP 5: Backend Setup"

Set-Location "$ProjectRoot\backend"

if (-not $SkipInstall) {
    Write-Info "Installing backend dependencies..."
    & "$ProjectRoot\backend\venv\Scripts\pip.exe" install -r requirements.txt --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend dependencies installed"
    } else {
        Write-Error "Failed to install backend dependencies"
    }
}

Write-Info "Starting backend server (new window)..."
$backendCmd = "Set-Location '$ProjectRoot\backend'; & '.\venv\Scripts\activate.ps1'; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Info "Waiting for backend to start..."
Start-Sleep -Seconds 7

# Test backend
try {
    $ping = Invoke-RestMethod -Uri "http://localhost:8000/api/ping" -Method GET -TimeoutSec 5
    Write-Success "Backend API responding"
} catch {
    Write-Error "Backend not responding: $_"
}

# ============================================
# STEP 6: SETUP FRONTEND
# ============================================
Write-Step "STEP 6: Frontend Setup"

Set-Location "$ProjectRoot\frontend"

if (-not $SkipInstall) {
    Write-Info "Installing frontend dependencies..."
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend dependencies installed"
    } else {
        Write-Error "Failed to install frontend dependencies"
    }
}

Write-Info "Starting frontend server (new window)..."
$frontendCmd = "Set-Location '$ProjectRoot\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Info "Waiting for frontend to start..."
Start-Sleep -Seconds 7

# Test frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend responding"
    }
} catch {
    Write-Error "Frontend not responding: $_"
}

# ============================================
# STEP 7: RUN TESTS
# ============================================
if (-not $SkipTests) {
    Write-Step "STEP 7: Running Endpoint Tests"
    
    Set-Location $ProjectRoot
    if (Test-Path "$ProjectRoot\scripts\test-all-endpoints.ps1") {
        & "$ProjectRoot\scripts\test-all-endpoints.ps1"
    } else {
        Write-Info "Test script not found, skipping automated tests"
    }
}

# ============================================
# FINAL SUMMARY
# ============================================
Write-Step "SETUP COMPLETE"

Write-Host "`nServices:" -ForegroundColor Cyan
Write-Host "  Ollama:   http://localhost:11434/api/tags" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Yellow

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Check backend and frontend windows for errors" -ForegroundColor White
Write-Host "  2. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  3. Test AI features in the application" -ForegroundColor White
Write-Host "  4. Run: .\scripts\test-all-endpoints.ps1 for detailed tests" -ForegroundColor White

Write-Host "`nOpening browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Set-Location $ProjectRoot
