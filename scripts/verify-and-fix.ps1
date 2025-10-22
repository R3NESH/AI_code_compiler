#Requires -Version 5.1
<#
.SYNOPSIS
    Cloud Compiler - Full Project Verification & Auto-Fix Script
.DESCRIPTION
    Automatically verifies and fixes all components of the Cloud Compiler project:
    - Environment files
    - System dependencies
    - Ollama Docker service
    - Backend API server
    - Frontend dev server
    - AI endpoint connectivity
.NOTES
    Run this script from the project root directory.
    Some operations may require Administrator privileges (firewall rules).
#>

param(
    [switch]$SkipFirewall,
    [switch]$SkipServices
)

$ErrorActionPreference = 'Continue'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $ProjectRoot -or $ProjectRoot -eq '') { 
    $ProjectRoot = Get-Location 
}

# Color output functions
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "[✅ OK] $msg" -ForegroundColor Green }
function Write-Warning($msg) { Write-Host "[⚠️ WARN] $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "[❌ ERR] $msg" -ForegroundColor Red }
function Write-Step($msg) { Write-Host "`n========================================" -ForegroundColor Magenta; Write-Host "  $msg" -ForegroundColor Magenta; Write-Host "========================================`n" -ForegroundColor Magenta }

function Test-CommandExists($cmdName) {
    $cmd = Get-Command $cmdName -ErrorAction SilentlyContinue
    return [bool]$cmd
}

function Test-PortOpen($port) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# ============================================
# STEP 1: PROJECT STRUCTURE VERIFICATION
# ============================================
Write-Step "STEP 1: Project Structure Verification"

Set-Location $ProjectRoot
Write-Info "Project root: $ProjectRoot"

$requiredItems = @(
    @{Path="backend"; Type="Directory"},
    @{Path="frontend"; Type="Directory"},
    @{Path="scripts"; Type="Directory"},
    @{Path="models"; Type="Directory"},
    @{Path="docker-compose.yml"; Type="File"},
    @{Path="backend\app\main.py"; Type="File"},
    @{Path="backend\requirements.txt"; Type="File"},
    @{Path="frontend\package.json"; Type="File"}
)

$structureOk = $true
foreach ($item in $requiredItems) {
    $fullPath = Join-Path $ProjectRoot $item.Path
    if (Test-Path $fullPath) {
        Write-Success "$($item.Path) exists"
    } else {
        Write-Error "$($item.Path) MISSING"
        $structureOk = $false
    }
}

if (-not $structureOk) {
    Write-Error "Project structure incomplete. Please ensure all required files/folders exist."
    exit 1
}

# ============================================
# STEP 2: ENVIRONMENT FILES
# ============================================
Write-Step "STEP 2: Environment Files Setup"

# Backend .env
$backendEnv = Join-Path $ProjectRoot "backend\.env"
$backendEnvExample = Join-Path $ProjectRoot "backend\env.example"

if (-not (Test-Path $backendEnv)) {
    if (Test-Path $backendEnvExample) {
        Copy-Item $backendEnvExample $backendEnv
        Write-Success "Created backend\.env from template"
        
        # Ensure critical env vars are set
        $envContent = Get-Content $backendEnv -Raw
        if ($envContent -notmatch "AI_PROVIDER") {
            Add-Content $backendEnv "`nAI_PROVIDER=ollama"
        }
        if ($envContent -notmatch "OLLAMA_URL") {
            Add-Content $backendEnv "OLLAMA_URL=http://localhost:11434"
        }
        if ($envContent -notmatch "OLLAMA_MODEL") {
            Add-Content $backendEnv "OLLAMA_MODEL=mistral:7b"
        }
        if ($envContent -notmatch "ALLOWED_ORIGINS") {
            Add-Content $backendEnv "ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5177"
        }
        Write-Success "Added default Ollama configuration to backend\.env"
    } else {
        Write-Error "backend\env.example not found. Cannot create .env file."
    }
} else {
    Write-Success "backend\.env already exists"
}

# Frontend .env.local
$frontendEnv = Join-Path $ProjectRoot "frontend\.env.local"
$frontendEnvExample = Join-Path $ProjectRoot "frontend\env.example"

if (-not (Test-Path $frontendEnv)) {
    if (Test-Path $frontendEnvExample) {
        Copy-Item $frontendEnvExample $frontendEnv
        Write-Success "Created frontend\.env.local from template"
    } else {
        Write-Error "frontend\env.example not found. Cannot create .env.local file."
    }
} else {
    Write-Success "frontend\.env.local already exists"
}

# ============================================
# STEP 3: SYSTEM DEPENDENCIES VERIFICATION
# ============================================
Write-Step "STEP 3: System Dependencies Verification"

$depsOk = $true

# Docker
if (Test-CommandExists docker) {
    $dockerVersion = docker --version
    Write-Success "Docker: $dockerVersion"
} else {
    Write-Error "Docker not found. Please install Docker Desktop."
    $depsOk = $false
}

# Docker Compose
$composeOk = $false
try {
    $composeV2 = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker Compose v2: $composeV2"
        $composeOk = $true
    }
} catch {}

if (-not $composeOk) {
    try {
        $composeV1 = docker-compose --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "docker-compose v1: $composeV1"
            $composeOk = $true
        }
    } catch {}
}

if (-not $composeOk) {
    Write-Error "Docker Compose not found. Please install Docker Compose."
    $depsOk = $false
}

# Python
if (Test-CommandExists python) {
    $pythonVersion = python --version
    Write-Success "Python: $pythonVersion"
} else {
    Write-Error "Python not found. Please install Python 3.12+."
    $depsOk = $false
}

# Node.js
if (Test-CommandExists node) {
    $nodeVersion = node --version
    Write-Success "Node.js: $nodeVersion"
} else {
    Write-Error "Node.js not found. Please install Node.js 16+."
    $depsOk = $false
}

# npm
if (Test-CommandExists npm) {
    $npmVersion = npm --version
    Write-Success "npm: $npmVersion"
} else {
    Write-Error "npm not found. Please install npm."
    $depsOk = $false
}

if (-not $depsOk) {
    Write-Error "Missing required dependencies. Please install them and re-run this script."
    exit 1
}

# ============================================
# STEP 4: OLLAMA SERVICE VERIFICATION
# ============================================
Write-Step "STEP 4: Ollama Docker Service"

Write-Info "Starting Ollama container via Docker Compose..."
try {
    docker compose up -d 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    
    $ollamaContainer = docker ps --filter "name=cloud-compiler-ollama" --format "{{.Names}}: {{.Status}}"
    if ($ollamaContainer) {
        Write-Success "Ollama container running: $ollamaContainer"
    } else {
        Write-Warning "Ollama container not found in docker ps. Checking all containers..."
        docker ps -a --filter "name=ollama"
    }
} catch {
    Write-Error "Failed to start Ollama container: $_"
}

# Test Ollama API
Write-Info "Testing Ollama API on port 11434..."
Start-Sleep -Seconds 2

try {
    $tagsResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($tagsResponse.StatusCode -eq 200) {
        Write-Success "Ollama /api/tags endpoint responding"
        $tagsJson = $tagsResponse.Content | ConvertFrom-Json
        if ($tagsJson.models) {
            Write-Info "Available models:"
            foreach ($model in $tagsJson.models) {
                Write-Info "  - $($model.name)"
            }
        }
    }
} catch {
    Write-Warning "Ollama API not responding on http://localhost:11434/api/tags"
    Write-Warning "Error: $_"
    Write-Info "Attempting to check if Ollama is still starting..."
}

# Test Ollama generation endpoint
Write-Info "Testing Ollama generation endpoint..."
try {
    $generateBody = @{
        model = "mistral:7b"
        prompt = "Hello"
        stream = $false
    } | ConvertTo-Json

    $generateResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/generate" -Method POST -Body $generateBody -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    if ($generateResponse.StatusCode -eq 200) {
        Write-Success "Ollama generation endpoint working"
    }
} catch {
    Write-Warning "Ollama generation test failed: $_"
    Write-Info "This may be normal if the model needs to be loaded first."
}

# ============================================
# STEP 5: BACKEND SETUP & VERIFICATION
# ============================================
Write-Step "STEP 5: Backend Setup & Verification"

Set-Location (Join-Path $ProjectRoot "backend")

# Check/create virtual environment
$venvPath = Join-Path $ProjectRoot "backend\venv"
$venvActivate = Join-Path $venvPath "Scripts\activate.ps1"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$venvPip = Join-Path $venvPath "Scripts\pip.exe"

if (-not (Test-Path $venvActivate)) {
    Write-Info "Creating Python virtual environment..."
    python -m venv $venvPath
    if (Test-Path $venvActivate) {
        Write-Success "Virtual environment created"
    } else {
        Write-Error "Failed to create virtual environment"
        exit 1
    }
} else {
    Write-Success "Virtual environment already exists"
}

# Install dependencies
Write-Info "Installing backend dependencies..."
& $venvPip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed"
} else {
    Write-Error "Failed to install backend dependencies"
}

if (-not $SkipServices) {
    # Start backend server in new window
    Write-Info "Starting backend server in new window..."
    $backendCmd = "Set-Location -Path '$ProjectRoot\backend'; & '.\venv\Scripts\activate.ps1'; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    
    Write-Info "Waiting for backend to start (5 seconds)..."
    Start-Sleep -Seconds 5
    
    # Test backend health
    Write-Info "Testing backend health endpoint..."
    try {
        $pingResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/ping" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($pingResponse.StatusCode -eq 200) {
            Write-Success "Backend /api/ping endpoint responding"
        }
    } catch {
        Write-Warning "Backend ping failed: $_"
        Write-Info "Backend may still be starting. Check the backend window."
    }
    
    # Test AI suggest endpoint
    Write-Info "Testing backend AI suggest endpoint..."
    try {
        $suggestBody = @{
            language = "python"
            code = "print('hello')"
            cursor = 5
        } | ConvertTo-Json
        
        $suggestResponse = Invoke-WebRequest -Uri "http://localhost:8000/ai/suggest" -Method POST -Body $suggestBody -ContentType "application/json" -TimeoutSec 20 -ErrorAction Stop
        if ($suggestResponse.StatusCode -eq 200) {
            Write-Success "Backend AI suggest endpoint responding"
            $suggestJson = $suggestResponse.Content | ConvertFrom-Json
            Write-Info "Suggestions received: $($suggestJson.suggestions.Count) items"
        }
    } catch {
        Write-Warning "Backend AI suggest test failed: $_"
        Write-Info "This may indicate Ollama connectivity issues. Check backend logs."
    }
}

# ============================================
# STEP 6: FRONTEND SETUP & VERIFICATION
# ============================================
Write-Step "STEP 6: Frontend Setup & Verification"

Set-Location (Join-Path $ProjectRoot "frontend")

# Install dependencies
Write-Info "Installing frontend dependencies..."
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend dependencies installed"
} else {
    Write-Error "Failed to install frontend dependencies"
}

if (-not $SkipServices) {
    # Start frontend server in new window
    Write-Info "Starting frontend dev server in new window..."
    $frontendCmd = "Set-Location -Path '$ProjectRoot\frontend'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    
    Write-Info "Waiting for frontend to start (5 seconds)..."
    Start-Sleep -Seconds 5
    
    # Open browser
    Write-Info "Opening frontend in browser..."
    Start-Process "http://localhost:5173"
}

# ============================================
# STEP 7: NETWORKING & FIREWALL
# ============================================
Write-Step "STEP 7: Networking & Firewall Configuration"

if (-not $SkipFirewall) {
    Write-Info "Configuring Windows Firewall rules..."
    
    $ports = @(
        @{Name="CloudCompiler_Ollama"; Port=11434},
        @{Name="CloudCompiler_Backend"; Port=8000},
        @{Name="CloudCompiler_Frontend"; Port=5173}
    )
    
    foreach ($rule in $ports) {
        try {
            # Check if rule exists
            $existing = netsh advfirewall firewall show rule name="$($rule.Name)" 2>&1
            if ($existing -match "No rules match") {
                netsh advfirewall firewall add rule name="$($rule.Name)" dir=in action=allow protocol=TCP localport=$($rule.Port) | Out-Null
                Write-Success "Firewall rule added for port $($rule.Port)"
            } else {
                Write-Success "Firewall rule already exists for port $($rule.Port)"
            }
        } catch {
            Write-Warning "Failed to add firewall rule for port $($rule.Port): $_"
            Write-Info "You may need to run this script as Administrator for firewall rules."
        }
    }
} else {
    Write-Info "Skipping firewall configuration (--SkipFirewall flag)"
}

# ============================================
# STEP 8: FINAL VERIFICATION & SUMMARY
# ============================================
Write-Step "STEP 8: Final Verification & Summary"

$checks = @()

# Ollama
if (Test-PortOpen 11434) {
    $checks += @{Service="Ollama API"; Status="✅ Running"; URL="http://localhost:11434/api/tags"}
} else {
    $checks += @{Service="Ollama API"; Status="❌ Not responding"; URL="http://localhost:11434/api/tags"}
}

# Backend
if (Test-PortOpen 8000) {
    $checks += @{Service="Backend API"; Status="✅ Running"; URL="http://localhost:8000/docs"}
} else {
    $checks += @{Service="Backend API"; Status="❌ Not responding"; URL="http://localhost:8000/docs"}
}

# Frontend
if (Test-PortOpen 5173) {
    $checks += @{Service="Frontend"; Status="✅ Running"; URL="http://localhost:5173"}
} else {
    $checks += @{Service="Frontend"; Status="❌ Not responding"; URL="http://localhost:5173"}
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           CLOUD COMPILER - VERIFICATION SUMMARY            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

foreach ($check in $checks) {
    Write-Host "  $($check.Service.PadRight(20)) $($check.Status)" -NoNewline
    Write-Host "  ->  " -NoNewline -ForegroundColor DarkGray
    Write-Host "$($check.URL)" -ForegroundColor Blue
}

Write-Host "`n" -NoNewline
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Check the backend and frontend windows for any errors" -ForegroundColor White
Write-Host "  2. Visit http://localhost:5173 to test the application" -ForegroundColor White
Write-Host "  3. Test AI features (suggestions, explain, recommendations)" -ForegroundColor White
Write-Host "  4. Check backend logs for Ollama connectivity" -ForegroundColor White
Write-Host "`n" -NoNewline
Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "  - If Ollama fails: docker compose logs ollama" -ForegroundColor White
Write-Host "  - If backend fails: Check backend window for Python errors" -ForegroundColor White
Write-Host "  - If AI features fail: Verify OLLAMA_MODEL=mistral:7b in backend\.env" -ForegroundColor White
Write-Host "  - Model loading: First AI request may take 30-60 seconds" -ForegroundColor White
Write-Host "`n" -NoNewline

Set-Location $ProjectRoot
Write-Success "Verification complete! Project root: $ProjectRoot"
