# Backup & Recovery Strategy

## Overview

This document outlines the backup and recovery strategy for SmartHotel's MongoDB database and application data.

## Database Backups

### MongoDB Atlas Automated Backups

MongoDB Atlas provides automated backups for all clusters. Configure backups in the Atlas dashboard:

1. **Enable Continuous Backups**:
   - Go to Atlas Dashboard → Clusters → Your Cluster
   - Navigate to "Backup" tab
   - Enable "Cloud Backup" (recommended: Continuous)
   - Retention: 7 days minimum (recommended: 30 days)

2. **Snapshot Schedule**:
   - Daily snapshots at 2:00 AM UTC
   - Weekly snapshots on Sundays
   - Monthly snapshots on the 1st of each month

### Manual Backup Script

Use the provided script for manual backups:

```bash
node scripts/backup-db.js
```

This script:
- Creates a timestamped backup
- Exports all collections
- Compresses the backup
- Uploads to cloud storage (if configured)

## Backup Verification

### Automated Verification

Run backup verification weekly:

```bash
node scripts/verify-backup.js
```

### Manual Verification Checklist

- [ ] Backup file exists and is not empty
- [ ] Backup file size is reasonable (> 1MB for production)
- [ ] Backup can be restored to test database
- [ ] All collections are present in backup
- [ ] Data integrity checks pass

## Recovery Procedures

### Full Database Restore

1. **Stop Application**:
   ```bash
   # On production server
   pm2 stop smarthotel
   ```

2. **Restore from MongoDB Atlas**:
   - Go to Atlas Dashboard → Backup
   - Select restore point
   - Click "Restore" → Choose target cluster
   - Wait for restore to complete

3. **Or Restore from Manual Backup**:
   ```bash
   node scripts/restore-db.js --backup=backups/backup-2024-01-01.tar.gz
   ```

4. **Verify Restore**:
   ```bash
   npm run db:test
   ```

5. **Restart Application**:
   ```bash
   pm2 start smarthotel
   ```

### Partial Restore (Single Collection)

```bash
# Restore specific collection
mongorestore --uri="$DATABASE_URL" --collection=bookings backups/bookings.bson
```

## Disaster Recovery Plan

### RTO (Recovery Time Objective): 4 hours
### RPO (Recovery Point Objective): 24 hours

### Recovery Steps

1. **Assess Damage**:
   - Identify affected collections
   - Determine data loss window
   - Check backup availability

2. **Choose Recovery Method**:
   - **Point-in-Time Recovery**: Use MongoDB Atlas continuous backups
   - **Snapshot Recovery**: Use daily/weekly snapshots
   - **Manual Backup**: Use script-generated backups

3. **Execute Recovery**:
   - Follow full database restore procedure
   - Verify data integrity
   - Test application functionality

4. **Post-Recovery**:
   - Monitor application logs
   - Verify all features working
   - Document incident
   - Update backup strategy if needed

## Backup Storage

### Primary Storage
- MongoDB Atlas Cloud Backup (automated)
- Location: Same region as database cluster

### Secondary Storage (Optional)
- AWS S3 bucket (configure in backup script)
- Retention: 90 days
- Encryption: AES-256

## Backup Monitoring

### Automated Alerts

Set up alerts for:
- Backup failures
- Backup size anomalies
- Backup age > 48 hours
- Restore operations

### Weekly Backup Report

Run weekly to verify backup health:

```bash
node scripts/backup-report.js
```

## Best Practices

1. **Test Restores Regularly**: Monthly restore tests to staging
2. **Document Changes**: Log all schema changes and migrations
3. **Multiple Backups**: Keep backups in multiple locations
4. **Encryption**: Encrypt backups containing sensitive data
5. **Access Control**: Limit backup access to authorized personnel only
6. **Monitoring**: Set up alerts for backup failures

## Emergency Contacts

- **Database Admin**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **MongoDB Atlas Support**: support@mongodb.com

## Related Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Database Migration Strategy](./PRODUCTION_DEPLOYMENT.md#database-migration-strategy)

