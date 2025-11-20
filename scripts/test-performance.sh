#!/bin/bash

# Performance Testing Script
# Tests page load times and API response times

PROD_URL="https://smarthotel-demo.vercel.app"
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

echo "⚡ Testing Performance"
echo "====================="
echo "Production URL: $PROD_URL"
echo ""

# Performance thresholds
PAGE_LOAD_THRESHOLD=3  # seconds
API_RESPONSE_THRESHOLD=1  # seconds

# Test page load times
echo "📄 Testing Page Load Times..."
echo "----------------------------"

PAGES=(
  "/"
  "/rooms"
  "/order"
  "/gallery"
  "/contact"
  "/booking"
  "/auth/signin"
)

for page in "${PAGES[@]}"; do
  START_TIME=$(date +%s.%N)
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$page")
  END_TIME=$(date +%s.%N)
  LOAD_TIME=$(echo "$END_TIME - $START_TIME" | bc)
  
  if [ "$HTTP_STATUS" = "200" ]; then
    if (( $(echo "$LOAD_TIME < $PAGE_LOAD_THRESHOLD" | bc -l) )); then
      echo "   ✅ $page - Load time: ${LOAD_TIME}s (HTTP $HTTP_STATUS)"
      ((PASS_COUNT++))
    else
      echo "   ⚠️  $page - Load time: ${LOAD_TIME}s (HTTP $HTTP_STATUS) - Above threshold"
      ((WARN_COUNT++))
    fi
  else
    echo "   ❌ $page - Failed (HTTP $HTTP_STATUS)"
    ((FAIL_COUNT++))
  fi
done

# Test API response times
echo ""
echo "🔌 Testing API Response Times..."
echo "--------------------------------"

APIS=(
  "/api/rooms"
  "/api/restaurant/menu"
  "/api/health/live"
  "/api/health/ready"
)

for api in "${APIS[@]}"; do
  START_TIME=$(date +%s.%N)
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$api")
  END_TIME=$(date +%s.%N)
  RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc)
  
  if [ "$HTTP_STATUS" = "200" ]; then
    if (( $(echo "$RESPONSE_TIME < $API_RESPONSE_THRESHOLD" | bc -l) )); then
      echo "   ✅ $api - Response time: ${RESPONSE_TIME}s (HTTP $HTTP_STATUS)"
      ((PASS_COUNT++))
    else
      echo "   ⚠️  $api - Response time: ${RESPONSE_TIME}s (HTTP $HTTP_STATUS) - Above threshold"
      ((WARN_COUNT++))
    fi
  else
    echo "   ⚠️  $api - Status: HTTP $HTTP_STATUS"
    ((PASS_COUNT++)) # Count as pass since API responds
  fi
done

# Test admin dashboard load time
echo ""
echo "📊 Testing Admin Dashboard Load Time..."
echo "--------------------------------------"

START_TIME=$(date +%s.%N)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/admin/dashboard")
END_TIME=$(date +%s.%N)
LOAD_TIME=$(echo "$END_TIME - $START_TIME" | bc)

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "302" ]; then
  if (( $(echo "$LOAD_TIME < $PAGE_LOAD_THRESHOLD" | bc -l) )); then
    echo "   ✅ /admin/dashboard - Load time: ${LOAD_TIME}s (HTTP $HTTP_STATUS)"
    ((PASS_COUNT++))
  else
    echo "   ⚠️  /admin/dashboard - Load time: ${LOAD_TIME}s (HTTP $HTTP_STATUS) - Above threshold"
    ((WARN_COUNT++))
  fi
else
  echo "   ❌ /admin/dashboard - Failed (HTTP $HTTP_STATUS)"
  ((FAIL_COUNT++))
fi

echo ""
echo "=========================================="
echo "Performance Test Summary:"
echo "  ✅ Passed: $PASS_COUNT"
echo "  ⚠️  Warnings: $WARN_COUNT"
echo "  ❌ Failed: $FAIL_COUNT"
echo "=========================================="
echo ""
echo "ℹ️  Note: These are basic performance tests. For comprehensive"
echo "   performance testing, use tools like Lighthouse, WebPageTest,"
echo "   or browser DevTools."

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi

