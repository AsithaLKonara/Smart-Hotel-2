# 📋 SmartHotel API Endpoints List

**Date:** November 13, 2025  
**Total Endpoints:** 41 route files  
**Total API Endpoints:** ~60+ (including different HTTP methods)

---

## 📊 Summary

| Category | Count | Endpoints |
|----------|-------|-----------|
| **Authentication** | 6 | Session, Register, Login, Password Reset, etc. |
| **Rooms** | 4 | List, Detail, Availability, Check Availability |
| **Bookings** | 2 | List, Detail (with CRUD) |
| **Restaurant** | 4 | Menu, Menu Item, Orders, Order Detail |
| **Kitchen** | 1 | Orders Management |
| **Staff** | 1 | Staff Management |
| **Tasks** | 2 | List, Detail (with CRUD) |
| **Inventory** | 2 | List, Detail (with CRUD) |
| **Gallery** | 2 | List, Detail (with CRUD) |
| **Analytics** | 3 | Analytics, Dashboard, Export |
| **Settings** | 1 | Contact Info |
| **Notifications** | 2 | Notifications, Subscribe |
| **Health** | 2 | Liveness, Readiness |
| **Testing** | 5 | Test DB, Test Simple, etc. |
| **Webhooks** | 1 | Stripe Webhook |
| **Utilities** | 3 | Contact, Performance Metrics, QR Codes |
| **Total** | **41** | **~60+ endpoints** |

---

## 🔐 Authentication Endpoints

### 1. `/api/auth/[...nextauth]`
- **Methods:** GET, POST
- **Description:** NextAuth.js authentication handler
- **Features:** Login, Logout, OAuth, Session Management

### 2. `/api/auth/session`
- **Methods:** GET
- **Description:** Get current user session
- **Auth:** Optional

### 3. `/api/auth/register`
- **Methods:** POST
- **Description:** Register new user
- **Auth:** Not required

### 4. `/api/auth/forgot-password`
- **Methods:** POST
- **Description:** Request password reset
- **Auth:** Not required

### 5. `/api/auth/reset-password`
- **Methods:** POST
- **Description:** Reset password with token
- **Auth:** Not required

### 6. `/api/auth/_log`
- **Methods:** POST
- **Description:** Authentication logging
- **Auth:** Internal

---

## 🏨 Rooms Endpoints

### 7. `/api/rooms`
- **Methods:** GET, POST
- **Description:** List all rooms, Create room
- **Auth:** GET (Public), POST (Admin/Manager)

### 8. `/api/rooms/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete room
- **Auth:** GET (Public), PUT/DELETE (Admin/Manager)

### 9. `/api/rooms/availability`
- **Methods:** GET
- **Description:** Check room availability by dates
- **Auth:** Public

### 10. `/api/rooms/check-availability`
- **Methods:** GET, POST
- **Description:** Check room availability (alternative)
- **Auth:** Public

---

## 📅 Bookings Endpoints

### 11. `/api/bookings`
- **Methods:** GET, POST
- **Description:** List all bookings, Create booking
- **Auth:** GET (Authenticated), POST (Public/Guest)

### 12. `/api/bookings/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete booking
- **Auth:** GET (Owner/Staff), PUT/DELETE (Owner/Admin)

---

## 🍽️ Restaurant Endpoints

### 13. `/api/restaurant/menu`
- **Methods:** GET, POST
- **Description:** List all menu items, Create menu item
- **Auth:** GET (Public), POST (Admin/Manager)

### 14. `/api/restaurant/menu/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete menu item
- **Auth:** GET (Public), PUT/DELETE (Admin/Manager)

### 15. `/api/restaurant/orders`
- **Methods:** GET, POST
- **Description:** List all orders, Create order
- **Auth:** GET (Authenticated), POST (Public/Guest)

### 16. `/api/restaurant/orders/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete order
- **Auth:** GET (Owner/Staff), PUT/DELETE (Owner/Staff)

---

## 👨‍🍳 Kitchen Endpoints

### 17. `/api/kitchen/orders`
- **Methods:** GET, PUT
- **Description:** List kitchen orders, Update order status
- **Auth:** Kitchen Staff, Manager

---

## 👥 Staff Endpoints

### 18. `/api/staff`
- **Methods:** GET, POST
- **Description:** List all staff, Create staff member
- **Auth:** Admin, Manager

---

## ✅ Tasks Endpoints

### 19. `/api/tasks`
- **Methods:** GET, POST
- **Description:** List all tasks, Create task
- **Auth:** Authenticated

### 20. `/api/tasks/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete task
- **Auth:** Authenticated

---

## 📦 Inventory Endpoints

### 21. `/api/inventory`
- **Methods:** GET, POST
- **Description:** List all inventory items, Create inventory item
- **Auth:** Authenticated

### 22. `/api/inventory/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete inventory item
- **Auth:** Authenticated

---

## 🖼️ Gallery Endpoints

### 23. `/api/gallery`
- **Methods:** GET, POST
- **Description:** List all gallery items, Create gallery item
- **Auth:** GET (Authenticated), POST (Admin/Manager)

### 24. `/api/gallery/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete gallery item
- **Auth:** GET (Authenticated), PUT/DELETE (Admin/Manager)

---

## 📊 Analytics Endpoints

### 25. `/api/analytics`
- **Methods:** GET
- **Description:** Get analytics data by date range
- **Auth:** Admin, Manager

### 26. `/api/analytics/dashboard`
- **Methods:** GET
- **Description:** Get dashboard analytics
- **Auth:** Admin, Manager

### 27. `/api/analytics/export`
- **Methods:** GET
- **Description:** Export analytics data
- **Auth:** Admin, Manager

---

## ⚙️ Settings Endpoints

### 28. `/api/settings/contact`
- **Methods:** GET
- **Description:** Get hotel contact information
- **Auth:** Public

---

## 🔔 Notifications Endpoints

### 29. `/api/notifications`
- **Methods:** GET, POST
- **Description:** List notifications, Create notification
- **Auth:** Authenticated

### 30. `/api/notifications/subscribe`
- **Methods:** POST
- **Description:** Subscribe to push notifications
- **Auth:** Authenticated

---

## 🏥 Health Check Endpoints

### 31. `/api/health/live`
- **Methods:** GET
- **Description:** Liveness probe
- **Auth:** Public

### 32. `/api/health/ready`
- **Methods:** GET
- **Description:** Readiness probe
- **Auth:** Public

---

## 🧪 Testing Endpoints

### 33. `/api/test-db`
- **Methods:** GET
- **Description:** Test database connection
- **Auth:** Public

### 34. `/api/test-db-comprehensive`
- **Methods:** GET
- **Description:** Comprehensive database test
- **Auth:** Public

### 35. `/api/test-simple`
- **Methods:** GET
- **Description:** Simple API test
- **Auth:** Public

### 36. `/api/test-minimal`
- **Methods:** GET
- **Description:** Minimal API test
- **Auth:** Public

### 37. `/api/debug`
- **Methods:** GET
- **Description:** Debug information
- **Auth:** Public

---

## 🔗 Webhooks Endpoints

### 38. `/api/webhooks/stripe`
- **Methods:** POST
- **Description:** Stripe webhook handler
- **Auth:** Stripe signature verification

---

## 🛠️ Utility Endpoints

### 39. `/api/contact`
- **Methods:** POST
- **Description:** Submit contact form
- **Auth:** Public

### 40. `/api/performance/metrics`
- **Methods:** GET, POST, OPTIONS
- **Description:** Performance metrics tracking
- **Auth:** Public

### 41. `/api/qr-codes/generate`
- **Methods:** GET, POST
- **Description:** Generate QR codes
- **Auth:** Authenticated

---

## 📈 Endpoint Statistics

### By HTTP Method

| Method | Count | Description |
|--------|-------|-------------|
| **GET** | ~45 | Retrieve data |
| **POST** | ~30 | Create data |
| **PUT** | ~12 | Update data |
| **DELETE** | ~12 | Delete data |
| **PATCH** | ~2 | Partial update |
| **OPTIONS** | ~3 | CORS preflight |

### By Authentication

| Auth Level | Count | Description |
|------------|-------|-------------|
| **Public** | ~15 | No authentication required |
| **Authenticated** | ~25 | Any authenticated user |
| **Staff** | ~8 | Staff, Manager, Admin |
| **Admin** | ~12 | Admin, Manager only |
| **Webhook** | ~1 | External service (Stripe) |

---

## 🔍 Endpoint Details

### Public Endpoints (No Auth Required)
- `/api/rooms` (GET)
- `/api/rooms/{id}` (GET)
- `/api/rooms/availability` (GET)
- `/api/rooms/check-availability` (GET, POST)
- `/api/restaurant/menu` (GET)
- `/api/restaurant/menu/{id}` (GET)
- `/api/settings/contact` (GET)
- `/api/health/live` (GET)
- `/api/health/ready` (GET)
- `/api/test-*` (GET)
- `/api/debug` (GET)
- `/api/contact` (POST)
- `/api/auth/register` (POST)
- `/api/auth/forgot-password` (POST)
- `/api/auth/reset-password` (POST)
- `/api/bookings` (POST) - Guest bookings
- `/api/restaurant/orders` (POST) - Guest orders

### Authenticated Endpoints (Any User)
- `/api/auth/session` (GET)
- `/api/bookings` (GET)
- `/api/bookings/{id}` (GET, PUT, DELETE)
- `/api/restaurant/orders` (GET)
- `/api/restaurant/orders/{id}` (GET, PUT, DELETE)
- `/api/tasks` (GET, POST)
- `/api/tasks/{id}` (GET, PUT, DELETE)
- `/api/inventory` (GET, POST)
- `/api/inventory/{id}` (GET, PUT, DELETE)
- `/api/gallery` (GET)
- `/api/gallery/{id}` (GET)
- `/api/notifications` (GET, POST)
- `/api/notifications/subscribe` (POST)
- `/api/qr-codes/generate` (GET, POST)

### Staff Endpoints (Staff, Manager, Admin)
- `/api/kitchen/orders` (GET, PUT)
- `/api/tasks` (All methods)
- `/api/inventory` (All methods)
- `/api/gallery` (POST)
- `/api/gallery/{id}` (PUT, DELETE)

### Admin Endpoints (Admin, Manager Only)
- `/api/rooms` (POST)
- `/api/rooms/{id}` (PUT, DELETE)
- `/api/restaurant/menu` (POST)
- `/api/restaurant/menu/{id}` (PUT, DELETE)
- `/api/staff` (GET, POST)
- `/api/analytics` (GET)
- `/api/analytics/dashboard` (GET)
- `/api/analytics/export` (GET)

---

## 📝 Notes

1. **Dynamic Routes**: Endpoints with `{id}` are dynamic routes (e.g., `/api/rooms/123`)
2. **NextAuth**: `/api/auth/[...nextauth]` is a catch-all route for NextAuth.js
3. **Webhooks**: `/api/webhooks/stripe` uses Stripe signature verification
4. **Health Checks**: Used for Kubernetes/Docker health probes
5. **Testing**: Test endpoints are for debugging and monitoring

---

## 🔗 Base URL

**Production:** `https://smarthotel-demo.vercel.app`  
**Local:** `http://localhost:3000`

---

**Total API Endpoints:** **41 route files** → **~60+ endpoints** (including different HTTP methods)

**Last Updated:** November 13, 2025

