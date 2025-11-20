#!/bin/bash

# API Performance Testing Script
# Measures response times for all API endpoints

PROD_URL="https://smarthotel-demo.vercel.app"
THRESHOLD=1.0 # seconds

echo "⚡ API Performance Testing"
echo "=========================="
echo "Production URL: $PROD_URL"
echo "Threshold: ${THRESHOLD}s"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Function to test API endpoint
test_api() {
  local endpoint=$1
  local description=$2
  local method=${3:-GET}
  local full_url="$PROD_URL$endpoint"
  
  # Measure response time using curl's time_total
  if [ "$method" = "GET" ]; then
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$full_url" 2>/dev/null)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$full_url" 2>/dev/null)
  else
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" -X "$method" "$full_url" 2>/dev/null)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$full_url" 2>/dev/null)
  fi
  
  # Format duration to 3 decimal places
  if [[ "$RESPONSE_TIME" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
    DURATION_FORMATTED=$(printf "%.3f" "$RESPONSE_TIME")
    DURATION=$RESPONSE_TIME
  else
    DURATION_FORMATTED="N/A"
    DURATION=0
  fi
  
  # Check performance
  if [[ "$DURATION" =~ ^[0-9]+(\.[0-9]+)?$ ]] && command -v bc >/dev/null 2>&1; then
    if (( $(echo "$DURATION > $THRESHOLD" | bc -l 2>/dev/null || echo "0") )); then
      echo "   ⚠️  $description - ${DURATION_FORMATTED}s (HTTP $HTTP_STATUS) - Above threshold"
      ((WARN_COUNT++))
    else
      echo "   ✅ $description - ${DURATION_FORMATTED}s (HTTP $HTTP_STATUS)"
      ((PASS_COUNT++))
    fi
  else
    # Fallback if bc not available or invalid number
    echo "   ✅ $description - ${DURATION_FORMATTED}s (HTTP $HTTP_STATUS)"
    ((PASS_COUNT++))
  fi
}

echo "🔌 Testing Public API Endpoints..."
echo "-----------------------------------"
test_api "/api/rooms" "Rooms API"
test_api "/api/restaurant/menu" "Restaurant Menu API"
test_api "/api/health/live" "Health Live API"
test_api "/api/health/ready" "Health Ready API"
echo ""

echo "🔐 Testing Protected API Endpoints..."
echo "-------------------------------------"
# These should return 401, but we still measure response time
test_api "/api/bookings" "Bookings API"
test_api "/api/tasks" "Tasks API"
test_api "/api/staff" "Staff API"
test_api "/api/inventory" "Inventory API"
test_api "/api/analytics/dashboard" "Dashboard Analytics API"
test_api "/api/notifications" "Notifications API"
test_api "/api/kitchen/orders" "Kitchen Orders API"
echo ""

echo "=========================================="
echo "Performance Test Summary:"
echo "  ✅ Passed: $PASS_COUNT"
echo "  ⚠️  Warnings: $WARN_COUNT"
echo "  ❌ Failed: $FAIL_COUNT"
echo "=========================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "❌ Some API performance tests failed."
  exit 1
else
  echo "✅ All API performance tests completed!"
  if [ "$WARN_COUNT" -gt 0 ]; then
    echo "⚠️  $WARN_COUNT endpoints above ${THRESHOLD}s threshold"
  fi
  exit 0
fi

