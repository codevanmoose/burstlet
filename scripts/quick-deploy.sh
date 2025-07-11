#!/bin/bash
# Quick deployment script for Burstlet backend

echo "=== Burstlet Quick Deploy Script ==="
echo ""
echo "This script will guide you through deploying the backend."
echo ""

# Check current directory
if [ ! -f "backend/package.json" ]; then
    echo "Error: Please run this script from the Burstlet root directory"
    exit 1
fi

echo "Choose deployment platform:"
echo "1) Railway (Recommended - Easy & Free tier)"
echo "2) Render.com (Alternative - Also easy)"
echo "3) Fly.io (Advanced - More control)"
echo "4) Heroku (Classic option)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "=== Railway Deployment ==="
        echo ""
        echo "1. First, login to Railway:"
        echo "   railway login"
        echo ""
        echo "2. Then run these commands:"
        echo "   cd backend"
        echo "   railway init"
        echo "   railway up"
        echo ""
        echo "3. Open Railway dashboard to add environment variables:"
        echo "   railway open"
        echo ""
        echo "Would you like to start the deployment now? (y/n)"
        read -p "> " start
        if [ "$start" = "y" ]; then
            cd backend
            railway login
            echo ""
            echo "Now initializing Railway project..."
            railway init
            echo ""
            echo "Deploying to Railway..."
            railway up
            echo ""
            echo "Opening dashboard for environment variables..."
            railway open
        fi
        ;;
    2)
        echo ""
        echo "=== Render.com Deployment ==="
        echo ""
        echo "1. Go to https://render.com"
        echo "2. Sign up/Login with GitHub"
        echo "3. New > Web Service"
        echo "4. Connect repository: codevanmoose/burstlet"
        echo "5. Configure:"
        echo "   - Name: burstlet-api"
        echo "   - Root Directory: backend"
        echo "   - Build Command: npm ci && npm run build"
        echo "   - Start Command: npm start"
        echo "6. Add environment variables in dashboard"
        echo "7. Click 'Create Web Service'"
        echo ""
        echo "Press Enter to open Render.com..."
        read
        open "https://render.com"
        ;;
    3)
        echo ""
        echo "=== Fly.io Deployment ==="
        echo ""
        echo "1. Install Fly CLI:"
        echo "   curl -L https://fly.io/install.sh | sh"
        echo ""
        echo "2. Login:"
        echo "   flyctl auth login"
        echo ""
        echo "3. Deploy:"
        echo "   cd backend"
        echo "   flyctl launch"
        echo "   flyctl deploy"
        echo ""
        echo "4. Set environment variables:"
        echo "   flyctl secrets set DATABASE_URL=..."
        echo ""
        ;;
    4)
        echo ""
        echo "=== Heroku Deployment ==="
        echo ""
        echo "1. Install Heroku CLI"
        echo "2. Login: heroku login"
        echo "3. Create app: heroku create burstlet-api"
        echo "4. Deploy:"
        echo "   cd backend"
        echo "   git push heroku main"
        echo "5. Set environment variables:"
        echo "   heroku config:set DATABASE_URL=..."
        echo ""
        ;;
esac

echo ""
echo "=== Environment Variables Needed ==="
echo ""
echo "No matter which platform you choose, you'll need these:"
echo ""
echo "DATABASE_URL=postgresql://postgres:[password]@db.cmfdlebyqgjifwmfvquu.supabase.co:5432/postgres"
echo "SUPABASE_URL=https://cmfdlebyqgjifwmfvquu.supabase.co"
echo "SUPABASE_SERVICE_KEY=[from earlier setup]"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "NODE_ENV=production"
echo "PORT=3001"
echo ""
echo "Get the full list with: ./scripts/backend-env-setup.sh"
echo ""
echo "=== After Deployment ==="
echo ""
echo "1. Get your backend URL from the platform"
echo "2. Update frontend environment:"
echo "   cd frontend"
echo "   vercel env add NEXT_PUBLIC_API_URL production"
echo "   [Enter your backend URL]"
echo "3. Redeploy frontend to use new API URL"
echo ""