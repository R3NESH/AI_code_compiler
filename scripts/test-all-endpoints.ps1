# Cloud Compiler - Complete Endpoint Testing Script
# Tests all services: Ollama, Backend, Frontend, and AI endpoints

$ErrorActionPreference = 'Continue'
$ProjectRoot = "c:\Users\suman\Desktop\cloud_finalyear"

function Write-TestHeader($msg) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Pass($msg) { Write-Host "[PASS] $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Yellow }

$testResults = @{
    Passed = 0
    Failed = 0
    Tests = @()
}

function Test-Endpoint($name, $scriptBlock) {
    try {
        $result = & $scriptBlock
        if ($result) {
            Write-Pass $name
            $testResults.Passed++
            $testResults.Tests += @{Name=$name; Status="PASS"; Details=$result}
            return $true
        } else {
            Write-Fail "$name - No response"
            $testResults.Failed++
            $testResults.Tests += @{Name=$name; Status="FAIL"; Details="No response"}
            return $false
        }
    } catch {
        Write-Fail "$name - Error: $_"
        $testResults.Failed++
        $testResults.Tests += @{Name=$name; Status="FAIL"; Details=$_.Exception.Message}
        return $false
    }
}

# ============================================
# TEST 1: OLLAMA SERVICE
# ============================================
Write-TestHeader "TEST 1: Ollama Docker Service"

Write-Info "Checking if Ollama container is running..."
$ollamaContainer = docker ps --filter "name=ollama" --format "{{.Names}}"
if ($ollamaContainer) {
    Write-Pass "Ollama container running: $ollamaContainer"
} else {
    Write-Fail "Ollama container not running"
    Write-Info "Starting Ollama..."
    Set-Location $ProjectRoot
    docker compose up -d
    Start-Sleep -Seconds 5
}

Write-Info "Testing Ollama /api/tags endpoint..."
Test-Endpoint "Ollama /api/tags" {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
    return $response
}

Write-Info "Testing Ollama /api/generate endpoint..."
Test-Endpoint "Ollama /api/generate" {
    $body = @{
        model = "mistral:7b"
        prompt = "Say hello"
        stream = $false
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    return $response.response
}

# ============================================
# TEST 2: BACKEND SERVICE
# ============================================
Write-TestHeader "TEST 2: Backend API Service"

Write-Info "Testing backend health endpoint..."
Test-Endpoint "Backend /api/ping" {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/ping" -Method GET -TimeoutSec 5
    return $response.pong
}

Write-Info "Testing backend root endpoint..."
Test-Endpoint "Backend /" {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/" -Method GET -TimeoutSec 5
    return $response.message
}

# ============================================
# TEST 3: BACKEND AI ENDPOINTS
# ============================================
Write-TestHeader "TEST 3: Backend AI Endpoints"

Write-Info "Testing /ai/suggest endpoint..."
Test-Endpoint "Backend /ai/suggest" {
    $body = @{
        language = "python"
        code = "def add(a, b):`n    return a + b"
        cursor = 10
        goal = "improve code quality"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/ai/suggest" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Info "  Suggestions: $($response.suggestions.Count) items"
    return $response.suggestions
}

Write-Info "Testing /ai/suggest with empty code..."
Test-Endpoint "Backend /ai/suggest (empty code)" {
    $body = @{
        language = "python"
        code = ""
        cursor = 0
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/ai/suggest" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Info "  Suggestions: $($response.suggestions.Count) items"
    return $response.suggestions
}

Write-Info "Testing /ai/explain endpoint..."
Test-Endpoint "Backend /ai/explain" {
    $body = @{
        language = "python"
        code = "print('Hello World')"
        error = "SyntaxError: invalid syntax"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/ai/explain" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Info "  Summary: $($response.summary)"
    return $response.summary
}

Write-Info "Testing /ai/recommend endpoint..."
Test-Endpoint "Backend /ai/recommend" {
    $body = @{
        topic = "Python decorators"
        language = "python"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/ai/recommend" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Info "  Recommendations: $($response.items.Count) items"
    return $response.items
}

# ============================================
# TEST 4: CODE EXECUTION ENDPOINTS
# ============================================
Write-TestHeader "TEST 4: Code Execution Endpoints"

Write-Info "Testing Python execution..."
Test-Endpoint "Execute Python" {
    $body = @{
        language = "python"
        code = "print('Hello from Python')"
        stdin = ""
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/execute" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
    Write-Info "  Output: $($response.output)"
    return $response.output
}

Write-Info "Testing JavaScript execution..."
Test-Endpoint "Execute JavaScript" {
    $body = @{
        language = "javascript"
        code = "console.log('Hello from JavaScript');"
        stdin = ""
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/execute" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
    Write-Info "  Output: $($response.output)"
    return $response.output
}

# ============================================
# TEST 5: FRONTEND SERVICE
# ============================================
Write-TestHeader "TEST 5: Frontend Service"

Write-Info "Testing frontend availability..."
Test-Endpoint "Frontend /" {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    return $response.StatusCode -eq 200
}

# ============================================
# SUMMARY
# ============================================
Write-TestHeader "TEST SUMMARY"

Write-Host "`nTotal Tests: $($testResults.Passed + $testResults.Failed)" -ForegroundColor White
Write-Host "Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed: $($testResults.Failed)" -ForegroundColor Red

if ($testResults.Failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    foreach ($test in $testResults.Tests | Where-Object { $_.Status -eq "FAIL" }) {
        Write-Host "  - $($test.Name): $($test.Details)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($testResults.Failed -eq 0) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "SOME TESTS FAILED - CHECK LOGS ABOVE" -ForegroundColor Yellow
}
Write-Host "========================================`n" -ForegroundColor Cyan
