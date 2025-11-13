# 📋 SmartHotel API Endpoints - Complete List

**Date:** November 13, 2025  
**Total Route Files:** 41  
**Total HTTP Methods:** ~73 (including different HTTP methods per route)

---

## 📊 Summary

| Category | Route Files | HTTP Methods | Description |
|----------|-------------|--------------|-------------|
| **Authentication** | 6 | 8 | Session, Register, Login, Password Reset |
| **Rooms** | 4 | 7 | List, Detail, Availability |
| **Bookings** | 2 | 5 | List, Detail, CRUD |
| **Restaurant** | 4 | 7 | Menu, Orders |
| **Kitchen** | 1 | 2 | Orders Management |
| **Staff** | 1 | 2 | Staff Management |
| **Tasks** | 2 | 6 | Task Management |
| **Inventory** | 2 | 5 | Inventory Management |
| **Gallery** | 2 | 5 | Gallery Management |
| **Analytics** | 3 | 3 | Analytics, Dashboard, Export |
| **Settings** | 1 | 1 | Contact Info |
| **Notifications** | 2 | 5 | Notifications, Subscribe |
| **Health** | 2 | 2 | Liveness, Readiness |
| **Testing** | 5 | 5 | Test Endpoints |
| **Webhooks** | 1 | 1 | Stripe Webhook |
| **Utilities** | 3 | 6 | Contact, Performance, QR Codes |
| **Total** | **41** | **~73** | **All Endpoints** |

---

## 🔐 Authentication Endpoints (6 routes, 8 methods)

### 1. `/api/auth/[...nextauth]`
- **Methods:** GET, POST
- **Description:** NextAuth.js authentication handler
- **Features:** Login, Logout, OAuth, Session Management
- **Auth:** Public

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
- **Methods:** GET, POST
- **Description:** Authentication logging
- **Auth:** Internal

---

## 🏨 Rooms Endpoints (4 routes, 7 methods)

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

## 📅 Bookings Endpoints (2 routes, 5 methods)

### 11. `/api/bookings`
- **Methods:** GET, POST
- **Description:** List all bookings, Create booking
- **Auth:** GET (Authenticated), POST (Public/Guest)

### 12. `/api/bookings/{id}`
- **Methods:** GET, PATCH, DELETE
- **Description:** Get, Update, Delete booking
- **Auth:** GET (Owner/Staff), PATCH/DELETE (Owner/Admin)

---

## 🍽️ Restaurant Endpoints (4 routes, 7 methods)

### 13. `/api/restaurant/menu`
- **Methods:** GET, POST
- **Description:** List all menu items, Create menu item
- **Auth:** GET (Public), POST (Admin/Manager)

### 14. `/api/restaurant/menu/{id}`
- **Methods:** GET, PUT, PATCH, DELETE
- **Description:** Get, Update, Delete menu item
- **Auth:** GET (Public), PUT/PATCH/DELETE (Admin/Manager)

### 15. `/api/restaurant/orders`
- **Methods:** GET, POST, PATCH
- **Description:** List all orders, Create order, Update orders
- **Auth:** GET (Authenticated), POST (Public/Guest), PATCH (Staff)

### 16. `/api/restaurant/orders/{id}`
- **Methods:** GET, PATCH
- **Description:** Get, Update order
- **Auth:** GET (Owner/Staff), PATCH (Owner/Staff)

---

## 👨‍🍳 Kitchen Endpoints (1 route, 2 methods)

### 17. `/api/kitchen/orders`
- **Methods:** GET, PUT
- **Description:** List kitchen orders, Update order status
- **Auth:** Kitchen Staff, Manager

---

## 👥 Staff Endpoints (1 route, 2 methods)

### 18. `/api/staff`
- **Methods:** GET, POST
- **Description:** List all staff, Create staff member
- **Auth:** Admin, Manager

---

## ✅ Tasks Endpoints (2 routes, 6 methods)

### 19. `/api/tasks`
- **Methods:** GET, POST
- **Description:** List all tasks, Create task
- **Auth:** Authenticated

### 20. `/api/tasks/{id}`
- **Methods:** GET, PUT, PATCH, DELETE
- **Description:** Get, Update, Delete task
- **Auth:** Authenticated

---

## 📦 Inventory Endpoints (2 routes, 5 methods)

### 21. `/api/inventory`
- **Methods:** GET, POST
- **Description:** List all inventory items, Create inventory item
- **Auth:** Authenticated

### 22. `/api/inventory/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete inventory item
- **Auth:** Authenticated

---

## 🖼️ Gallery Endpoints (2 routes, 5 methods)

### 23. `/api/gallery`
- **Methods:** GET, POST
- **Description:** List all gallery items, Create gallery item
- **Auth:** GET (Authenticated), POST (Admin/Manager)

### 24. `/api/gallery/{id}`
- **Methods:** GET, PUT, DELETE
- **Description:** Get, Update, Delete gallery item
- **Auth:** GET (Authenticated), PUT/DELETE (Admin/Manager)

---

## 📊 Analytics Endpoints (3 routes, 3 methods)

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

## ⚙️ Settings Endpoints (1 route, 1 method)

### 28. `/api/settings/contact`
- **Methods:** GET
- **Description:** Get hotel contact information
- **Auth:** Public

---

## 🔔 Notifications Endpoints (2 routes, 5 methods)

### 29. `/api/notifications`
- **Methods:** GET, POST, PUT, PATCH
- **Description:** List notifications, Create notification, Update notification
- **Auth:** Authenticated

### 30. `/api/notifications/subscribe`
- **Methods:** POST
- **Description:** Subscribe to push notifications
- **Auth:** Authenticated

---

## 🏥 Health Check Endpoints (2 routes, 2 methods)

### 31. `/api/health/live`
- **Methods:** GET
- **Description:** Liveness probe
- **Auth:** Public

### 32. `/api/health/ready`
- **Methods:** GET
- **Description:** Readiness probe
- **Auth:** Public

---

## 🧪 Testing Endpoints (5 routes, 5 methods)

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

## 🔗 Webhooks Endpoints (1 route, 1 method)

### 38. `/api/webhooks/stripe`
- **Methods:** POST
- **Description:** Stripe webhook handler
- **Auth:** Stripe signature verification

---

## 🛠️ Utility Endpoints (3 routes, 6 methods)

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

## 📈 HTTP Method Breakdown

| Method | Count | Description |
|--------|-------|-------------|
| **GET** | ~45 | Retrieve data |
| **POST** | ~30 | Create data |
| **PUT** | ~8 | Update data (full) |
| **PATCH** | ~6 | Update data (partial) |
| **DELETE** | ~12 | Delete data |
| **OPTIONS** | ~2 | CORS preflight |
| **Total** | **~103** | **All methods** |

---

## 🔐 Authentication Breakdown

| Auth Level | Count | Description |
|------------|-------|-------------|
| **Public** | ~18 | No authentication required |
| **Authenticated** | ~25 | Any authenticated user |
| **Staff** | ~10 | Staff, Manager, Admin |
| **Admin** | ~15 | Admin, Manager only |
| **Webhook** | ~1 | External service (Stripe) |
| **Internal** | ~1 | Internal use only |

---

## 📝 Complete Endpoint List

### Public Endpoints (No Auth Required)
1. GET `/api/rooms`
2. GET `/api/rooms/{id}`
3. GET `/api/rooms/availability`
4. GET,POST `/api/rooms/check-availability`
5. GET `/api/restaurant/menu`
6. GET `/api/restaurant/menu/{id}`
7. GET `/api/settings/contact`
8. GET `/api/health/live`
9. GET `/api/health/ready`
10. GET `/api/test-db`
11. GET `/api/test-db-comprehensive`
12. GET `/api/test-simple`
13. GET `/api/test-minimal`
14. GET `/api/debug`
15. POST `/api/contact`
16. GET,POST,OPTIONS `/api/performance/metrics`
17. GET,POST `/api/auth/[...nextauth]`
18. POST `/api/auth/register`
19. POST `/api/auth/forgot-password`
20. POST `/api/auth/reset-password`
21. POST `/api/bookings` (Guest bookings)
22. POST `/api/restaurant/orders` (Guest orders)

### Authenticated Endpoints (Any User)
23. GET `/api/auth/session`
24. GET `/api/bookings`
25. GET,PATCH,DELETE `/api/bookings/{id}`
26. GET `/api/restaurant/orders`
27. GET,PATCH `/api/restaurant/orders/{id}`
28. GET,POST `/api/tasks`
29. GET,PUT,PATCH,DELETE `/api/tasks/{id}`
30. GET,POST `/api/inventory`
31. GET,PUT,DELETE `/api/inventory/{id}`
32. GET `/api/gallery`
33. GET `/api/gallery/{id}`
34. GET,POST,PUT,PATCH `/api/notifications`
35. POST `/api/notifications/subscribe`
36. GET,POST `/api/qr-codes/generate`

### Staff Endpoints (Staff, Manager, Admin)
37. GET,PUT `/api/kitchen/orders`
38. POST `/api/gallery`
39. PUT,DELETE `/api/gallery/{id}`
40. PATCH `/api/restaurant/orders`
41. PATCH `/api/restaurant/orders/{id}`

### Admin Endpoints (Admin, Manager Only)
42. POST `/api/rooms`
43. PUT,DELETE `/api/rooms/{id}`
44. POST `/api/restaurant/menu`
45. PUT,PATCH,DELETE `/api/restaurant/menu/{id}`
46. GET,POST `/api/staff`
47. GET `/api/analytics`
48. GET `/api/analytics/dashboard`
49. GET `/api/analytics/export`

### Webhook Endpoints
50. POST `/api/webhooks/stripe`

---

## 🔗 Base URLs

**Production:** `https://smarthotel-demo.vercel.app`  
**Local:** `http://localhost:3000`

---

## 📊 Statistics

- **Total Route Files:** 41
- **Total HTTP Methods:** ~73
- **Total Unique Endpoints:** 41
- **Public Endpoints:** ~22
- **Authenticated Endpoints:** ~14
- **Staff Endpoints:** ~5
- **Admin Endpoints:** ~8
- **Webhook Endpoints:** 1
- **Testing Endpoints:** 5

---

**Last Updated:** November 13, 2025

