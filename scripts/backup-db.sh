#!/bin/bash

# ==============================================================================
# SmartHotel OS - Automated Database Backup Script
#
# This script creates a compressed, timestamped pg_dump of the production
# PostgreSQL database. It is intended to be run via a nightly cron job.
#
# Usage: ./backup-db.sh
# Dependencies: pg_dump, gzip
# ==============================================================================

set -e # Exit on error

# Load environment variables (fallback to .env if not injected by CI)
if [ -f "../.env" ]; then
  source ../.env
fi

if [ -z "$DATABASE_URL" ]; then
  echo "[ERROR] DATABASE_URL is not set. Cannot perform backup."
  exit 1
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/smarthotel_db_$TIMESTAMP.sql.gz"

echo "========================================"
echo "Starting Database Backup: $TIMESTAMP"
echo "========================================"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run pg_dump
# Note: We pipe directly to gzip to save disk space
echo "[INFO] Running pg_dump..."
if pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[SUCCESS] Backup created successfully: $BACKUP_FILE ($FILE_SIZE)"
else
  echo "[ERROR] pg_dump failed."
  exit 1
fi

# (Optional) Cleanup old backups older than 7 days
# find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete
# echo "[INFO] Cleaned up backups older than 7 days."

echo "========================================"
echo "Backup Process Complete."
echo "========================================"
