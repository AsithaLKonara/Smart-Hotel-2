# SmartHotel OS — Role-Based Access Control (RBAC)

## 1. Governance Model
SmartHotel OS enforces a **Default-Deny Security Model**. All routes and API endpoints are protected by default unless explicitly whitelisted in the middleware.

---

## 2. Role Definitions

| Role | Description |
| :--- | :--- |
| `SUPER_ADMIN` | Global platform administrator. Can manage properties, users, and audit logs. |
| `MANAGER` | Property-level manager. Can manage staff, inventory, and financial reports. |
| `RECEPTIONIST` | Operational front-desk staff. Handles bookings, check-ins, and guest requests. |
| `KITCHEN` | Back-of-house food operations. Manages the order queue and menu status. |
| `HOUSEKEEPING` | Cleaning and room readiness staff. |
| `MAINTENANCE` | Facility maintenance and repair staff. |
| `GUEST` | Customers with self-service access to their bookings and dining orders. |

---

## 3. Permission Matrix

| Resource | SUPER_ADMIN | MANAGER | RECEPTIONIST | KITCHEN | STAFF (HK/MT) | GUEST |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Settings / Audit** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff Management** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Bookings (All)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bookings (Self)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Kitchen KDS** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Task Queue** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Guest Menu** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

---

## 4. Enforcement Layer

### Middleware (`middleware.ts`)
- **JWT Validation**: All requests to `/api/*` and `/admin/*` require a valid NextAuth JWT.
- **Path Matching**: Middleware matches the requested path against the `PROTECTED_ROUTES` matrix.
- **Authorization**: If the user's role is not in the allowed list for the path prefix, the request is rejected with a `403 Forbidden` (API) or redirected to the home page (UI).

### Server-Side Helpers (`lib/rbac-helpers.ts`)
For granular UI visibility and Server Action protection:
- `canAccessAdminFeatures(session)`
- `canAccessManagerFeatures(session)`
- `canAccessStaffFeatures(session)`

---

## 5. Security Best Practices
1. **Never Trust the Client**: Role checks are performed on every API request server-side.
2. **Audit Logging**: Sensitive actions (Auth changes, Financial overrides) are logged with the actor's ID and timestamp.
3. **Session Rotation**: NextAuth is configured with secure JWT rotation to minimize session hijack risks.
