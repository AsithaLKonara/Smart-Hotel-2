# Production Deployment Guide

## Database Migration Strategy

### MongoDB with Prisma

Since SmartHotel uses MongoDB, Prisma uses `db push` for schema synchronization rather than traditional SQL migrations. However, we maintain a migration tracking system for documentation and version control.

### Migration Commands

#### Development
```bash
# Create a new migration (tracks schema changes)
npm run db:migrate

# Or use db push directly for quick changes
npm run db:push
```

#### Production
```bash
# Deploy migrations (runs automatically in production:deploy)
npm run db:migrate:deploy

# Or use the migration runner script
node scripts/run-migrations.js
```

### Migration Workflow

1. **Schema Changes**: Update `prisma/schema.prisma`
2. **Generate Client**: `npm run db:generate`
3. **Test Locally**: `npm run db:push` (development)
4. **Create Migration**: `npm run db:migrate:create <migration-name>` (optional, for tracking)
5. **Deploy**: `npm run production:deploy` (automatically runs migrations)

### Production Deployment Steps

1. **Pre-deployment Checks**:
   ```bash
   npm run security:scan
   npm run type-check
   npm run lint
   ```

2. **Build**:
   ```bash
   npm run production:build
   ```

3. **Run Migrations**:
   ```bash
   node scripts/run-migrations.js
   ```

4. **Start Application**:
   ```bash
   npm start
   ```

### Migration Safety

- Always backup database before migrations
- Test migrations in staging environment first
- Use `--accept-data-loss` flag only when intentional
- Document breaking schema changes

### Rollback Strategy

For MongoDB, rollbacks require:
1. Restore from backup
2. Or manually revert schema changes
3. Update Prisma schema to match previous state

### Monitoring

- Check migration status: `npm run db:migrate:status`
- Verify schema sync: `npm run db:studio`
- Monitor database connection: `/api/health/ready`

