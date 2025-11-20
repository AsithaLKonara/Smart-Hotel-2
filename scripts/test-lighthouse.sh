#!/bin/bash

# Lighthouse Audit Script
# Note: Requires Lighthouse CLI to be installed
# Install: npm install -g lighthouse

PROD_URL="https://smarthotel-demo.vercel.app"

echo "🔍 Lighthouse Performance Audits"
echo "================================="
echo "Production URL: $PROD_URL"
echo ""

if ! command -v lighthouse >/dev/null 2>&1; then
  echo "⚠️  Lighthouse CLI not installed"
  echo "   Install with: npm install -g lighthouse"
  echo "   Or use Chrome DevTools Lighthouse tab manually"
  exit 0
fi

PAGES=(
  "/"
  "/rooms"
  "/admin/dashboard"
  "/booking"
)

for page in "${PAGES[@]}"; do
  full_url="$PROD_URL$page"
  echo "Testing: $full_url"
  
  lighthouse "$full_url" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json \
    --output-path=./lighthouse-$(echo "$page" | tr '/' '-').json \
    --quiet \
    --chrome-flags="--headless" 2>/dev/null || {
    echo "   ⚠️  Lighthouse audit failed for $page"
    echo "   Manual testing recommended via Chrome DevTools"
  }
done

echo ""
echo "✅ Lighthouse audits completed"
echo "   Results saved to: ./lighthouse-*.json"

