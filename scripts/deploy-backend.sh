#!/bin/bash
# Script to deploy backend to DigitalOcean App Platform

echo "Deploying backend to DigitalOcean App Platform..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "doctl CLI is not installed. Please install it first:"
    echo "brew install doctl"
    echo "Then authenticate with: doctl auth init"
    exit 1
fi

# Create the app using the app.yaml configuration
echo "Creating DigitalOcean app..."
cd backend
doctl apps create --spec app.yaml

if [ $? -eq 0 ]; then
    echo "App created successfully!"
    
    # Get app ID
    APP_ID=$(doctl apps list --format ID --no-header | head -1)
    
    echo "App ID: $APP_ID"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://cloud.digitalocean.com/apps/$APP_ID/settings"
    echo "2. Configure environment variables:"
    echo "   - DATABASE_URL (from Supabase)"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_KEY"
    echo "   - JWT_SECRET"
    echo "   - RESEND_API_KEY"
    echo "   - OPENAI_API_KEY"
    echo "   - HAILUOAI_API_KEY"
    echo "   - MINIMAX_API_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo "   - Social media API keys"
    echo ""
    echo "3. The app will automatically deploy from GitHub"
    echo ""
    echo "App URL will be available at: https://burstlet-api-[random].ondigitalocean.app"
else
    echo "Failed to create app. Please check your DigitalOcean authentication."
    echo "Run 'doctl auth init' to authenticate."
fi