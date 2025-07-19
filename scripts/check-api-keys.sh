#!/bin/bash

# Check API Keys Configuration Script
echo "🔍 Checking API Keys Configuration"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_URL="https://burstlet-api-wyn4p.ondigitalocean.app"

# Function to check API key status
check_api_key() {
    local key_name=$1
    local service_name=$2
    local required=$3
    
    echo -n "Checking $service_name... "
    
    # Get the env debug info
    response=$(curl -s "$BACKEND_URL/api/debug/env" 2>/dev/null)
    
    if echo "$response" | jq -r '.keys[]' 2>/dev/null | grep -q "^${key_name}$"; then
        echo -e "${GREEN}✅ Configured${NC}"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}❌ Missing (REQUIRED)${NC}"
        else
            echo -e "${YELLOW}⚠️  Missing (Optional)${NC}"
        fi
        return 1
    fi
}

echo -e "\n${BLUE}🤖 AI Service Keys:${NC}"
echo "-------------------"
check_api_key "OPENAI_API_KEY" "OpenAI (Blog Generation)" "required"
check_api_key "HAILUOAI_API_KEY" "HailuoAI (Video Generation)" "required"
check_api_key "MINIMAX_API_KEY" "MiniMax (Audio Generation)" "required"

echo -e "\n${BLUE}💳 Payment Processing:${NC}"
echo "---------------------"
check_api_key "STRIPE_SECRET_KEY" "Stripe Secret Key" "required"
check_api_key "STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret" "required"

echo -e "\n${BLUE}📧 Email Service:${NC}"
echo "----------------"
check_api_key "RESEND_API_KEY" "Resend (Email)" "required"

echo -e "\n${BLUE}📱 Social Media OAuth:${NC}"
echo "--------------------"
check_api_key "YOUTUBE_CLIENT_ID" "YouTube Client ID" "optional"
check_api_key "YOUTUBE_CLIENT_SECRET" "YouTube Client Secret" "optional"
check_api_key "TIKTOK_CLIENT_ID" "TikTok Client ID" "optional"
check_api_key "TIKTOK_CLIENT_SECRET" "TikTok Client Secret" "optional"
check_api_key "INSTAGRAM_CLIENT_ID" "Instagram Client ID" "optional"
check_api_key "INSTAGRAM_CLIENT_SECRET" "Instagram Client Secret" "optional"
check_api_key "TWITTER_CLIENT_ID" "Twitter Client ID" "optional"
check_api_key "TWITTER_CLIENT_SECRET" "Twitter Client Secret" "optional"

echo -e "\n${BLUE}✅ Already Configured:${NC}"
echo "--------------------"
echo -e "${GREEN}✓${NC} Database URL"
echo -e "${GREEN}✓${NC} Redis URL"
echo -e "${GREEN}✓${NC} Supabase (URL, Service Key, Anon Key)"
echo -e "${GREEN}✓${NC} Authentication Secrets (JWT, Session, CSRF)"
echo -e "${GREEN}✓${NC} Frontend URL"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "-------------"
echo "1. Get API keys for missing services (see docs/api-keys-setup.md)"
echo "2. Add them to DigitalOcean: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings"
echo "3. Wait for automatic redeployment"
echo "4. Run this script again to verify"

echo -e "\n${YELLOW}💡 Priority Order:${NC}"
echo "1. OpenAI - Required for blog generation"
echo "2. HailuoAI - Required for video generation" 
echo "3. Stripe - Required for payments"
echo "4. Resend - Required for user emails"
echo "5. Social OAuth - Optional but recommended for full functionality"