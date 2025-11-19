#!/bin/bash

# Test Authentication Script
# Tests login with all test user accounts

PROD_URL="https://smarthotel-demo.vercel.app"

echo "🧪 Testing Authentication on Production"
echo "========================================"
echo ""

# Test users
declare -a USERS=(
  "admin@smarthotel.com:admin123:SUPER_ADMIN"
  "manager@smarthotel.com:manager123:MANAGER"
  "receptionist@smarthotel.com:receptionist123:RECEPTIONIST"
  "guest@example.com:guest123:GUEST"
)

PASS=0
FAIL=0

for user_data in "${USERS[@]}"; do
  IFS=':' read -r email password role <<< "$user_data"
  
  echo "Testing: $email ($role)"
  
  # Test sign-in endpoint
  RESPONSE=$(curl -s -X POST "$PROD_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
    -c /tmp/cookies.txt)
  
  # Check session
  SESSION_RESPONSE=$(curl -s "$PROD_URL/api/auth/session" -b /tmp/cookies.txt)
  
  if echo "$SESSION_RESPONSE" | grep -q "\"authenticated\":true"; then
    echo "   ✅ Authentication successful"
    ((PASS++))
  else
    echo "   ❌ Authentication failed"
    echo "   Response: $SESSION_RESPONSE"
    ((FAIL++))
  fi
  
  echo ""
done

echo "========================================"
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -eq 0 ]; then
  exit 0
else
  exit 1
fi

