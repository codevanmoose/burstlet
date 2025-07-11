#!/bin/bash
# Production deployment script for Burstlet

set -e  # Exit on any error

echo "🚀 Burstlet Production Deployment"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the Burstlet root directory"
    exit 1
fi

# Check if required tools are installed
command -v railway >/dev/null 2>&1 || { 
    echo "❌ Railway CLI is not installed. Installing..."
    npm install -g @railway/cli
}

echo "✅ Environment checks passed"
echo ""

# Build the backend
echo "🔨 Building backend..."
cd backend
npm ci --production=false
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

echo ""
echo "🚂 Deploying to Railway..."

# Check if already logged in
if ! railway whoami >/dev/null 2>&1; then
    echo "Please login to Railway:"
    railway login
fi

# Check if project exists
if ! railway status >/dev/null 2>&1; then
    echo "🆕 Creating new Railway project..."
    railway init
fi

# Deploy
echo "📦 Deploying application..."
railway up --detach

# Get deployment URL
echo ""
echo "🌐 Getting deployment URL..."
RAILWAY_URL=$(railway domain 2>/dev/null || echo "")

if [ -n "$RAILWAY_URL" ]; then
    echo "✅ Deployed successfully!"
    echo "🌍 Backend URL: https://$RAILWAY_URL"
    echo ""
    
    # Test the deployment
    echo "🧪 Testing deployment..."
    sleep 10  # Wait for deployment to be ready
    
    if curl -f -s "https://$RAILWAY_URL/health" >/dev/null; then
        echo "✅ Health check passed"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Configure environment variables in Railway dashboard"
        echo "2. Update frontend NEXT_PUBLIC_API_URL to: https://$RAILWAY_URL"
        echo "3. Run database migrations"
        echo "4. Set up external services (Stripe, OAuth, etc.)"
        echo ""
        echo "🔧 Quick commands:"
        echo "  railway variables set DATABASE_URL=your-database-url"
        echo "  railway variables set JWT_SECRET=\$(openssl rand -base64 32)"
        echo "  railway logs"
        echo "  railway open"
        echo ""
    else
        echo "⚠️  Deployment completed but health check failed"
        echo "   Check logs: railway logs"
    fi
else
    echo "⚠️  Deployment may have failed. Check status:"
    echo "   railway status"
    echo "   railway logs"
fi

cd ..

echo "📚 Documentation:"
echo "  - Backend docs: https://$RAILWAY_URL/docs"
echo "  - API status: https://$RAILWAY_URL/api"
echo "  - Metrics: https://$RAILWAY_URL/metrics"
echo ""
echo "🎉 Production deployment complete!"