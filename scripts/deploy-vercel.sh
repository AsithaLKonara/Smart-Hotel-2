#!/bin/bash

# SmartHotel Vercel Deployment Script
# This script sets up all environment variables and deploys to Vercel

set -e

echo "🚀 SmartHotel Vercel Deployment Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo "Please create .env.local with all required environment variables."
    exit 1
fi

echo -e "${GREEN}✅ Found .env.local file${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found!${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "Logging in..."
    vercel login
fi

echo -e "${GREEN}✅ Logged in to Vercel${NC}"
echo ""

# Load environment variables from .env.local
echo "📋 Loading environment variables from .env.local..."
echo ""

# Required variables (in order of importance)
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_USER"
    "SMTP_PASS"
)

# Optional but recommended variables
OPTIONAL_VARS=(
    "NEXT_PUBLIC_APP_URL"
    "ADMIN_EMAIL"
    "CONTACT_EMAIL"
    "SOCKET_IO_URL"
    "STRIPE_WEBHOOK_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
    "GOOGLE_MAPS_API_KEY"
    "NEXT_PUBLIC_GA_ID"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "SENTRY_DSN"
    "NEXT_PUBLIC_SENTRY_DSN"
)

# Function to set environment variable in Vercel
set_vercel_env() {
    local var_name=$1
    local var_value=$2
    local environment=${3:-production}
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}⚠️  Skipping $var_name (empty value)${NC}"
        return
    fi
    
    echo -n "Setting $var_name for $environment... "
    
    # Use echo to pipe value to vercel env add
    echo "$var_value" | vercel env add "$var_name" "$environment" --force 2>&1 | grep -q "Added" && \
        echo -e "${GREEN}✅${NC}" || \
        echo -e "${YELLOW}⚠️  (may already exist)${NC}"
}

# Function to get value from .env.local
get_env_value() {
    local var_name=$1
    grep "^${var_name}=" .env.local 2>/dev/null | cut -d '=' -f2- | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//"
}

# Set required variables
echo "🔧 Setting Required Environment Variables..."
echo ""

for var in "${REQUIRED_VARS[@]}"; do
    value=$(get_env_value "$var")
    if [ -z "$value" ]; then
        echo -e "${RED}❌ $var is missing in .env.local${NC}"
        echo "   This is a required variable. Please add it to .env.local"
        MISSING_VARS+=("$var")
    else
        set_vercel_env "$var" "$value" "production"
        set_vercel_env "$var" "$value" "preview"
        set_vercel_env "$var" "$value" "development"
    fi
done

echo ""

# Check if any required vars are missing
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required variables:${NC}"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please add these to .env.local and run this script again."
    exit 1
fi

# Set optional variables
echo "🔧 Setting Optional Environment Variables..."
echo ""

for var in "${OPTIONAL_VARS[@]}"; do
    value=$(get_env_value "$var")
    if [ -n "$value" ]; then
        set_vercel_env "$var" "$value" "production"
    fi
done

echo ""
echo -e "${GREEN}✅ All environment variables set!${NC}"
echo ""

# Ask if user wants to deploy
read -p "🚀 Deploy to Vercel now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Deploying to Vercel..."
    echo ""
    
    # Deploy to production
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo "🔍 Verifying deployment..."
    echo ""
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --prod 2>/dev/null | grep "smarthotel-demo" | head -1 | awk '{print $NF}' || echo "https://smarthotel-demo.vercel.app")
    
    echo "📍 Deployment URL: $DEPLOYMENT_URL"
    echo ""
    echo "🧪 Testing endpoints..."
    echo ""
    
    # Test endpoints
    echo "Testing /api/test-db-comprehensive..."
    curl -s "$DEPLOYMENT_URL/api/test-db-comprehensive" | jq -r '.success, .message' 2>/dev/null || echo "Endpoint test failed"
    
    echo ""
    echo "Testing /api/debug..."
    curl -s "$DEPLOYMENT_URL/api/debug" | jq -r '.status' 2>/dev/null || echo "Endpoint test failed"
    
    echo ""
    echo -e "${GREEN}✅ Verification complete!${NC}"
    echo ""
    echo "🌐 Visit your deployment: $DEPLOYMENT_URL"
else
    echo ""
    echo "⏭️  Skipping deployment. Run 'vercel --prod' when ready."
fi

echo ""
echo "✨ Done!"

