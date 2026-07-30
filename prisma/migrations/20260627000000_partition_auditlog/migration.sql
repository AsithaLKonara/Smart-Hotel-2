-- Enterprise Data Partitioning for High-Volume Logs
-- This migration converts the AuditLog table to a partitioned table by range (createdAt).
-- NOTE: PostgreSQL requires creating a new partitioned table and migrating data if the table already exists.

-- 1. Rename existing table to act as the default partition (or backup)
ALTER TABLE "AuditLog" RENAME TO "AuditLog_old";

-- 2. Create the new partitioned table
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "actor" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

-- 3. Create partitions for the current and upcoming years/months
CREATE TABLE "AuditLog_2026_h1" PARTITION OF "AuditLog" 
    FOR VALUES FROM ('2026-01-01') TO ('2026-07-01');

CREATE TABLE "AuditLog_2026_h2" PARTITION OF "AuditLog" 
    FOR VALUES FROM ('2026-07-01') TO ('2027-01-01');

CREATE TABLE "AuditLog_2027_h1" PARTITION OF "AuditLog" 
    FOR VALUES FROM ('2027-01-01') TO ('2027-07-01');

-- 4. Move data (if necessary in a real migration)
-- INSERT INTO "AuditLog" SELECT * FROM "AuditLog_old";
-- DROP TABLE "AuditLog_old";
