# Monitoring & Dashboards

## Overview

This document describes the monitoring setup, dashboards, and alerting configuration for SmartHotel production environment.

## Monitoring Tools

### Error Tracking: Sentry

**Setup:**
1. Create Sentry account at https://sentry.io
2. Create new project (Next.js)
3. Configure DSN in environment variables
4. Set up alerts and notifications

**Dashboard Access:**
- URL: https://sentry.io/organizations/[org]/projects/[project]/
- Key Metrics: Error rate, affected users, error trends

**Alerts:**
- Error rate > 10 errors/minute
- New error types
- Critical errors (P0/P1)

### Application Performance: Custom Metrics

**Endpoint:** `/api/performance/metrics`

**Available Metrics:**
- `db.query` - Database query performance
- `api.request` - API endpoint response times
- `web.vital.cls` - Cumulative Layout Shift
- `web.vital.fid` - First Input Delay
- `web.vital.fcp` - First Contentful Paint
- `web.vital.lcp` - Largest Contentful Paint
- `web.vital.ttfb` - Time to First Byte

**Query Examples:**
```bash
# Get all metrics from last hour
GET /api/performance/metrics?since=3600000

# Get specific metric stats
GET /api/performance/metrics?metric=api.request
```

### Health Checks

**Endpoints:**
- `/api/health/live` - Application liveness
- `/api/health/ready` - Application readiness

**Monitoring:**
- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Check interval: 1 minute
- Alert on: 3 consecutive failures

### Database Monitoring

**MongoDB Atlas Dashboard:**
- Connection metrics
- Query performance
- Storage usage
- Replication lag

**Key Metrics:**
- Connection count
- Operation execution time
- Index usage
- Storage size

## Dashboards

### Production Dashboard

**Metrics to Display:**
1. **Application Health**
   - Uptime percentage
   - Error rate
   - Response time (p50, p95, p99)

2. **Database Health**
   - Connection pool usage
   - Query performance
   - Storage usage

3. **User Metrics**
   - Active users
   - API request volume
   - Error rate by endpoint

4. **Performance**
   - Web Vitals scores
   - API response times
   - Database query times

### Sentry Dashboard

**Key Views:**
- Issues: Active errors and exceptions
- Performance: Transaction performance
- Releases: Deployment tracking
- Alerts: Configured alert rules

## Alerting Rules

### Critical Alerts (P0)

- Application down (health check fails)
- Database connection failure
- Error rate > 50 errors/minute
- Payment processing failures

### High Priority Alerts (P1)

- Error rate > 20 errors/minute
- Response time p95 > 2 seconds
- Database query time > 1 second
- Rate limit exceeded frequently

### Medium Priority Alerts (P2)

- Error rate > 10 errors/minute
- Response time p95 > 1 second
- Disk usage > 80%
- Memory usage > 80%

### Low Priority Alerts (P3)

- Warning logs > 100/hour
- Slow queries detected
- Backup failures

## Alert Channels

### Email Alerts
- Critical: Immediate notification
- High: Within 5 minutes
- Medium: Within 15 minutes
- Low: Daily digest

### Slack/Teams Integration
- Critical: #alerts-critical channel
- High: #alerts-high channel
- Medium: #alerts-medium channel

### SMS/PagerDuty
- Critical alerts only
- On-call rotation

## Logging

### Log Levels

- **Error**: Application errors, exceptions
- **Warn**: Warnings, deprecations
- **Info**: General information
- **Debug**: Detailed debugging (dev only)

### Log Storage

- **Production**: Winston file logs + Sentry
- **Retention**: 30 days
- **Location**: `logs/` directory

### Log Aggregation

Consider using:
- Logtail
- Datadog
- CloudWatch (AWS)
- Vercel Logs

## Performance Monitoring

### Web Vitals Tracking

Automatically tracked via `WebVitalsTracker` component:
- CLS (Cumulative Layout Shift)
- FID (First Input Delay)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTFB (Time to First Byte)

### Database Performance

Tracked via Prisma query events:
- Query execution time
- Slow query detection (> 1 second)
- Query frequency

### API Performance

Tracked via middleware:
- Request/response times
- Status codes
- Error rates by endpoint

## Monitoring Best Practices

1. **Set Up Baselines**: Establish normal performance baselines
2. **Alert Fatigue**: Avoid too many alerts, focus on actionable ones
3. **Regular Reviews**: Weekly review of metrics and alerts
4. **Documentation**: Document all alerts and their meanings
5. **Testing**: Regularly test alerting systems

## Troubleshooting Monitoring Issues

### Sentry Not Receiving Events

1. Verify SENTRY_DSN is set correctly
2. Check network connectivity
3. Verify Sentry project is active
4. Check rate limits

### Performance Metrics Missing

1. Verify WebVitalsTracker is loaded
2. Check `/api/performance/metrics` endpoint
3. Verify performance tracking is enabled
4. Check browser console for errors

### Health Checks Failing

1. Check database connection
2. Verify environment variables
3. Check application logs
4. Verify dependencies are running

## Related Documentation

- [Production Runbook](./PRODUCTION_RUNBOOK.md)
- [Backup Strategy](./BACKUP_STRATEGY.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)

