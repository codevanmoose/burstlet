#!/bin/bash

# Check deployment status

echo "🔍 Checking Burstlet Deployment Status"
echo "====================================="
echo ""

# Check backend
echo "Backend Health Check:"
BACKEND_RESPONSE=$(curl -s "https://burstlet-api-wyn4p.ondigitalocean.app/health")
UPTIME=$(echo "$BACKEND_RESPONSE" | jq -r '.uptime')
UPTIME_MINUTES=$(echo "scale=2; $UPTIME / 60" | bc 2>/dev/null || echo "N/A")

echo "$BACKEND_RESPONSE" | jq '.'
echo ""
echo "📊 Backend uptime: $UPTIME_MINUTES minutes"
echo ""

# Check if services are configured
DATABASE=$(echo "$BACKEND_RESPONSE" | jq -r '.services.database')
REDIS=$(echo "$BACKEND_RESPONSE" | jq -r '.services.redis')
SUPABASE=$(echo "$BACKEND_RESPONSE" | jq -r '.services.supabase')

if [ "$DATABASE" = "true" ] && [ "$REDIS" = "true" ] && [ "$SUPABASE" = "true" ]; then
    echo "✅ All backend services are configured!"
else
    echo "⚠️  Backend services status:"
    echo "  - Database: $DATABASE"
    echo "  - Redis: $REDIS" 
    echo "  - Supabase: $SUPABASE"
    echo ""
    echo "If uptime is > 5 minutes, the new deployment hasn't taken effect yet."
fi

echo ""
echo "🔗 Quick Links:"
echo "  - Backend deployments: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/deployments"
echo "  - Frontend: https://burstlet.vercel.app"
echo "  - Vercel dashboard: https://vercel.com/dashboard"
echo ""

# Check frontend
echo "Checking Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://burstlet.vercel.app")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend returned HTTP $FRONTEND_STATUS"
fi