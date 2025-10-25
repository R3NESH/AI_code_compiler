# Deployment Readiness Verification Script
# Checks if project is ready for Render deployment

Write-Host "🔍 Verifying Render Deployment Readiness..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Check required files
Write-Host "📁 Checking Required Files..." -ForegroundColor Yellow

$requiredFiles = @(
    "render.yaml",
    "backend\Dockerfile",
    "backend\requirements.txt",
    "backend\app\main.py",
    "frontend\package.json",
    "frontend\vite.config.ts"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - MISSING!" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# Check optional but recommended files
Write-Host "📋 Checking Recommended Files..." -ForegroundColor Yellow

$recommendedFiles = @(
    ".renderignore",
    "backend\.dockerignore",
    "RENDER_DEPLOYMENT_GUIDE.md",
    "DEPLOY_QUICK_START.md"
)

foreach ($file in $recommendedFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $file - Missing (recommended)" -ForegroundColor Yellow
        $warnings++
    }
}

Write-Host ""

# Check Git status
Write-Host "🔧 Checking Git Configuration..." -ForegroundColor Yellow

if (Test-Path ".git") {
    Write-Host "  ✅ Git repository initialized" -ForegroundColor Green
    
    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "  ⚠️  Uncommitted changes detected" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "  ✅ No uncommitted changes" -ForegroundColor Green
    }
    
    # Check for remote
    $gitRemote = git remote -v
    if ($gitRemote) {
        Write-Host "  ✅ Git remote configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  No Git remote configured" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "  ❌ Git not initialized" -ForegroundColor Red
    $errors++
}

Write-Host ""

# Check render.yaml syntax
Write-Host "📝 Checking render.yaml..." -ForegroundColor Yellow

if (Test-Path "render.yaml") {
    $content = Get-Content "render.yaml" -Raw
    
    if ($content -match "ai-code-compiler-backend") {
        Write-Host "  ✅ Backend service defined" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Backend service not found" -ForegroundColor Red
        $errors++
    }
    
    if ($content -match "ai-code-compiler-frontend") {
        Write-Host "  ✅ Frontend service defined" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Frontend service not found" -ForegroundColor Red
        $errors++
    }
    
    if ($content -match "OPENAI_API_KEY") {
        Write-Host "  ✅ OpenAI API key variable defined" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  OpenAI API key not in render.yaml" -ForegroundColor Yellow
        $warnings++
    }
}

Write-Host ""

# Check backend dependencies
Write-Host "🐍 Checking Backend Dependencies..." -ForegroundColor Yellow

if (Test-Path "backend\requirements.txt") {
    $requirements = Get-Content "backend\requirements.txt"
    
    $requiredPackages = @("fastapi", "uvicorn", "gunicorn")
    foreach ($package in $requiredPackages) {
        if ($requirements -match $package) {
            Write-Host "  ✅ $package found" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $package missing" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host ""

# Check frontend dependencies
Write-Host "📦 Checking Frontend Dependencies..." -ForegroundColor Yellow

if (Test-Path "frontend\package.json") {
    $packageJson = Get-Content "frontend\package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.scripts.build) {
        Write-Host "  ✅ Build script defined" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Build script missing" -ForegroundColor Red
        $errors++
    }
    
    if ($packageJson.dependencies.react) {
        Write-Host "  ✅ React dependency found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ React dependency missing" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# Environment variables check
Write-Host "🔐 Environment Variables Checklist..." -ForegroundColor Yellow
Write-Host "  ℹ️  You will need to set these in Render Dashboard:" -ForegroundColor Cyan
Write-Host "     - OPENAI_API_KEY (Required)" -ForegroundColor White
Write-Host "     - ANTHROPIC_API_KEY (Optional)" -ForegroundColor White

Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ All checks passed! Ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Commit and push to GitHub/GitLab" -ForegroundColor White
    Write-Host "2. Go to https://dashboard.render.com" -ForegroundColor White
    Write-Host "3. Create Blueprint deployment" -ForegroundColor White
    Write-Host "4. Set OPENAI_API_KEY in backend service" -ForegroundColor White
    Write-Host "5. Click 'Apply' to deploy" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 See DEPLOY_QUICK_START.md for detailed steps" -ForegroundColor Cyan
} elseif ($errors -eq 0) {
    Write-Host "⚠️  $warnings warning(s) found" -ForegroundColor Yellow
    Write-Host "✅ No critical errors - can proceed with deployment" -ForegroundColor Green
    Write-Host ""
    Write-Host "📖 Review warnings above and fix if needed" -ForegroundColor Yellow
} else {
    Write-Host "❌ $errors error(s) found" -ForegroundColor Red
    if ($warnings -gt 0) {
        Write-Host "⚠️  $warnings warning(s) found" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please fix the errors above before deploying" -ForegroundColor Red
}

Write-Host ""
