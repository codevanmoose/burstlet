#!/bin/bash

# Test Backend Environment Variables
# This script helps diagnose environment variable issues on the deployed backend

echo "🔍 Testing Backend Environment Variables"
echo "======================================"
echo ""

BACKEND_URL="https://burstlet-api-wyn4p.ondigitalocean.app"

echo "1. Testing Health Endpoint:"
echo "-------------------------"
curl -s "$BACKEND_URL/health" | jq '.'

echo ""
echo "2. Testing API Status:"
echo "--------------------"
curl -s "$BACKEND_URL/api/status" | jq '.'

echo ""
echo "3. Testing CORS Headers:"
echo "----------------------"
echo "From Vercel origin:"
curl -s -I -X OPTIONS \
  -H "Origin: https://burstlet.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  "$BACKEND_URL/api/status" 2>&1 | grep -E "Access-Control|HTTP"

echo ""
echo "From localhost origin:"
curl -s -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  "$BACKEND_URL/api/status" 2>&1 | grep -E "Access-Control|HTTP"

echo ""
echo "4. Environment Variable Status:"
echo "-----------------------------"
echo "Based on the health check, these variables need attention:"
echo ""

# Parse health check for missing services
HEALTH_DATA=$(curl -s "$BACKEND_URL/health")
DATABASE_STATUS=$(echo "$HEALTH_DATA" | jq -r '.services.database')
REDIS_STATUS=$(echo "$HEALTH_DATA" | jq -r '.services.redis')
SUPABASE_STATUS=$(echo "$HEALTH_DATA" | jq -r '.services.supabase')

if [ "$DATABASE_STATUS" = "false" ]; then
  echo "❌ DATABASE_URL is not configured or empty"
else
  echo "✅ DATABASE_URL is configured"
fi

if [ "$REDIS_STATUS" = "false" ]; then
  echo "❌ REDIS_URL is not configured or empty"
else
  echo "✅ REDIS_URL is configured"
fi

if [ "$SUPABASE_STATUS" = "false" ]; then
  echo "❌ SUPABASE_URL is not configured or empty"
else
  echo "✅ SUPABASE_URL is configured"
fi

echo ""
echo "📋 Next Steps:"
echo "-------------"
echo "1. Go to: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings"
echo "2. Click 'Environment Variables' tab"
echo "3. Check if the missing variables exist but are empty"
echo "4. If empty, add the correct values:"
echo "   - DATABASE_URL: postgresql://postgres:[password]@db.cmfdlebyqgjifwmfvquu.supabase.co:5432/postgres"
echo "   - REDIS_URL: Get from Redis Cloud dashboard"
echo "   - SUPABASE_URL: https://cmfdlebyqgjifwmfvquu.supabase.co"
echo ""
echo "5. Also verify these exist and have values:"
echo "   - SUPABASE_SERVICE_KEY"
echo "   - SUPABASE_ANON_KEY"
echo ""