#!/bin/bash

# Automated OAuth Setup Script
# This script helps configure OAuth providers for Burstlet

echo "🔐 OAuth Setup Automation for Burstlet"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="https://burstlet.vercel.app"
BACKEND_URL="https://burstlet-backend-url.ondigitalocean.app"  # Update after deployment
DIGITALOCEAN_APP_ID="41fe1a5b-84b8-4cf8-a69f-5330c7ed7518"

# Function to display OAuth provider instructions
setup_google_oauth() {
    echo ""
    echo -e "${BLUE}🔧 Google OAuth Setup${NC}"
    echo "======================"
    echo ""
    echo "1. Go to: https://console.cloud.google.com"
    echo "2. Create new project or select existing"
    echo "3. Enable APIs:"
    echo "   - Google+ API (for basic profile)"
    echo "   - YouTube Data API v3 (for video uploads)"
    echo "4. Create credentials:"
    echo "   - Go to Credentials > Create Credentials > OAuth 2.0 Client ID"
    echo "   - Application type: Web application"
    echo "   - Name: Burstlet Production"
    echo "   - Authorized redirect URIs:"
    echo "     - $FRONTEND_URL/api/auth/callback/google"
    echo "     - http://localhost:3000/api/auth/callback/google (for dev)"
    echo "5. Copy the Client ID and Client Secret"
    echo ""
    echo -e "${YELLOW}Environment Variables to Add:${NC}"
    echo "Frontend (Vercel):"
    echo "  GOOGLE_CLIENT_ID=your_client_id"
    echo "  GOOGLE_CLIENT_SECRET=your_client_secret"
    echo ""
    echo "Backend (DigitalOcean):"
    echo "  YOUTUBE_CLIENT_ID=your_client_id (same as Google)"
    echo "  YOUTUBE_CLIENT_SECRET=your_client_secret (same as Google)"
    echo ""
    read -p "Press Enter to continue to next provider..."
}

setup_tiktok_oauth() {
    echo ""
    echo -e "${BLUE}🔧 TikTok OAuth Setup${NC}"
    echo "====================="
    echo ""
    echo "1. Go to: https://developers.tiktok.com"
    echo "2. Create app in 'Manage apps'"
    echo "3. Add products:"
    echo "   - Login Kit (for user authentication)"
    echo "   - Content Posting API (for video uploads)"
    echo "4. Configure app:"
    echo "   - Redirect URIs: $BACKEND_URL/api/platforms/tiktok/callback"
    echo "   - Scopes: user.info.basic, video.upload"
    echo "   - Platform: Web"
    echo "5. Submit for review (required for production)"
    echo ""
    echo -e "${YELLOW}Environment Variables to Add:${NC}"
    echo "Backend (DigitalOcean):"
    echo "  TIKTOK_CLIENT_ID=your_client_id"
    echo "  TIKTOK_CLIENT_SECRET=your_client_secret"
    echo ""
    echo -e "${RED}⚠️  Important: TikTok requires app review for production use${NC}"
    echo "   - Review process can take 1-2 weeks"
    echo "   - Provide detailed app description and use cases"
    echo "   - Include privacy policy and terms of service"
    echo ""
    read -p "Press Enter to continue to next provider..."
}

setup_instagram_oauth() {
    echo ""
    echo -e "${BLUE}🔧 Instagram OAuth Setup${NC}"
    echo "========================"
    echo ""
    echo "1. Go to: https://developers.facebook.com"
    echo "2. Create app > Consumer type"
    echo "3. Add 'Instagram Basic Display' product"
    echo "4. Configure Instagram Basic Display:"
    echo "   - Valid OAuth Redirect URIs: $BACKEND_URL/api/platforms/instagram/callback"
    echo "   - Deauthorize Callback URL: $BACKEND_URL/api/platforms/instagram/deauth"
    echo "   - Data Deletion Request URL: $BACKEND_URL/api/platforms/instagram/deletion"
    echo "5. Add Instagram Test Users for development"
    echo "6. Submit for review for production access"
    echo ""
    echo -e "${YELLOW}Environment Variables to Add:${NC}"
    echo "Backend (DigitalOcean):"
    echo "  INSTAGRAM_CLIENT_ID=your_app_id"
    echo "  INSTAGRAM_CLIENT_SECRET=your_app_secret"
    echo ""
    echo -e "${RED}⚠️  Important: Instagram requires app review for production${NC}"
    echo "   - Basic Display API is sufficient for profile access"
    echo "   - Content Publishing API requires additional review"
    echo ""
    read -p "Press Enter to continue to next provider..."
}

setup_twitter_oauth() {
    echo ""
    echo -e "${BLUE}🔧 Twitter/X OAuth Setup${NC}"
    echo "========================"
    echo ""
    echo "1. Go to: https://developer.twitter.com"
    echo "2. Create project and app"
    echo "3. Set up OAuth 2.0 settings:"
    echo "   - Type: Web App, Automated App or Bot"
    echo "   - Callback URL: $BACKEND_URL/api/platforms/twitter/callback"
    echo "   - Website URL: $FRONTEND_URL"
    echo "4. Request elevated access for:"
    echo "   - Media upload (images, videos)"
    echo "   - Tweet creation"
    echo "5. Configure permissions:"
    echo "   - Read and Write permissions"
    echo "   - Direct Message permissions (if needed)"
    echo ""
    echo -e "${YELLOW}Environment Variables to Add:${NC}"
    echo "Backend (DigitalOcean):"
    echo "  TWITTER_CLIENT_ID=your_client_id"
    echo "  TWITTER_CLIENT_SECRET=your_client_secret"
    echo ""
    echo -e "${RED}⚠️  Important: Twitter requires approval for elevated access${NC}"
    echo "   - Basic tier has limited functionality"
    echo "   - Elevated access needed for media uploads"
    echo "   - Can take 1-7 days for approval"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to generate environment variable summary
generate_env_summary() {
    echo ""
    echo -e "${GREEN}📋 Environment Variables Summary${NC}"
    echo "==============================="
    echo ""
    echo "Add these to Vercel (Frontend):"
    echo "--------------------------------"
    echo "GOOGLE_CLIENT_ID=your_google_client_id"
    echo "GOOGLE_CLIENT_SECRET=your_google_client_secret"
    echo ""
    echo "Add these to DigitalOcean (Backend):"
    echo "------------------------------------"
    echo "YOUTUBE_CLIENT_ID=your_google_client_id"
    echo "YOUTUBE_CLIENT_SECRET=your_google_client_secret"
    echo "TIKTOK_CLIENT_ID=your_tiktok_client_id"
    echo "TIKTOK_CLIENT_SECRET=your_tiktok_client_secret"
    echo "INSTAGRAM_CLIENT_ID=your_instagram_client_id"
    echo "INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret"
    echo "TWITTER_CLIENT_ID=your_twitter_client_id"
    echo "TWITTER_CLIENT_SECRET=your_twitter_client_secret"
    echo ""
    echo -e "${YELLOW}📝 Quick Links:${NC}"
    echo "Vercel Settings: https://vercel.com/dashboard"
    echo "DigitalOcean Settings: https://cloud.digitalocean.com/apps/$DIGITALOCEAN_APP_ID/settings"
    echo ""
}

# Function to check OAuth setup status
check_oauth_status() {
    echo ""
    echo -e "${BLUE}🔍 Checking OAuth Setup Status${NC}"
    echo "==============================="
    echo ""
    
    # Check if backend is accessible
    echo -n "Checking backend health... "
    if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Online${NC}"
        
        # Get OAuth status from health check
        response=$(curl -s "$BACKEND_URL/health" 2>/dev/null)
        
        echo ""
        echo "OAuth Provider Status:"
        echo "----------------------"
        
        # Check each provider
        providers=("google" "tiktok" "instagram" "twitter")
        for provider in "${providers[@]}"; do
            status=$(echo "$response" | jq -r ".services.${provider}" 2>/dev/null)
            if [ "$status" = "configured" ]; then
                echo -e "  $provider: ${GREEN}✅ Configured${NC}"
            else
                echo -e "  $provider: ${RED}❌ Not configured${NC}"
            fi
        done
    else
        echo -e "${RED}❌ Offline${NC}"
        echo "Backend is not accessible. Please check deployment status."
    fi
    
    echo ""
}

# Function to test OAuth flows
test_oauth_flows() {
    echo ""
    echo -e "${BLUE}🧪 Testing OAuth Flows${NC}"
    echo "====================="
    echo ""
    
    echo "Test these OAuth flows in your browser:"
    echo "1. Google OAuth: $FRONTEND_URL/api/auth/signin/google"
    echo "2. TikTok OAuth: $BACKEND_URL/api/platforms/tiktok/auth"
    echo "3. Instagram OAuth: $BACKEND_URL/api/platforms/instagram/auth"
    echo "4. Twitter OAuth: $BACKEND_URL/api/platforms/twitter/auth"
    echo ""
    echo -e "${YELLOW}💡 Tips for testing:${NC}"
    echo "- Use incognito/private browsing mode"
    echo "- Clear browser cookies if issues occur"
    echo "- Check browser developer tools for error messages"
    echo "- Verify redirect URIs match exactly"
    echo ""
}

# Main menu
show_menu() {
    echo ""
    echo -e "${GREEN}🚀 OAuth Setup Options${NC}"
    echo "======================"
    echo "1. Google OAuth Setup (Required for login)"
    echo "2. TikTok OAuth Setup"
    echo "3. Instagram OAuth Setup"
    echo "4. Twitter/X OAuth Setup"
    echo "5. View Environment Variables Summary"
    echo "6. Check OAuth Status"
    echo "7. Test OAuth Flows"
    echo "8. Exit"
    echo ""
    read -p "Choose an option (1-8): " choice
    
    case $choice in
        1) setup_google_oauth ;;
        2) setup_tiktok_oauth ;;
        3) setup_instagram_oauth ;;
        4) setup_twitter_oauth ;;
        5) generate_env_summary ;;
        6) check_oauth_status ;;
        7) test_oauth_flows ;;
        8) echo "Goodbye! 👋"; exit 0 ;;
        *) echo -e "${RED}Invalid option. Please try again.${NC}" ;;
    esac
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found. Installing for JSON parsing...${NC}"
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo -e "${RED}Please install jq manually: https://stedolan.github.io/jq/download/${NC}"
    fi
fi

# Main loop
while true; do
    show_menu
done