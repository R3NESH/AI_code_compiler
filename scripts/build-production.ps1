# Production Build Script for AI Code Compiler (Windows)

Write-Host "🚀 Starting Production Build..." -ForegroundColor Cyan

# Build Backend
Write-Host "`n📦 Building Backend..." -ForegroundColor Yellow
Set-Location backend
pip install -r requirements.txt
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ..

# Build Frontend
Write-Host "`n📦 Building Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Set-Location ..

Write-Host "`n✨ Production build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: Ready for deployment"
Write-Host "Frontend: Built to frontend/dist/"
