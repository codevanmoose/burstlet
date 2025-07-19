#!/bin/bash

# Test Frontend-Backend Integration Script
echo "🔍 Testing Burstlet Frontend-Backend Integration"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URLs
FRONTEND_URL="https://burstlet.vercel.app"
BACKEND_URL="https://burstlet-api-wyn4p.ondigitalocean.app"

echo -e "\n📍 Frontend: $FRONTEND_URL"
echo -e "📍 Backend: $BACKEND_URL\n"

# Test 1: Backend Health
echo "1. Testing Backend Health..."
health_response=$(curl -s $BACKEND_URL/health)
if echo "$health_response" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    echo "$health_response" | jq -r '.version, .message' 2>/dev/null
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Test 2: CORS Headers
echo -e "\n2. Testing CORS Configuration..."
cors_test=$(curl -s -I -X OPTIONS $BACKEND_URL/api/auth/login \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

if echo "$cors_test" | grep -q "access-control-allow-origin: $FRONTEND_URL"; then
    echo -e "${GREEN}✅ CORS properly configured${NC}"
else
    echo -e "${RED}❌ CORS not configured for frontend${NC}"
fi

# Test 3: Registration Endpoint
echo -e "\n3. Testing Registration Endpoint..."
reg_response=$(curl -s -X POST $BACKEND_URL/api/auth/register \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"email":"test@example.com","password":"Test123","name":"Test User"}')

if echo "$reg_response" | grep -q "success"; then
    echo -e "${GREEN}✅ Registration endpoint working${NC}"
    echo "$reg_response" | jq . 2>/dev/null
else
    echo -e "${RED}❌ Registration endpoint failed${NC}"
    echo "$reg_response"
fi

# Test 4: Login Endpoint
echo -e "\n4. Testing Login Endpoint..."
login_response=$(curl -s -X POST $BACKEND_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"email":"test@example.com","password":"Test123"}')

if echo "$login_response" | grep -q "success"; then
    echo -e "${GREEN}✅ Login endpoint working${NC}"
    echo "$login_response" | jq . 2>/dev/null
else
    echo -e "${RED}❌ Login endpoint failed${NC}"
    echo "$login_response"
fi

# Test 5: Frontend Loading
echo -e "\n5. Testing Frontend Loading..."
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$frontend_response" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend returned status: $frontend_response${NC}"
fi

echo -e "\n📊 Integration Test Summary"
echo "=========================="
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Visit $FRONTEND_URL/register in your browser"
echo "2. Open DevTools Console (F12)"
echo "3. Try the registration form"
echo "4. Watch for API calls and responses"
echo -e "\n${YELLOW}If you see CORS errors:${NC}"
echo "- Check that Vercel redeployed with new NEXT_PUBLIC_API_URL"
echo "- Verify the backend URL is correct in Vercel env vars"