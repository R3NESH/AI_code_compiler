#!/bin/bash
# Deployment Readiness Verification Script
# Checks if project is ready for Render deployment

echo "🔍 Verifying Render Deployment Readiness..."
echo "============================================"
echo ""

errors=0
warnings=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check required files
echo -e "${YELLOW}📁 Checking Required Files...${NC}"

required_files=(
    "render.yaml"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "backend/app/main.py"
    "frontend/package.json"
    "frontend/vite.config.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅ $file${NC}"
    else
        echo -e "  ${RED}❌ $file - MISSING!${NC}"
        ((errors++))
    fi
done

echo ""

# Check optional but recommended files
echo -e "${YELLOW}📋 Checking Recommended Files...${NC}"

recommended_files=(
    ".renderignore"
    "backend/.dockerignore"
    "RENDER_DEPLOYMENT_GUIDE.md"
    "DEPLOY_QUICK_START.md"
)

for file in "${recommended_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅ $file${NC}"
    else
        echo -e "  ${YELLOW}⚠️  $file - Missing (recommended)${NC}"
        ((warnings++))
    fi
done

echo ""

# Check Git status
echo -e "${YELLOW}🔧 Checking Git Configuration...${NC}"

if [ -d ".git" ]; then
    echo -e "  ${GREEN}✅ Git repository initialized${NC}"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "  ${YELLOW}⚠️  Uncommitted changes detected${NC}"
        ((warnings++))
    else
        echo -e "  ${GREEN}✅ No uncommitted changes${NC}"
    fi
    
    # Check for remote
    if git remote -v | grep -q .; then
        echo -e "  ${GREEN}✅ Git remote configured${NC}"
    else
        echo -e "  ${YELLOW}⚠️  No Git remote configured${NC}"
        ((warnings++))
    fi
else
    echo -e "  ${RED}❌ Git not initialized${NC}"
    ((errors++))
fi

echo ""

# Check render.yaml syntax
echo -e "${YELLOW}📝 Checking render.yaml...${NC}"

if [ -f "render.yaml" ]; then
    if grep -q "ai-code-compiler-backend" render.yaml; then
        echo -e "  ${GREEN}✅ Backend service defined${NC}"
    else
        echo -e "  ${RED}❌ Backend service not found${NC}"
        ((errors++))
    fi
    
    if grep -q "ai-code-compiler-frontend" render.yaml; then
        echo -e "  ${GREEN}✅ Frontend service defined${NC}"
    else
        echo -e "  ${RED}❌ Frontend service not found${NC}"
        ((errors++))
    fi
    
    if grep -q "OPENAI_API_KEY" render.yaml; then
        echo -e "  ${GREEN}✅ OpenAI API key variable defined${NC}"
    else
        echo -e "  ${YELLOW}⚠️  OpenAI API key not in render.yaml${NC}"
        ((warnings++))
    fi
fi

echo ""

# Check backend dependencies
echo -e "${YELLOW}🐍 Checking Backend Dependencies...${NC}"

if [ -f "backend/requirements.txt" ]; then
    required_packages=("fastapi" "uvicorn" "gunicorn")
    for package in "${required_packages[@]}"; do
        if grep -q "$package" backend/requirements.txt; then
            echo -e "  ${GREEN}✅ $package found${NC}"
        else
            echo -e "  ${RED}❌ $package missing${NC}"
            ((errors++))
        fi
    done
fi

echo ""

# Check frontend dependencies
echo -e "${YELLOW}📦 Checking Frontend Dependencies...${NC}"

if [ -f "frontend/package.json" ]; then
    if grep -q '"build"' frontend/package.json; then
        echo -e "  ${GREEN}✅ Build script defined${NC}"
    else
        echo -e "  ${RED}❌ Build script missing${NC}"
        ((errors++))
    fi
    
    if grep -q '"react"' frontend/package.json; then
        echo -e "  ${GREEN}✅ React dependency found${NC}"
    else
        echo -e "  ${RED}❌ React dependency missing${NC}"
        ((errors++))
    fi
fi

echo ""

# Environment variables check
echo -e "${YELLOW}🔐 Environment Variables Checklist...${NC}"
echo -e "  ${CYAN}ℹ️  You will need to set these in Render Dashboard:${NC}"
echo "     - OPENAI_API_KEY (Required)"
echo "     - ANTHROPIC_API_KEY (Optional)"

echo ""

# Summary
echo "============================================"
echo -e "${CYAN}📊 Verification Summary${NC}"
echo "============================================"

if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy!${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Commit and push to GitHub/GitLab"
    echo "2. Go to https://dashboard.render.com"
    echo "3. Create Blueprint deployment"
    echo "4. Set OPENAI_API_KEY in backend service"
    echo "5. Click 'Apply' to deploy"
    echo ""
    echo -e "${CYAN}📖 See DEPLOY_QUICK_START.md for detailed steps${NC}"
elif [ $errors -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $warnings warning(s) found${NC}"
    echo -e "${GREEN}✅ No critical errors - can proceed with deployment${NC}"
    echo ""
    echo -e "${YELLOW}📖 Review warnings above and fix if needed${NC}"
else
    echo -e "${RED}❌ $errors error(s) found${NC}"
    if [ $warnings -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $warnings warning(s) found${NC}"
    fi
    echo ""
    echo -e "${RED}Please fix the errors above before deploying${NC}"
fi

echo ""
