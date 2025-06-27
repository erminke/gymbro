#!/bin/bash

echo "🚀 Gymbro Deployment Helper"
echo "=========================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Gymbro fitness tracker"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Create a GitHub repository"
echo "2. Add remote: git remote add origin https://github.com/yourusername/gymbro.git" 
echo "3. Push code: git push -u origin main"
echo "4. Go to https://railway.app and deploy!"
echo ""
echo "📱 For production deployment:"
echo "- Update GYMBRO_API_URL in config.js to your Railway backend URL"
echo "- Set JWT_SECRET environment variable in Railway"
echo "- Set FRONTEND_URL environment variable in Railway"
echo ""
echo "🎉 Your Gymbro app is ready for deployment!"
