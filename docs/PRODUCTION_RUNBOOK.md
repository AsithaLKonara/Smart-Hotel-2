# Production Runbook

## Overview

This runbook provides step-by-step procedures for deploying, monitoring, and maintaining the SmartHotel application in production.

## Pre-Deployment Checklist

### Environment Setup

- [ ] All environment variables configured in Vercel/hosting platform
- [ ] Database connection string verified
- [ ] Sentry DSN configured for error tracking
- [ ] Stripe keys configured (live keys for production)
- [ ] SMTP credentials configured
- [ ] Domain DNS configured
- [ ] SSL certificate active

### Code Verification

- [ ] All tests passing (`npm run test:all`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Linting passed (`npm run lint`)
- [ ] Security audit passed (`npm run security:check`)
- [ ] Environment validation passed (`npm run validate:env:production`)

## Deployment Procedure

### Step 1: Pre-Deployment Checks

```bash
# Run full test suite
npm run test:all

# Verify production build
npm run production:build

# Check security
npm run security:check
```

### Step 2: Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (MongoDB uses db push)
npm run db:migrate:deploy
```

### Step 3: Deploy Application

**Vercel Deployment:**
```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

**Manual Deployment:**
```bash
# Build application
npm run production:build

# Start application
npm start
```

### Step 4: Post-Deployment Verification

```bash
# Health checks
curl https://your-domain.com/api/health/live
curl https://your-domain.com/api/health/ready

# Verify endpoints
curl https://your-domain.com/api/rooms
```

## Monitoring

### Health Checks

- **Liveness**: `/api/health/live` - Checks if app is running
- **Readiness**: `/api/health/ready` - Checks database and dependencies

### Error Monitoring

- **Sentry Dashboard**: Monitor errors and exceptions
- **Logs**: Check application logs for warnings/errors
- **Performance**: Monitor `/api/performance/metrics`

### Key Metrics to Monitor

1. **Response Times**: API endpoint response times
2. **Error Rates**: 4xx/5xx error rates
3. **Database Performance**: Query execution times
4. **Web Vitals**: CLS, FID, FCP, LCP, TTFB
5. **Rate Limiting**: Track rate limit hits

## Troubleshooting

### Application Won't Start

1. Check environment variables
2. Verify database connection
3. Check logs for errors
4. Verify port availability

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check MongoDB Atlas network access
3. Verify IP whitelist
4. Check connection string format

### High Error Rate

1. Check Sentry for error details
2. Review application logs
3. Check database performance
4. Verify external service status (Stripe, SMTP)

### Performance Issues

1. Check `/api/performance/metrics`
2. Review database query performance
3. Check rate limiting status
4. Monitor resource usage (CPU, memory)

## Incident Response

### Severity Levels

- **P0 - Critical**: Application down, data loss
- **P1 - High**: Major feature broken, security issue
- **P2 - Medium**: Minor feature broken, performance degradation
- **P3 - Low**: Cosmetic issues, minor bugs

### Response Procedures

1. **Assess**: Determine severity and impact
2. **Contain**: Stop the issue from spreading
3. **Communicate**: Notify stakeholders
4. **Resolve**: Fix the issue
5. **Document**: Record incident and resolution

### Rollback Procedure

```bash
# Revert to previous deployment
vercel rollback

# Or restore from backup
npm run db:restore --backup=backups/backup-YYYY-MM-DD.tar.gz
```

## Scaling Procedures

### Horizontal Scaling

- Add more Vercel instances
- Configure load balancer
- Scale database (MongoDB Atlas)

### Vertical Scaling

- Upgrade Vercel plan
- Increase database tier
- Optimize queries

## Maintenance Windows

### Scheduled Maintenance

- **Weekly**: Security updates, dependency updates
- **Monthly**: Database optimization, backup verification
- **Quarterly**: Performance review, capacity planning

### Maintenance Checklist

- [ ] Backup database before changes
- [ ] Notify users of maintenance window
- [ ] Run tests after changes
- [ ] Verify all features working
- [ ] Monitor error rates post-maintenance

## Backup and Recovery

See [Backup Strategy](./BACKUP_STRATEGY.md) for detailed procedures.

### Quick Recovery Steps

1. Stop application
2. Restore database from backup
3. Verify data integrity
4. Restart application
5. Run health checks

## Security Procedures

### Security Incident Response

1. **Identify**: Determine breach scope
2. **Isolate**: Disconnect affected systems
3. **Assess**: Evaluate data exposure
4. **Notify**: Inform stakeholders and authorities if required
5. **Remediate**: Fix security vulnerabilities
6. **Document**: Record incident details

### Regular Security Tasks

- Weekly security audits
- Monthly dependency updates
- Quarterly penetration testing
- Annual security review

## Performance Optimization

### Database Optimization

- Monitor slow queries
- Add indexes where needed
- Optimize aggregation pipelines
- Regular database maintenance

### Application Optimization

- Monitor bundle size
- Optimize images
- Enable caching
- Review API response times

## Contact Information

- **DevOps Team**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Security Team**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

## Related Documentation

- [Backup Strategy](./BACKUP_STRATEGY.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Monitoring Setup](./MONITORING.md)

