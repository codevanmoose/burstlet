#!/bin/bash

# Production Monitoring Script
# This script monitors the health and status of Burstlet in production

echo "🔍 Burstlet Production Monitoring Dashboard"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs - will be updated once backend is deployed
FRONTEND_URL="https://burstlet.vercel.app"
BACKEND_URL="https://burstlet-api-wyn4p.ondigitalocean.app"

# Function to check URL status
check_url() {
    local url=$1
    local service_name=$2
    
    echo -n "Checking $service_name... "
    
    # Check if URL is accessible
    if curl -s --head --request GET "$url" | grep "HTTP/2 200\|200 OK" > /dev/null; then
        echo -e "${GREEN}✅ ONLINE${NC}"
        return 0
    else
        echo -e "${RED}❌ OFFLINE${NC}"
        return 1
    fi
}

# Function to check API health
check_api_health() {
    local url=$1
    
    echo -n "Checking API health... "
    
    # Try to get health check response
    response=$(curl -s "$url/health" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$response" | grep -q "healthy"; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        
        # Parse and display detailed health info
        echo "  Health Details:"
        echo "$response" | jq . 2>/dev/null || echo "  Raw response: $response"
        return 0
    else
        echo -e "${RED}❌ UNHEALTHY${NC}"
        echo "  Error: Unable to reach health endpoint"
        return 1
    fi
}

# Function to check environment variables status
check_env_vars() {
    local backend_url=$1
    
    echo -n "Checking environment variables... "
    
    # Get health check response and extract env var status
    response=$(curl -s "$backend_url/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        env_status=$(echo "$response" | jq -r '.environment_variables.status' 2>/dev/null)
        missing_count=$(echo "$response" | jq -r '.environment_variables.missing' 2>/dev/null)
        
        if [ "$env_status" = "complete" ]; then
            echo -e "${GREEN}✅ ALL CONFIGURED${NC}"
            return 0
        elif [ "$env_status" = "incomplete" ]; then
            echo -e "${YELLOW}⚠️  INCOMPLETE (${missing_count} missing)${NC}"
            echo "  Missing variables:"
            echo "$response" | jq -r '.environment_variables.missing_variables[]' 2>/dev/null | sed 's/^/    - /'
            return 1
        else
            echo -e "${RED}❌ UNKNOWN STATUS${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ CANNOT CHECK${NC}"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    local backend_url=$1
    
    echo -n "Checking database... "
    
    # Get health check response and extract database status
    response=$(curl -s "$backend_url/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        db_status=$(echo "$response" | jq -r '.database' 2>/dev/null)
        
        if [ "$db_status" = "connected" ]; then
            echo -e "${GREEN}✅ CONNECTED${NC}"
            return 0
        else
            echo -e "${RED}❌ NOT CONNECTED${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ CANNOT CHECK${NC}"
        return 1
    fi
}

# Function to check third-party services
check_services() {
    local backend_url=$1
    
    echo "Checking third-party services:"
    
    # Get health check response and extract service status
    response=$(curl -s "$backend_url/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        services=$(echo "$response" | jq -r '.services' 2>/dev/null)
        
        echo "$services" | jq -r 'to_entries[] | "  \(.key): \(.value)"' 2>/dev/null | while read -r line; do
            service_name=$(echo "$line" | cut -d':' -f1)
            service_status=$(echo "$line" | cut -d':' -f2 | xargs)
            
            if [ "$service_status" = "configured" ]; then
                echo -e "  $service_name: ${GREEN}✅ CONFIGURED${NC}"
            else
                echo -e "  $service_name: ${RED}❌ NOT CONFIGURED${NC}"
            fi
        done
    else
        echo -e "  ${RED}❌ CANNOT CHECK SERVICES${NC}"
    fi
}

# Function to run performance checks
check_performance() {
    local frontend_url=$1
    local backend_url=$2
    
    echo ""
    echo "⚡ Performance Checks:"
    echo "--------------------"
    
    # Check frontend response time
    echo -n "Frontend response time... "
    frontend_time=$(curl -o /dev/null -s -w '%{time_total}' "$frontend_url" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${frontend_time}s${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    # Check backend response time
    echo -n "Backend response time... "
    backend_time=$(curl -o /dev/null -s -w '%{time_total}' "$backend_url/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${backend_time}s${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
}

# Main monitoring function
run_monitoring() {
    echo ""
    echo "🌐 Service Status:"
    echo "----------------"
    
    # Check frontend
    check_url "$FRONTEND_URL" "Frontend"
    frontend_status=$?
    
    # Check backend
    check_url "$BACKEND_URL" "Backend"
    backend_status=$?
    
    echo ""
    echo "🔧 Backend Health:"
    echo "----------------"
    
    if [ $backend_status -eq 0 ]; then
        check_api_health "$BACKEND_URL"
        check_env_vars "$BACKEND_URL"
        check_database "$BACKEND_URL"
        echo ""
        check_services "$BACKEND_URL"
    else
        echo -e "${RED}❌ Backend is offline - cannot perform health checks${NC}"
    fi
    
    # Performance checks
    check_performance "$FRONTEND_URL" "$BACKEND_URL"
    
    echo ""
    echo "📊 Summary:"
    echo "----------"
    
    if [ $frontend_status -eq 0 ] && [ $backend_status -eq 0 ]; then
        echo -e "${GREEN}✅ All services are online${NC}"
    elif [ $frontend_status -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Frontend online, backend offline${NC}"
    elif [ $backend_status -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Backend online, frontend offline${NC}"
    else
        echo -e "${RED}❌ All services are offline${NC}"
    fi
}

# Function to watch services continuously
watch_services() {
    echo "🔄 Starting continuous monitoring (Press Ctrl+C to stop)..."
    echo ""
    
    while true; do
        clear
        echo "🔍 Burstlet Production Monitoring Dashboard"
        echo "=========================================="
        echo "Last updated: $(date)"
        echo ""
        
        run_monitoring
        
        echo ""
        echo "Next check in 30 seconds..."
        sleep 30
    done
}

# Check if we should run in watch mode
if [ "$1" = "--watch" ] || [ "$1" = "-w" ]; then
    watch_services
else
    run_monitoring
fi

echo ""
echo "🔗 Quick Links:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend Settings: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518"
echo "  Health Check: $BACKEND_URL/health"
echo ""
echo "💡 Tips:"
echo "  - Run with --watch flag for continuous monitoring"
echo "  - Update BACKEND_URL variable once backend is deployed"
echo "  - Check deployment logs if services are offline"