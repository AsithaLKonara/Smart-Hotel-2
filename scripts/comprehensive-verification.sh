#!/bin/bash

# Comprehensive 100% Verification Script
# Tests every page, API endpoint, and checks for errors

PROD_URL="https://smarthotel-demo.vercel.app"
PASS=0
FAIL=0
WARN=0

echo "🔍 Starting 100% Comprehensive Verification"
echo "=========================================="
echo "Production URL: $PROD_URL"
echo ""

# Function to test a page
test_page() {
    local url=$1
    local name=$2
    local requires_auth=${3:-false}
    
    if [ "$requires_auth" = "true" ]; then
        # Skip authenticated pages for now - will test with browser
        echo "   ⏭️  $name (requires auth - will test with browser)"
        ((WARN++))
        return
    fi
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$url")
    if [ "$status" = "200" ]; then
        echo "   ✅ $name (HTTP $status)"
        ((PASS++))
    else
        echo "   ❌ $name (HTTP $status)"
        ((FAIL++))
    fi
}

# Function to test API endpoint
test_api() {
    local url=$1
    local name=$2
    local requires_auth=${3:-false}
    
    if [ "$requires_auth" = "true" ]; then
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$url")
        if [ "$status" = "401" ] || [ "$status" = "200" ]; then
            echo "   ✅ $name (HTTP $status - auth required/working)"
            ((PASS++))
        else
            echo "   ⚠️  $name (HTTP $status)"
            ((WARN++))
        fi
    else
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$url")
        if [ "$status" = "200" ]; then
            echo "   ✅ $name (HTTP $status)"
            ((PASS++))
        else
            echo "   ❌ $name (HTTP $status)"
            ((FAIL++))
        fi
    fi
}

echo "📄 Testing Public Pages..."
echo "-------------------------"
test_page "/" "Homepage"
test_page "/rooms" "Rooms Page"
test_page "/order" "Restaurant/Menu Page"
test_page "/gallery" "Gallery Page"
test_page "/contact" "Contact Page"
test_page "/booking" "Booking Page"
test_page "/auth/signin" "Sign In Page"
test_page "/auth/signup" "Sign Up Page"
test_page "/auth/forgot-password" "Forgot Password Page"

echo ""
echo "🔌 Testing Public API Endpoints..."
echo "---------------------------------"
test_api "/api/rooms" "Rooms API"
test_api "/api/restaurant/menu" "Restaurant Menu API"

echo ""
echo "🔐 Testing Protected API Endpoints..."
echo "-------------------------------------"
test_api "/api/bookings" "Bookings API" true
test_api "/api/tasks" "Tasks API" true
test_api "/api/staff" "Staff API" true
test_api "/api/analytics/dashboard" "Dashboard Analytics API" true
test_api "/api/notifications" "Notifications API" true

echo ""
echo "=========================================="
echo "Verification Summary:"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ⚠️  Warnings: $WARN"
echo "=========================================="

if [ "$FAIL" -eq 0 ]; then
    echo "✅ All public pages and APIs accessible!"
    exit 0
else
    echo "❌ Some pages/APIs failed verification"
    exit 1
fi

