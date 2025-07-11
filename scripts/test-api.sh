#!/bin/bash
# Script to test the deployed API

API_URL="${1:-https://burstlet-api.ondigitalocean.app}"

echo "=== Testing Burstlet API ==="
echo "API URL: $API_URL"
echo ""

# Test health endpoint
echo "1. Testing /health endpoint..."
curl -s "$API_URL/health" | json_pp
echo ""

# Test base API endpoint
echo "2. Testing /api endpoint..."
curl -s "$API_URL/api" | json_pp
echo ""

# Test CORS headers
echo "3. Testing CORS headers..."
curl -I -s "$API_URL/api" -H "Origin: https://burstlet-gilt.vercel.app" | grep -E "(Access-Control|access-control)"
echo ""

echo "=== Test Complete ==="
echo ""
echo "If you see JSON responses above, the API is working!"
echo "Once you get the actual URL from DigitalOcean, run:"
echo "  ./scripts/test-api.sh https://your-actual-api-url.ondigitalocean.app"