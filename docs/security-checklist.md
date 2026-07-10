# SmartHotel OS — SRE Production Security & Hardening Manual
**Document Version**: `1.0.0-security`
**Status**: ACTIVE

This guide outlines our mandatory security controls, environmental auditing protocols, secure headers, and encryption requirements for live hospitality environments.

---

## 🔐 1. Environment Secrets & Auditing Checklist
All production nodes must run with fully validated environment schemas. Below are the required security thresholds for crucial variables:

| Variable Name | Required Production Format | Security Verification Rule |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Absolute isolation (do not use default localhost). Must point to clustered replica set. |
| `NEXTAUTH_SECRET` | 32+ character Base64 | Cryptographic signature safety. Must be generated using secure random sources. |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Strictly live keys (verify `sk_test_` keys are blocked on production checkouts). |
| `UPSTASH_REDIS_REST_URL` | `https://...` | Secure REST end-point of distributed Redis lock memory. |

### Forbidden on Production:
*   NO plain mock strings (e.g. `secret`, `12345`).
*   NO inline passwords inside code files or docker repositories.
*   NO test credentials or mock payment secrets.

---

## 🛡️ 2. Safe Headers & CSP Policies
We enforce absolute Content Security Policies (CSP) to mitigate Cross-Site Scripting (XSS) and iframe clickjacking vectors:

```nginx
# Nginx / Cloudflare secure headers example:
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self' https://api.stripe.com; frame-src 'self' https://js.stripe.com;" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

---

## 🍪 3. Secure Session Cookie Directives
Session cookies are configured inside NextAuth and server routes with strict isolation parameters:
*   `Secure`: Cookie is transmitted exclusively over encrypted HTTPS connections.
*   `HttpOnly`: Prevent JavaScript cross-site script access to session identifiers.
*   `SameSite=Lax`: Restricts cookie transfer in third-party cross-site requests to mitigate CSRF attacks.

---

## 🚦 4. Distributed Rate Limiting & Logs
We enforce multi-tier rate limiting thresholds at API layers:
*   **Standard Rate Limits**: 100 requests per 1-minute window per IP.
*   **Tenant-Aware Gating**: Premium enterprise clients receive higher burst capabilities, while suspicious request volumes trigger automated IP isolation.
*   **API Request Logs**: No raw billing passwords, credit card cardholder data, or JWT signatures are printed to standard server outputs.
