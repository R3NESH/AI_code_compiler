#!/bin/bash
# Render Deployment Helper Script

set -e

echo "🚀 Render Deployment Helper"
echo "============================"
echo ""

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "✅ render.yaml found"
echo ""

# Check Git status
if [ -d ".git" ]; then
    echo "📋 Git Status:"
    git status --short
    echo ""
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "⚠️  Warning: You have uncommitted changes"
        echo ""
        read -p "Do you want to commit and push? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_msg
            git add .
            git commit -m "$commit_msg"
            git push
            echo "✅ Changes committed and pushed"
        fi
    else
        echo "✅ No uncommitted changes"
    fi
else
    echo "⚠️  Warning: Not a git repository"
    echo "Initialize git with: git init"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub/GitLab repository"
echo "4. Render will detect render.yaml automatically"
echo "5. Set environment variables:"
echo "   - OPENAI_API_KEY (required for AI features)"
echo "   - ANTHROPIC_API_KEY (optional alternative)"
echo "6. Click 'Apply' to deploy"
echo ""
echo "🔗 Useful Links:"
echo "   Dashboard: https://dashboard.render.com"
echo "   Docs: https://render.com/docs/blueprint-spec"
echo ""
