# SmartHotel OS — Production Deployment & Infrastructure Guide
**Document Version**: `1.0.0-deploy`
**Status**: ACTIVE

This guide outlines our production deployment configurations, dockerization pipelines, reverse-proxy SSL setups, CDN setups, and system resource watch boundaries.

---

## 🐳 1. Docker Multi-Container Composition
SmartHotel OS compiles inside optimized lightweight Docker images. Below is our production-ready `docker-compose.yml` layout orchestrating Next.js, clustered PostgreSQL replicas, and Upstash Redis configurations:

```yaml
version: '3.8'

services:
  web:
    image: smarthotel-os:latest
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres-cluster.example.com:5432/production
      - NEXTAUTH_URL=https://smarthotel.example.com
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always

volumes:
  redis_data:
```

---

## 🔒 2. SSL Enforcement and Reverse Proxy
All external guest and staff connections must be encrypted over SSL/TLS. We utilize Caddy or Nginx with automated Let's Encrypt certificates:

```nginx
# Caddyfile example:
smarthotel.example.com {
    reverse_proxy web:3000
    
    # Enable secure compression
    encode gzip zstd
    
    # Configure custom request header logs
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
}
```

---

## 📈 3. Log Rotation & Memory Safety
To prevent server storage exhaustion from extensive system audit files, we enforce `logrotate` specifications:

```conf
# /etc/logrotate.d/smarthotel
/var/log/smarthotel/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0660 appuser appgroup
}
```

---

## 🧪 4. CDN Optimization & Static Caching
*   **Static Assets**: All public images, localized styling vectors, and font kits are distributed via high-speed CDNs (such as Cloudflare Edge) to reduce server latency burdens.
*   **Edge Caching Headers**: Configure Cache-Control parameters to leverage long-lived client caching for optimized next-page transitions:
    `Cache-Control: public, max-age=31536000, immutable`
