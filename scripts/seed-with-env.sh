#!/bin/bash

# Script to seed database with DATABASE_URL from environment
# Usage: DATABASE_URL="your-connection-string" ./scripts/seed-with-env.sh

set -e

echo "🌱 SmartHotel Database Seeding Script"
echo "======================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Usage:"
  echo "  DATABASE_URL='your-connection-string' ./scripts/seed-with-env.sh"
  echo ""
  echo "Or set it in your shell:"
  echo "  export DATABASE_URL='your-connection-string'"
  echo "  ./scripts/seed-with-env.sh"
  echo ""
  exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run seed script
echo "🌱 Running comprehensive seed script..."
echo ""

npm run db:seed:demo

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Seeding completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Visit: https://smarthotel-demo.vercel.app/admin/dashboard"
  echo "2. Sign in with: admin@smarthotel.com / admin123"
  echo "3. Verify data is displayed correctly"
  echo ""
else
  echo ""
  echo "❌ Seeding failed with exit code: $EXIT_CODE"
  echo "Please check the error messages above"
  echo ""
  exit $EXIT_CODE
fi

