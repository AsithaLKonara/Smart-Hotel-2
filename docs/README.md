# SmartHotel Production Documentation

Welcome to the SmartHotel production documentation. This directory contains comprehensive guides for deploying, monitoring, and maintaining the SmartHotel application in production.

## 📚 Documentation Index

### 🚀 Getting Started

1. **[Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)**
   - Database migration strategy
   - Step-by-step deployment procedures
   - Migration safety and rollback procedures
   - **Start here** if you're deploying for the first time

2. **[Production Runbook](./PRODUCTION_RUNBOOK.md)**
   - Pre-deployment checklist
   - Deployment procedures
   - Monitoring and troubleshooting
   - Incident response procedures
   - **Essential** for operations team

### 📊 Monitoring & Performance

3. **[Monitoring Setup](./MONITORING.md)**
   - Sentry error tracking configuration
   - Performance metrics setup
   - Health check endpoints
   - Alerting rules and channels
   - **Required** for production monitoring

4. **[Performance Testing Guide](./PERFORMANCE.md)**
   - Load testing with K6
   - Performance benchmarks
   - Optimization strategies
   - Performance troubleshooting
   - **Reference** for performance optimization

### 🔒 Backup & Recovery

5. **[Backup Strategy](./BACKUP_STRATEGY.md)**
   - MongoDB Atlas backup configuration
   - Manual backup procedures
   - Recovery procedures
   - Disaster recovery plan
   - **Critical** for data protection

## 🎯 Quick Reference

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection verified
- [ ] Sentry DSN configured
- [ ] All tests passing (`npm run test:all`)
- [ ] Security audit passed (`npm run security:check`)
- [ ] Environment validation passed (`npm run validate:env:production`)

### Essential Commands

```bash
# Production build
npm run production:build

# Deploy (includes migrations)
npm run production:deploy

# Run migrations separately
npm run db:migrate:deploy

# Security check
npm run security:check

# Environment validation
npm run validate:env:production

# Health checks
curl https://your-domain.com/api/health/live
curl https://your-domain.com/api/health/ready
```

### Key Endpoints

- **Health Checks**: `/api/health/live`, `/api/health/ready`
- **Performance Metrics**: `/api/performance/metrics`
- **Error Monitoring**: Sentry Dashboard

## 📋 Documentation by Role

### For DevOps Engineers
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Production Runbook](./PRODUCTION_RUNBOOK.md)
- [Backup Strategy](./BACKUP_STRATEGY.md)

### For Developers
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Performance Testing Guide](./PERFORMANCE.md)
- [Monitoring Setup](./MONITORING.md)

### For Operations Team
- [Production Runbook](./PRODUCTION_RUNBOOK.md)
- [Monitoring Setup](./MONITORING.md)
- [Backup Strategy](./BACKUP_STRATEGY.md)

## 🔗 Related Resources

- **Main README**: See project root `README.md` for development setup
- **Environment Variables**: See `.env.example` for required configuration
- **CI/CD**: See `.github/workflows/` for automated deployment pipelines
- **Security**: See `scripts/security-audit.js` for security checks

## 📞 Support

For production issues:
1. Check [Production Runbook](./PRODUCTION_RUNBOOK.md) troubleshooting section
2. Review [Monitoring Setup](./MONITORING.md) for error tracking
3. Consult [Backup Strategy](./BACKUP_STRATEGY.md) for recovery procedures

## 🔄 Documentation Updates

This documentation is maintained alongside the codebase. When making production-related changes:

1. Update relevant documentation files
2. Test procedures in staging environment
3. Update version numbers and dates
4. Notify team of significant changes

---

**Last Updated**: 2024-01-XX  
**Version**: 1.0.0  
**Maintained By**: DevOps Team

