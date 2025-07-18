#!/bin/bash

# Deployment Verification Script
# This script runs a comprehensive check of the entire Burstlet deployment

echo "✅ Burstlet Deployment Verification"
echo "=================================="

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

# Counters for pass/fail
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local check_name=$1
    local check_command=$2
    local is_critical=${3:-true}
    
    ((TOTAL_CHECKS++))
    echo -n "[$TOTAL_CHECKS] $check_name... "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        if [ "$is_critical" = true ]; then
            echo -e "${RED}❌ FAIL (Critical)${NC}"
        else
            echo -e "${YELLOW}⚠️  FAIL (Non-critical)${NC}"
        fi
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Function to run a manual check
run_manual_check() {
    local check_name=$1
    local instructions=$2
    
    ((TOTAL_CHECKS++))
    echo ""
    echo -e "${BLUE}[$TOTAL_CHECKS] $check_name${NC}"
    echo "Instructions: $instructions"
    echo -n "Did this check pass? (y/n): "
    read -r response
    
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo -e "${GREEN}✅ PASS (Manual)${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}❌ FAIL (Manual)${NC}"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Function to check URL accessibility
check_url() {
    local url=$1
    curl -s --head --request GET "$url" | grep -E "200|301|302" > /dev/null
}

# Function to check JSON response
check_json_response() {
    local url=$1
    local key=$2
    local expected_value=$3
    
    response=$(curl -s "$url" 2>/dev/null)
    actual_value=$(echo "$response" | jq -r ".$key" 2>/dev/null)
    [ "$actual_value" = "$expected_value" ]
}

# Function to check environment variables
check_env_vars() {
    local backend_url=$1
    response=$(curl -s "$backend_url/health" 2>/dev/null)
    env_status=$(echo "$response" | jq -r '.environment_variables.status' 2>/dev/null)
    [ "$env_status" = "complete" ]
}

echo ""
echo "🔍 Starting Deployment Verification Checks"
echo "==========================================="

# Phase 1: Infrastructure Checks
echo ""
echo -e "${BLUE}Phase 1: Infrastructure Checks${NC}"
echo "------------------------------"

run_check "Frontend accessibility" "check_url $FRONTEND_URL"
run_check "Backend accessibility" "check_url $BACKEND_URL"
run_check "Backend health endpoint" "check_json_response $BACKEND_URL/health status healthy"
run_check "Frontend loads without errors" "curl -s $FRONTEND_URL | grep -q 'Burstlet'"

# Phase 2: Configuration Checks
echo ""
echo -e "${BLUE}Phase 2: Configuration Checks${NC}"
echo "-----------------------------"

run_check "Environment variables complete" "check_env_vars $BACKEND_URL"
run_check "Database connection" "check_json_response $BACKEND_URL/health database connected"
run_check "API status endpoint" "check_json_response $BACKEND_URL/api/v1/status message 'Burstlet API is running'"

# Phase 3: Authentication Checks
echo ""
echo -e "${BLUE}Phase 3: Authentication Checks${NC}"
echo "------------------------------"

run_manual_check "Google OAuth login" "Try logging in at $FRONTEND_URL with Google account"
run_manual_check "User registration" "Try registering a new account at $FRONTEND_URL"
run_manual_check "JWT token generation" "After login, check that user session persists on page refresh"

# Phase 4: Core Functionality Checks
echo ""
echo -e "${BLUE}Phase 4: Core Functionality Checks${NC}"
echo "--------------------------------"

run_manual_check "Dashboard loads" "Navigate to dashboard and verify widgets load correctly"
run_manual_check "AI generation interface" "Try generating a video or blog post (test mode)"
run_manual_check "Content management" "Create, edit, and delete content items"
run_manual_check "Settings page" "Update user profile and settings"

# Phase 5: Integration Checks
echo ""
echo -e "${BLUE}Phase 5: Integration Checks${NC}"
echo "-------------------------"

run_check "OpenAI API key configured" "check_json_response $BACKEND_URL/health services.openai configured" false
run_check "HailuoAI API key configured" "check_json_response $BACKEND_URL/health services.hailuoai configured" false
run_check "Stripe API key configured" "check_json_response $BACKEND_URL/health services.stripe configured" false
run_check "Resend API key configured" "check_json_response $BACKEND_URL/health services.resend configured" false

# Phase 6: Performance Checks
echo ""
echo -e "${BLUE}Phase 6: Performance Checks${NC}"
echo "-------------------------"

run_check "Frontend response time < 3s" "timeout 3 curl -s $FRONTEND_URL > /dev/null"
run_check "Backend response time < 2s" "timeout 2 curl -s $BACKEND_URL/health > /dev/null"
run_manual_check "Page load performance" "Check that pages load quickly and smoothly"

# Phase 7: Security Checks
echo ""
echo -e "${BLUE}Phase 7: Security Checks${NC}"
echo "----------------------"

run_check "HTTPS enforced on frontend" "curl -s $FRONTEND_URL | grep -q 'https://'"
run_check "Security headers present" "curl -s -I $BACKEND_URL/health | grep -i 'x-frame-options\\|content-security-policy\\|x-content-type-options'"
run_manual_check "Rate limiting active" "Try making many rapid requests to API endpoints"

# Phase 8: Monitoring Checks
echo ""
echo -e "${BLUE}Phase 8: Monitoring Checks${NC}"
echo "------------------------"

run_manual_check "Error tracking setup" "Check that errors are being logged and tracked"
run_manual_check "Uptime monitoring" "Verify that uptime monitoring is configured"
run_manual_check "Analytics tracking" "Check that user analytics are being collected"

# Phase 9: Business Logic Checks
echo ""
echo -e "${BLUE}Phase 9: Business Logic Checks${NC}"
echo "----------------------------"

run_manual_check "Billing page loads" "Navigate to billing page and verify subscription options"
run_manual_check "Analytics dashboard" "Check that analytics show meaningful data"
run_manual_check "User onboarding flow" "Complete the new user onboarding process"

# Phase 10: Production Readiness
echo ""
echo -e "${BLUE}Phase 10: Production Readiness${NC}"
echo "----------------------------"

run_manual_check "Custom domain configured" "Verify that burstlet.com resolves correctly"
run_manual_check "SSL certificate valid" "Check that HTTPS is working without warnings"
run_manual_check "Database backups enabled" "Verify that database backups are scheduled"
run_manual_check "Customer support ready" "Check that support email and documentation are ready"

# Final Summary
echo ""
echo "📊 Deployment Verification Summary"
echo "================================="
echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

# Calculate success rate
success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ $success_rate -ge 95 ]; then
    echo -e "${GREEN}🎉 EXCELLENT! ($success_rate%) - Ready for production launch!${NC}"
elif [ $success_rate -ge 85 ]; then
    echo -e "${YELLOW}⚠️  GOOD ($success_rate%) - Minor issues to address before launch${NC}"
elif [ $success_rate -ge 70 ]; then
    echo -e "${YELLOW}⚠️  NEEDS WORK ($success_rate%) - Several issues to fix${NC}"
else
    echo -e "${RED}❌ CRITICAL ISSUES ($success_rate%) - Not ready for production${NC}"
fi

echo ""
echo "🔗 Next Steps:"
if [ $FAILED_CHECKS -gt 0 ]; then
    echo "1. Review and fix failed checks above"
    echo "2. Run verification script again"
    echo "3. Test critical user flows manually"
    echo "4. Schedule soft launch with beta users"
else
    echo "1. ✅ All checks passed! Ready for production"
    echo "2. 🚀 Begin customer acquisition campaigns"
    echo "3. 📊 Monitor metrics and user feedback"
    echo "4. 🔄 Iterate based on real user data"
fi

echo ""
echo "📋 Quick References:"
echo "Frontend: $FRONTEND_URL"
echo "Backend Settings: https://cloud.digitalocean.com/apps/$DIGITALOCEAN_APP_ID/settings"
echo "Health Check: $BACKEND_URL/health"
echo "Monitoring: ./scripts/production-monitor.sh"
echo ""
echo "🎯 Remember: Success is measured by customer satisfaction!"

# Return appropriate exit code
if [ $success_rate -ge 95 ]; then
    exit 0
elif [ $success_rate -ge 70 ]; then
    exit 1
else
    exit 2
fi