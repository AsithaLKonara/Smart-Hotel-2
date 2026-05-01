# 🗄️ SmartHotel Database Deep Dive Analysis

**Analysis Date:** November 13, 2025  
**Database Type:** MongoDB (via Prisma ORM)  
**Status:** ⚠️ Not Configured in Production

---

## 📊 Executive Summary

### Current State
- **Database Provider:** MongoDB (MongoDB Atlas recommended)
- **ORM:** Prisma Client v5.7.1
- **Connection Status:** ❌ `DATABASE_URL` not configured in Vercel
- **Schema Status:** ✅ Defined and valid
- **Migrations:** ⚠️ No migrations folder (using `prisma db push`)
- **Seed Data:** ✅ Available (3 seed scripts)

### Critical Issues
1. ❌ **DATABASE_URL not set in Vercel** - All database operations fail
2. ⚠️ **Some APIs don't check DATABASE_URL** - Return HTML 500 errors instead of JSON
3. ⚠️ **No database migrations** - Using `db push` (not recommended for production)
4. ⚠️ **No connection pooling configuration** - Default Prisma settings

---

## 🏗️ Database Architecture

### Technology Stack

```
┌─────────────────────────────────────────┐
│         Next.js Application            │
│  (app/api/*, lib/*, components/*)      │
└──────────────┬──────────────────────────┘
               │
               │ Prisma Client
               │ (@prisma/client)
               ▼
┌─────────────────────────────────────────┐
│         Prisma Schema                   │
│    (prisma/schema.prisma)              │
└──────────────┬──────────────────────────┘
               │
               │ MongoDB Driver
               ▼
┌─────────────────────────────────────────┐
│      MongoDB Atlas / MongoDB            │
│    (mongodb:// or mongodb+srv://)      │
└─────────────────────────────────────────┘
```

### Database Provider: MongoDB

**Why MongoDB?**
- Document-based storage (flexible schema)
- Good for hotel management (nested data like amenities, images)
- Scalable for high-traffic scenarios
- Prisma supports MongoDB natively

**Connection String Format:**
```env
# Local MongoDB
DATABASE_URL="mongodb://localhost:27017/smarthotel"

# MongoDB Atlas (Cloud)
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smarthotel?retryWrites=true&w=majority"
```

---

## 📋 Database Schema Analysis

### Models Overview

The schema defines **10 models**:

| Model | Purpose | Key Fields | Relations |
|-------|---------|------------|-----------|
| **User** | Authentication & user management | `email`, `role`, `password` | None (referenced by `userId` in other models) |
| **Room** | Hotel room inventory | `number`, `type`, `price`, `status` | None (referenced by `roomId` in Booking) |
| **Booking** | Guest reservations | `checkIn`, `checkOut`, `status`, `totalAmount` | References `userId`, `roomId` |
| **FoodMenu** | Restaurant menu items | `name`, `category`, `price`, `available` | None |
| **FoodOrder** | Restaurant orders | `status`, `totalAmount`, `guestId` | References `guestId` |
| **Staff** | Employee management | `employeeId`, `department`, `position` | None (referenced by `assignedTo` in Task) |
| **Task** | Housekeeping & maintenance tasks | `title`, `status`, `priority`, `type` | References `assignedTo`, `createdBy` |
| **Inventory** | Stock management | `name`, `quantity`, `minQuantity`, `status` | None |
| **Gallery** | Hotel image gallery | `title`, `imageUrl`, `category` | None |
| **Setting** | Application settings | `key`, `value` | None |

### Schema Details

#### 1. User Model
```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt DateTime @db.Date
  email     String
  name      String
  password  String   // Hashed with bcrypt
  phone     String
  role      String   // 'GUEST' | 'STAFF' | 'MANAGER' | 'SUPER_ADMIN' | 'RECEPTIONIST'
  updatedAt DateTime @db.Date
}
```

**Issues:**
- ⚠️ `email` is not unique (should be `@unique`)
- ⚠️ No indexes defined (should index `email` for login)
- ✅ Password is hashed (bcrypt)
- ✅ Roles are string-based (flexible)

#### 2. Room Model
```prisma
model Room {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  amenities   String[] // Array of strings
  capacity    BigInt   // Number of guests
  createdAt   DateTime @db.Date
  description String
  floor       BigInt
  images      String[] // Array of image URLs
  number      String   // Room number (e.g., "101")
  price       Float
  size        BigInt   // Room size in square meters
  status      String   // 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING' | 'RESERVED'
  type        String   // 'Standard' | 'Deluxe' | 'Suite' | 'Presidential'
  updatedAt   DateTime @db.Date
}
```

**Issues:**
- ⚠️ `number` is not unique (should be `@unique`)
- ⚠️ `status` and `type` are strings (should be enums or validated)
- ⚠️ `capacity`, `floor`, `size` are `BigInt` (causes TypeScript issues)
- ✅ Arrays for `amenities` and `images` are good

#### 3. Booking Model
```prisma
model Booking {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  checkIn         DateTime @db.Date
  checkOut        DateTime @db.Date
  createdAt       DateTime @db.Date
  guests          BigInt
  paymentMethod   String
  paymentStatus   String   // 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  roomId          String   @db.ObjectId
  specialRequests String?
  status          String   // 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
  totalAmount     Float
  updatedAt       DateTime @db.Date
  userId          String   @db.ObjectId
}
```

**Issues:**
- ⚠️ No relations defined (should have `room` and `user` relations)
- ⚠️ `status` and `paymentStatus` are strings (should be enums)
- ⚠️ `guests` is `BigInt` (should be `Int`)
- ⚠️ No indexes on `checkIn`, `checkOut`, `status` (performance issue)

#### 4. FoodMenu Model
```prisma
model FoodMenu {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  available       Boolean
  category        String   // 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'BEVERAGES' | 'SNACKS'
  createdAt       DateTime @db.Date
  description     String
  name            String
  preparationTime BigInt   // Minutes
  price           Float
  updatedAt       DateTime @db.Date
}
```

**Issues:**
- ⚠️ `category` is string (should be enum)
- ⚠️ `preparationTime` is `BigInt` (should be `Int`)
- ⚠️ No `image` field (but seed scripts try to use it)

#### 5. FoodOrder Model
```prisma
model FoodOrder {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt       DateTime @db.Date
  deliveryTime    DateTime @db.Date
  guestId         String   @db.ObjectId
  roomNumber      String
  specialRequests String
  status          String   // 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  totalAmount     Float
  updatedAt       DateTime @db.Date
}
```

**Issues:**
- ⚠️ No relation to `FoodMenu` (no `items` relation)
- ⚠️ `status` is string (should be enum)
- ⚠️ No `OrderItem` model (how are menu items linked?)

#### 6. Staff Model
```prisma
model Staff {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt  DateTime @db.Date
  department String
  email      String
  employeeId String   // Should be unique
  hireDate   DateTime @db.Date
  isActive   Boolean
  name       String
  phone      String
  position   String
  salary     Float
  updatedAt  DateTime @db.Date
}
```

**Issues:**
- ⚠️ `employeeId` is not unique (should be `@unique`)
- ⚠️ `email` is not unique (should be `@unique`)

#### 7. Task Model
```prisma
model Task {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  assignedTo  String    @db.ObjectId
  completedAt DateTime? @db.Date
  createdAt   DateTime  @db.Date
  createdBy   String    @db.ObjectId
  description String
  dueDate     DateTime  @db.Date
  priority    String    // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status      String    // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  title       String
  type        String    // 'CLEANING' | 'MAINTENANCE' | 'ROOM_SERVICE' | 'CONCIERGE' | 'OTHER'
  updatedAt   DateTime  @db.Date
}
```

**Issues:**
- ⚠️ No relations to `Staff` or `User` (should have `staff` and `user` relations)
- ⚠️ `status`, `priority`, `type` are strings (should be enums)

#### 8. Inventory Model
```prisma
model Inventory {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  category    String
  createdAt   DateTime @db.Date
  description String
  minQuantity BigInt
  name        String
  quantity    BigInt
  status      String   // 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  unit        String
  updatedAt   DateTime @db.Date
}
```

**Issues:**
- ⚠️ `quantity` and `minQuantity` are `BigInt` (should be `Int`)
- ⚠️ `status` is string (should be enum)

#### 9. Gallery Model
```prisma
model Gallery {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  category  String   // 'ROOM' | 'RESTAURANT' | 'FACILITY' | 'EVENT'
  createdAt DateTime @db.Date
  imageUrl  String
  title     String
  updatedAt DateTime @db.Date
}
```

**Issues:**
- ⚠️ `category` is string (should be enum)

#### 10. Setting Model
```prisma
model Setting {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  key   String // Should be unique
  value String
}
```

**Issues:**
- ⚠️ `key` is not unique (should be `@unique`)

---

## 🔍 Missing Models (Referenced but Not Defined)

These models are referenced in code but **don't exist** in the schema:

1. ❌ **Invoice** - Referenced in analytics, bookings
2. ❌ **OrderItem** - Referenced in restaurant orders
3. ❌ **Notification** - Referenced in kitchen orders
4. ❌ **AuditLog** - Referenced in audit logging
5. ❌ **EmailLog** - Referenced in email sending
6. ❌ **EmailTemplate** - Referenced in email system
7. ❌ **GuestReview** - Referenced in analytics
8. ❌ **Wishlist** - Referenced in user features
9. ❌ **RoomImage** - Referenced in room details
10. ❌ **RoomFeature** - Referenced in room features
11. ❌ **Promotion** - Referenced in promotions

**Impact:** Code has been commented out or uses mock data for these models.

---

## 🔗 Missing Relations

The schema defines **no relations** between models. This causes:

1. **Cannot use Prisma `include`** - Must fetch related data separately
2. **No referential integrity** - MongoDB doesn't enforce foreign keys
3. **Manual joins required** - More complex queries
4. **Type safety issues** - TypeScript can't infer relations

**Example:**
```typescript
// ❌ This doesn't work (no relation defined)
const booking = await prisma.booking.findUnique({
  where: { id },
  include: { room: true, user: true }
})

// ✅ Must do this instead
const booking = await prisma.booking.findUnique({ where: { id } })
const room = await prisma.room.findUnique({ where: { id: booking.roomId } })
const user = await prisma.user.findUnique({ where: { id: booking.userId } })
```

---

## 🛠️ Database Connection & Configuration

### Connection Setup (`lib/db.ts`)

```typescript
const prismaLogger = globalForPrisma.prisma ?? new PrismaClient({
  log: logDefinitions,
})
```

**Features:**
- ✅ Singleton pattern (prevents multiple connections)
- ✅ Logging configured (errors in prod, queries in dev)
- ✅ Performance tracking for queries

**Issues:**
- ⚠️ No connection pooling configuration
- ⚠️ No timeout settings
- ⚠️ No retry logic

### Database Helpers (`lib/db-helpers.ts`)

**Functions:**
1. `isDatabaseConfigured()` - Checks if `DATABASE_URL` exists
2. `getDatabaseErrorMessage()` - User-friendly error messages
3. `executeDatabaseQuery()` - Safe query wrapper with error handling

**Usage:**
```typescript
// ✅ Good - Checks before query
if (!isDatabaseConfigured()) {
  return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
}

// ❌ Bad - No check (will throw error)
const rooms = await prisma.room.findMany()
```

### API Route Coverage

**APIs that check DATABASE_URL:**
- ✅ `/api/rooms` - Uses `isDatabaseConfigured()`
- ✅ `/api/rooms/availability` - Uses `isDatabaseConfigured()`
- ✅ `/api/restaurant/menu` - Uses `isDatabaseConfigured()`
- ✅ `/api/settings/contact` - Uses `isDatabaseConfigured()`

**APIs that DON'T check DATABASE_URL:**
- ❌ `/api/bookings` - No check (will throw error)
- ❌ `/api/auth/*` - No check (NextAuth handles it)
- ❌ `/api/staff` - No check
- ❌ `/api/tasks` - No check
- ❌ `/api/inventory` - No check
- ❌ `/api/gallery` - No check
- ❌ `/api/kitchen/orders` - No check

**Impact:** APIs without checks return HTML 500 errors instead of JSON.

---

## 📦 Seed Data

### Available Seed Scripts

1. **`prisma/seed.ts`** - Basic seed (4 users, 3 staff, 5 rooms, 3 bookings)
2. **`prisma/seed-comprehensive.ts`** - Full demo dataset (10+ users, 20+ rooms, etc.)
3. **`prisma/seed-production.ts`** - Production-ready seed

### Seed Data Summary

**Users:**
- `admin@smarthotel.com` / `admin123` (SUPER_ADMIN)
- `manager@smarthotel.com` / `manager123` (MANAGER)
- `receptionist@smarthotel.com` / `receptionist123` (RECEPTIONIST)
- `guest@example.com` / `guest123` (GUEST)

**Rooms:**
- Standard Room (101, 103) - $150/night
- Deluxe Room (102) - $200/night
- Suite (201) - $350/night
- Presidential Suite (301) - $500/night

**Menu Items:**
- Breakfast, Lunch, Dinner, Beverages, Snacks categories
- 6+ items with prices and preparation times

### Running Seeds

```bash
# Basic seed
npm run db:seed

# Comprehensive demo seed
npm run db:seed:demo

# Production seed
npm run db:seed:production
```

---

## 🔧 Database Scripts

### Available Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `debug-db-connection.js` | Test MongoDB connection | `npm run db:debug` |
| `quick-db-test.js` | Quick connection test | `npm run db:test` |
| `setup-production-database.js` | Setup production DB | `npm run db:setup:production` |
| `check-mongodb-access.js` | Check MongoDB access | (manual) |
| `test-db-connection.js` | Test DB connection | (manual) |
| `backup-db.js` | Backup database | (manual) |
| `database-analysis.js` | Analyze database | (manual) |

### Testing Database Connection

```bash
# Quick test
npm run db:test

# Debug connection
npm run db:debug

# Validate environment
npm run validate:env
```

---

## 🚨 Current Issues & Fixes

### Issue 1: DATABASE_URL Not Configured

**Problem:**
- `DATABASE_URL` environment variable is not set in Vercel
- All database operations fail
- APIs return 500 errors

**Fix:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `DATABASE_URL`:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smarthotel?retryWrites=true&w=majority
   ```
3. Redeploy application

**Verification:**
```bash
# Test connection
npm run db:test

# Check debug endpoint
curl https://smarthotel-demo.vercel.app/api/debug
```

### Issue 2: APIs Return HTML Instead of JSON

**Problem:**
- Some APIs don't check `DATABASE_URL` before querying
- Errors cause Next.js to return HTML error pages
- Frontend can't parse HTML responses

**Fix:**
Add database check to all API routes:
```typescript
import { isDatabaseConfigured } from '@/lib/db-helpers'

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }
  // ... rest of code
}
```

**APIs to Fix:**
- `/api/bookings`
- `/api/staff`
- `/api/tasks`
- `/api/inventory`
- `/api/gallery`
- `/api/kitchen/orders`

### Issue 3: No Database Migrations

**Problem:**
- Using `prisma db push` (not recommended for production)
- No migration history
- Can't rollback changes

**Fix:**
1. Initialize migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
2. Use migrations for all schema changes:
   ```bash
   npx prisma migrate dev --name add_user_email_unique
   ```
3. Deploy migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Issue 4: Missing Unique Constraints

**Problem:**
- `User.email` is not unique (can have duplicate emails)
- `Room.number` is not unique (can have duplicate room numbers)
- `Staff.employeeId` is not unique

**Fix:**
Update schema:
```prisma
model User {
  email String @unique
  // ...
}

model Room {
  number String @unique
  // ...
}

model Staff {
  employeeId String @unique
  email String @unique
  // ...
}
```

### Issue 5: BigInt Type Issues

**Problem:**
- `capacity`, `floor`, `size`, `guests`, `quantity` are `BigInt`
- Causes TypeScript errors (can't assign to `number`)
- Frontend expects `number`

**Fix:**
Change to `Int`:
```prisma
model Room {
  capacity Int
  floor Int
  size Int
  // ...
}

model Booking {
  guests Int
  // ...
}

model Inventory {
  quantity Int
  minQuantity Int
  // ...
}
```

### Issue 6: No Indexes

**Problem:**
- No indexes on frequently queried fields
- Slow queries on large datasets

**Fix:**
Add indexes:
```prisma
model User {
  email String @unique @index
  // ...
}

model Booking {
  checkIn DateTime @index
  checkOut DateTime @index
  status String @index
  userId String @index
  roomId String @index
  // ...
}

model Room {
  number String @unique @index
  status String @index
  type String @index
  // ...
}
```

---

## 📊 Database Performance

### Current Performance Issues

1. **No Connection Pooling** - Each request creates new connection
2. **No Query Optimization** - No indexes on common queries
3. **N+1 Query Problem** - Fetching related data separately
4. **No Caching** - Every request hits database

### Recommendations

1. **Add Connection Pooling:**
   ```typescript
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   })
   ```

2. **Add Indexes** (see Issue 6 above)

3. **Use Prisma Relations** (if possible with MongoDB)

4. **Implement Caching:**
   - Redis for frequently accessed data
   - Cache room availability
   - Cache menu items

5. **Query Optimization:**
   - Use `select` to fetch only needed fields
   - Use pagination for large datasets
   - Batch queries when possible

---

## 🔐 Security Considerations

### Current Security Status

**Good:**
- ✅ Passwords are hashed (bcrypt)
- ✅ No SQL injection (Prisma handles it)
- ✅ Connection string not exposed in client

**Issues:**
- ⚠️ No rate limiting on database queries
- ⚠️ No query timeout (can hang indefinitely)
- ⚠️ No input validation at database level
- ⚠️ No audit logging (AuditLog model doesn't exist)

### Recommendations

1. **Add Query Timeouts:**
   ```typescript
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   })
   
   // Add timeout wrapper
   async function queryWithTimeout<T>(
     query: () => Promise<T>,
     timeout: number = 5000
   ): Promise<T> {
     return Promise.race([
       query(),
       new Promise<T>((_, reject) =>
         setTimeout(() => reject(new Error('Query timeout')), timeout)
       ),
     ])
   }
   ```

2. **Add Input Validation:**
   - Use Zod schemas (already in use)
   - Validate at API level before database

3. **Add Audit Logging:**
   - Create AuditLog model
   - Log all database changes
   - Track user actions

4. **Secure Connection String:**
   - Use MongoDB Atlas IP whitelist
   - Use strong passwords
   - Rotate credentials regularly

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Set `DATABASE_URL` in Vercel environment variables
- [ ] Test database connection locally
- [ ] Run database migrations (if using)
- [ ] Seed production database
- [ ] Verify all APIs check `DATABASE_URL`
- [ ] Test all database operations

### Post-Deployment

- [ ] Verify database connection in production
- [ ] Check `/api/debug` endpoint
- [ ] Test authentication flow
- [ ] Test booking creation
- [ ] Monitor database performance
- [ ] Set up database backups

---

## 📝 Next Steps

### Immediate (P0)

1. **Set DATABASE_URL in Vercel**
   - Get MongoDB Atlas connection string
   - Add to Vercel environment variables
   - Redeploy application

2. **Fix API Error Handling**
   - Add `isDatabaseConfigured()` check to all APIs
   - Ensure all errors return JSON (not HTML)

3. **Test Database Connection**
   - Run `npm run db:test`
   - Check `/api/debug` endpoint
   - Verify seed data loads

### Short-term (P1)

4. **Add Unique Constraints**
   - `User.email`
   - `Room.number`
   - `Staff.employeeId` and `Staff.email`
   - `Setting.key`

5. **Fix BigInt Types**
   - Change to `Int` where appropriate
   - Update TypeScript code

6. **Add Database Migrations**
   - Initialize migrations
   - Create initial migration
   - Set up migration deployment

### Long-term (P2)

7. **Add Indexes**
   - Index frequently queried fields
   - Monitor query performance

8. **Add Relations** (if possible)
   - Define Prisma relations
   - Update code to use `include`

9. **Implement Caching**
   - Add Redis for caching
   - Cache frequently accessed data

10. **Add Audit Logging**
    - Create AuditLog model
    - Log all database changes

---

## 📚 Resources

### Documentation
- [Prisma MongoDB Guide](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### Scripts
- `npm run db:test` - Test connection
- `npm run db:debug` - Debug connection
- `npm run db:seed` - Seed database
- `npm run validate:env` - Validate environment

### Debug Endpoints
- `/api/debug` - Database connection status
- `/api/health/ready` - Health check with DB

---

## 🎯 Summary

### Current State
- ✅ Schema defined and valid
- ✅ Seed scripts available
- ✅ Database helpers implemented
- ❌ DATABASE_URL not configured
- ❌ Some APIs don't check DATABASE_URL
- ⚠️ No migrations
- ⚠️ Missing unique constraints
- ⚠️ Type issues (BigInt)

### Priority Actions
1. **Configure DATABASE_URL** (Critical)
2. **Fix API error handling** (Critical)
3. **Add unique constraints** (High)
4. **Fix type issues** (High)
5. **Add migrations** (Medium)
6. **Add indexes** (Medium)

---

**End of Database Deep Dive**

