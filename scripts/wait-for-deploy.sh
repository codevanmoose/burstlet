#!/bin/bash

echo "⏳ Waiting for DigitalOcean deployment..."
echo "========================================"
echo ""

BACKEND_URL="https://burstlet-api-wyn4p.ondigitalocean.app"
CHECK_INTERVAL=10
TIMEOUT=600  # 10 minutes
ELAPSED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking $BACKEND_URL/health every ${CHECK_INTERVAL}s..."
echo ""

while [ $ELAPSED -lt $TIMEOUT ]; do
    # Check health endpoint
    RESPONSE=$(curl -s "$BACKEND_URL/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Check if environment variables are loaded
        HAS_DB=$(echo "$RESPONSE" | grep -o '"database":[^,}]*' | grep -o 'true\|false')
        HAS_REDIS=$(echo "$RESPONSE" | grep -o '"redis":[^,}]*' | grep -o 'true\|false')
        HAS_SUPABASE=$(echo "$RESPONSE" | grep -o '"supabase":[^,}]*' | grep -o 'true\|false')
        
        echo -ne "\r[$(date +%H:%M:%S)] Status: "
        
        if [ "$HAS_DB" = "true" ] && [ "$HAS_REDIS" = "true" ] && [ "$HAS_SUPABASE" = "true" ]; then
            echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
            echo ""
            echo "Environment variables loaded:"
            echo "- Database: ✓"
            echo "- Redis: ✓"
            echo "- Supabase: ✓"
            echo ""
            echo "$RESPONSE" | jq '.'
            exit 0
        else
            echo -ne "Waiting... DB:$HAS_DB Redis:$HAS_REDIS Supabase:$HAS_SUPABASE"
        fi
    else
        echo -ne "\r[$(date +%H:%M:%S)] Status: Backend offline, waiting..."
    fi
    
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
done

echo -e "\n${RED}❌ Timeout reached after ${TIMEOUT}s${NC}"
exit 1