# Performance Testing Guide

## Overview

This document describes performance testing strategies, benchmarks, and optimization guidelines for SmartHotel.

## Load Testing

### K6 Load Tests

**Location:** `tests/k6/`

**Running Tests:**
```bash
# Booking load test
npm run test:load

# Custom test
k6 run tests/k6/your-test.js
```

### Test Scenarios

1. **Booking Flow Load Test**
   - Simulates concurrent booking requests
   - Tests: Room availability, booking creation, payment processing
   - Target: 100 requests/second

2. **API Endpoint Load Test**
   - Tests all API endpoints under load
   - Measures response times and error rates
   - Target: p95 < 500ms

3. **Database Load Test**
   - Tests database query performance
   - Measures connection pool usage
   - Target: Query time < 100ms

## Performance Benchmarks

### API Response Times

| Endpoint | Target p50 | Target p95 | Target p99 |
|----------|------------|------------|------------|
| GET /api/rooms | 50ms | 100ms | 200ms |
| POST /api/bookings | 200ms | 500ms | 1000ms |
| GET /api/bookings | 100ms | 200ms | 500ms |
| GET /api/analytics | 300ms | 600ms | 1000ms |

### Web Vitals Targets

| Metric | Target | Good | Needs Improvement |
|--------|--------|------|-------------------|
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| FCP | < 1.8s | 1.8-3s | > 3s |
| TTFB | < 800ms | 800-1800ms | > 1800ms |

### Database Performance

| Operation | Target | Warning | Critical |
|-----------|--------|---------|----------|
| Simple Query | < 50ms | 50-200ms | > 200ms |
| Complex Query | < 200ms | 200-500ms | > 500ms |
| Aggregation | < 500ms | 500-1000ms | > 1000ms |
| Write Operation | < 100ms | 100-300ms | > 300ms |

## Performance Optimization Strategies

### Database Optimization

1. **Indexing**
   - Add indexes on frequently queried fields
   - Review query patterns regularly
   - Use compound indexes for multi-field queries

2. **Query Optimization**
   - Use `select` to limit fields returned
   - Avoid N+1 queries
   - Use aggregation pipelines efficiently

3. **Connection Pooling**
   - Configure appropriate pool size
   - Monitor connection usage
   - Handle connection errors gracefully

### API Optimization

1. **Caching**
   - Cache frequently accessed data
   - Use Redis for distributed caching
   - Implement cache invalidation strategies

2. **Response Compression**
   - Enable gzip compression
   - Optimize JSON responses
   - Minimize payload sizes

3. **Rate Limiting**
   - Implement appropriate rate limits
   - Monitor rate limit hits
   - Adjust limits based on usage

### Frontend Optimization

1. **Code Splitting**
   - Lazy load components
   - Split routes by page
   - Optimize bundle size

2. **Image Optimization**
   - Use Next.js Image component
   - Implement responsive images
   - Use WebP format

3. **Caching**
   - Implement service worker
   - Cache static assets
   - Use CDN for assets

## Performance Regression Testing

### Automated Performance Tests

Add to CI pipeline:
```yaml
- name: Performance regression test
  run: |
    npm run test:load
    # Compare results with baseline
```

### Baseline Metrics

Store baseline metrics in:
- `tests/performance/baselines.json`
- Update quarterly or after major changes

### Performance Budgets

Define in `package.json`:
```json
{
  "performance": {
    "budgets": [
      {
        "type": "bundle",
        "maximumWarning": "500kb",
        "maximumError": "1mb"
      }
    ]
  }
}
```

## Monitoring Performance

### Real User Monitoring (RUM)

- Track Web Vitals in production
- Monitor API response times
- Track error rates

### Synthetic Monitoring

- Scheduled performance tests
- Uptime monitoring
- API endpoint checks

## Performance Troubleshooting

### Slow API Responses

1. Check database query performance
2. Review API endpoint logic
3. Check external service dependencies
4. Review rate limiting status

### Slow Page Loads

1. Check Web Vitals scores
2. Review bundle size
3. Check image optimization
4. Review third-party scripts

### Database Performance Issues

1. Check slow query log
2. Review indexes
3. Check connection pool
4. Review query patterns

## Related Documentation

- [Monitoring Setup](./MONITORING.md)
- [Production Runbook](./PRODUCTION_RUNBOOK.md)

