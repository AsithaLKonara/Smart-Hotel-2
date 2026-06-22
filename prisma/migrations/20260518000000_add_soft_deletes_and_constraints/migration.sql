-- SmartHotel OS SRE Database Migration
-- 
-- Applies soft-delete deletedAt columns and composite performance indexes safely.

-- AlterTable
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" ON "Booking" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_roomId_status_idx" ON "Booking" ("roomId", "status");
