#!/bin/bash

# Script to seed production database
# This script requires DATABASE_URL to be set in Vercel environment variables

echo "🌱 SmartHotel Production Database Seeding"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set DATABASE_URL in one of the following ways:"
  echo "1. Export it in your shell: export DATABASE_URL='your-connection-string'"
  echo "2. Add it to .env file: echo 'DATABASE_URL=your-connection-string' > .env"
  echo "3. Get it from Vercel: vercel env pull .env"
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
npm run db:seed:demo

echo ""
echo "✅ Seeding complete!"
echo ""
echo "Next steps:"
echo "1. Verify data in production: https://smarthotel-demo.vercel.app/admin/dashboard"
echo "2. Test authentication with seeded users"
echo "3. Test CRUD operations"

