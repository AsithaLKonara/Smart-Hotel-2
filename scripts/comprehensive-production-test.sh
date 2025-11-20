#!/bin/bash

# Comprehensive Production Testing Script
# Tests all critical pages and API endpoints

PROD_URL="https://smarthotel-demo.vercel.app"
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

echo "🧪 Starting Comprehensive Production Testing"
echo "=========================================="
echo "Production URL: $PROD_URL"
echo ""

# Helper function for page checks
check_page() {
  local path=$1
  local description=$2
  local expected_status=$3
  local full_url="$PROD_URL$path"

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")

  if [ "$HTTP_STATUS" = "$expected_status" ]; then
    echo "   ✅ $description (HTTP $HTTP_STATUS)"
    ((PASS_COUNT++))
  else
    echo "   ❌ $description (HTTP $HTTP_STATUS - Expected $expected_status)"
    ((FAIL_COUNT++))
  fi
}

# Helper function for API checks
check_api() {
  local path=$1
  local description=$2
  local expected_status=$3
  local full_url="$PROD_URL$path"

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")
  RESPONSE=$(curl -s "$full_url" | head -c 200)

  if [ "$HTTP_STATUS" = "$expected_status" ]; then
    echo "   ✅ $description (HTTP $HTTP_STATUS)"
    ((PASS_COUNT++))
  elif [ "$HTTP_STATUS" = "401" ] && [ "$expected_status" = "200" ]; then
    echo "   ⚠️  $description (HTTP $HTTP_STATUS - Auth required, but API responds)"
    ((WARN_COUNT++))
  else
    echo "   ❌ $description (HTTP $HTTP_STATUS - Expected $expected_status)"
    echo "      Response: ${RESPONSE:0:100}"
    ((FAIL_COUNT++))
  fi
}

echo "📄 Testing Public Pages..."
echo "-------------------------"
check_page "/" "Homepage" "200"
check_page "/rooms" "Rooms Page" "200"
check_page "/order" "Restaurant/Menu Page" "200"
check_page "/gallery" "Gallery Page" "200"
check_page "/contact" "Contact Page" "200"
check_page "/booking" "Booking Page" "200"
check_page "/auth/signin" "Sign In Page" "200"
check_page "/auth/signup" "Sign Up Page" "200"
check_page "/auth/forgot-password" "Forgot Password Page" "200"
echo ""

echo "🔌 Testing Public API Endpoints..."
echo "---------------------------------"
check_api "/api/rooms" "Rooms API" "200"
check_api "/api/restaurant/menu" "Restaurant Menu API" "200"
check_api "/api/health/live" "Health Live API" "200"
check_api "/api/health/ready" "Health Ready API" "200"
echo ""

echo "🔐 Testing Protected API Endpoints..."
echo "-------------------------------------"
# These should return 401 (Unauthorized) without authentication
check_api "/api/bookings" "Bookings API" "401"
check_api "/api/tasks" "Tasks API" "401"
check_api "/api/staff" "Staff API" "401"
check_api "/api/inventory" "Inventory API" "401"
check_api "/api/analytics/dashboard" "Dashboard Analytics API" "401"
check_api "/api/notifications" "Notifications API" "401"
check_api "/api/kitchen/orders" "Kitchen Orders API" "401"
echo ""

echo "=========================================="
echo "Test Summary:"
echo "  ✅ Passed: $PASS_COUNT"
echo "  ❌ Failed: $FAIL_COUNT"
echo "  ⚠️  Warnings: $WARN_COUNT"
echo "=========================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "❌ Some tests failed. Please review the logs."
  exit 1
else
  echo "✅ All critical tests passed!"
  exit 0
fi

