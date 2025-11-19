#!/bin/bash

# Database Configuration Verification Script
# This script helps verify DATABASE_URL configuration in Vercel

echo "=========================================="
echo "Database Configuration Verification"
echo "=========================================="
echo ""

PRODUCTION_URL="https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app"

echo "Testing production API endpoints..."
echo ""

# Test 1: Check debug-env endpoint
echo "1. Checking environment variable configuration..."
DEBUG_RESPONSE=$(curl -s "${PRODUCTION_URL}/api/debug-env" 2>/dev/null)

if echo "$DEBUG_RESPONSE" | grep -q "DATABASE_URL"; then
    if echo "$DEBUG_RESPONSE" | grep -q '"exists":true'; then
        echo "   ✅ DATABASE_URL is configured"
    else
        echo "   ❌ DATABASE_URL is NOT configured"
        echo "   Response: $DEBUG_RESPONSE"
    fi
else
    echo "   ⚠️  Debug endpoint not available (may need deployment)"
fi

echo ""

# Test 2: Check rooms API
echo "2. Testing Rooms API..."
ROOMS_RESPONSE=$(curl -s "${PRODUCTION_URL}/api/rooms" 2>/dev/null)

if echo "$ROOMS_RESPONSE" | grep -q "DATABASE_URL environment variable is not set"; then
    echo "   ❌ DATABASE_URL not accessible - API returns error"
elif echo "$ROOMS_RESPONSE" | grep -q '"error"'; then
    echo "   ⚠️  API returns error (may be database connection issue)"
    echo "   Response: $(echo "$ROOMS_RESPONSE" | head -c 200)"
else
    echo "   ✅ Rooms API responding (database may be configured)"
fi

echo ""

# Test 3: Check restaurant menu API
echo "3. Testing Restaurant Menu API..."
MENU_RESPONSE=$(curl -s "${PRODUCTION_URL}/api/restaurant/menu" 2>/dev/null)

if echo "$MENU_RESPONSE" | grep -q "\[\]"; then
    echo "   ⚠️  Menu API returns empty array (may be expected if no items)"
elif echo "$MENU_RESPONSE" | grep -q '"error"'; then
    echo "   ❌ Menu API returns error"
    echo "   Response: $(echo "$MENU_RESPONSE" | head -c 200)"
else
    echo "   ✅ Menu API responding"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. If DATABASE_URL is not configured:"
echo "   - Go to Vercel Dashboard → Settings → Environment Variables"
echo "   - Add DATABASE_URL for Production environment"
echo "   - Redeploy the application"
echo ""
echo "2. If DATABASE_URL is configured but APIs still fail:"
echo "   - Check MongoDB Atlas Network Access (allow 0.0.0.0/0)"
echo "   - Verify connection string format"
echo "   - Check Vercel deployment logs"
echo ""

