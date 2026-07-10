# 🧪 Comprehensive Database Test API Guide

**Endpoint:** `/api/test-db-comprehensive`  
**Method:** `GET`  
**Purpose:** Test entire database connection and all models

---

## 🎯 What This API Tests

### 1. **Prisma Client Connection**
- Tests if Prisma Client can connect to postgresql
- Verifies DATABASE_URL is valid

### 2. **Database Ping**
- Tests if postgresql server is reachable
- Verifies network connectivity

### 3. **All Collections/Models**
Tests all 10 models in the database:
- ✅ User
- ✅ Room
- ✅ Booking
- ✅ FoodMenu
- ✅ FoodOrder
- ✅ Staff
- ✅ Task
- ✅ Inventory
- ✅ Gallery
- ✅ Setting

For each model, it:
- Counts total records
- Fetches a sample record (if available)
- Tests read operations

### 4. **Complex Query Test**
- Tests fetching bookings with related data
- Verifies relationship queries work
- Tests data integrity

### 5. **Read Operation Test**
- Tests basic read operations
- Verifies query execution

### 6. **Database Statistics**
- Aggregates counts from all collections
- Provides overview of database content

### 7. **Concurrent Queries Test**
- Tests multiple simultaneous queries
- Verifies connection pooling
- Tests performance under load

---

## 📡 API Endpoints

### Production
```
GET https://smarthotel-demo.vercel.app/api/test-db-comprehensive
```

### Local Development
```
GET http://localhost:3000/api/test-db-comprehensive
```

---

## 📋 Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "All database tests passed successfully",
  "timestamp": "2025-11-13T19:30:00.000Z",
  "summary": {
    "totalTests": 17,
    "successful": 17,
    "failed": 0,
    "skipped": 0,
    "totalDuration": "1250ms"
  },
  "collections": [
    {
      "name": "User",
      "count": 8590,
      "sample": {
        "id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "name": "Room",
      "count": 420,
      "sample": {
        "id": "...",
        "number": "101",
        "type": "Standard Room"
      }
    }
    // ... more collections
  ],
  "tests": [
    {
      "name": "Prisma Client Connection",
      "status": "success",
      "duration": 150
    },
    {
      "name": "Database Ping",
      "status": "success",
      "duration": 45
    }
    // ... more tests
  ],
  "databaseInfo": {
    "connectionString": "postgresql://user:pass@host:5432/db
    "databaseName": "smarthotel"
  }
}
```

### Error Response (500)

```json
{
  "success": false,
  "message": "2 test(s) failed",
  "timestamp": "2025-11-13T19:30:00.000Z",
  "summary": {
    "totalTests": 17,
    "successful": 15,
    "failed": 2,
    "skipped": 0,
    "totalDuration": "800ms"
  },
  "tests": [
    {
      "name": "Collection: User",
      "status": "failed",
      "duration": 200,
      "error": "empty database name not allowed"
    }
  ]
}
```

---

## 🚀 Usage

### Method 1: Using cURL

```bash
# Test production
curl https://smarthotel-demo.vercel.app/api/test-db-comprehensive | jq

# Test local
curl http://localhost:3000/api/test-db-comprehensive | jq
```

### Method 2: Using npm Script

```bash
# Test production
npm run db:test:production

# Test local (requires dev server running)
npm run db:test:comprehensive
```

### Method 3: Using Browser

1. Open browser
2. Navigate to: `https://smarthotel-demo.vercel.app/api/test-db-comprehensive`
3. View JSON response

### Method 4: Using Test Script

```bash
# Test production
node scripts/test-db-comprehensive.js

# Test custom URL
BASE_URL=http://localhost:3000 node scripts/test-db-comprehensive.js
```

---

## 🔍 What to Look For

### ✅ Success Indicators

1. **All tests pass:**
   - `success: true`
   - `failed: 0` in summary
   - All collections have `count` values

2. **Collections populated:**
   - User count > 0
   - Room count > 0
   - Other collections accessible

3. **Fast response:**
   - Total duration < 5 seconds
   - Individual tests < 1 second

### ❌ Failure Indicators

1. **Connection failures:**
   - `Prisma Client Connection` status: `failed`
   - Error: "empty database name not allowed"
   - Error: "Network access denied"

2. **Collection errors:**
   - Collection count: 0 with error message
   - Status: `failed` for specific collections

3. **Timeout errors:**
   - Duration very high (> 10 seconds)
   - Error: "Connection timeout"

---

## 🐛 Common Issues & Fixes

### Issue 1: "empty database name not allowed"

**Cause:** Connection string has line breaks or formatting issues

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Edit `DATABASE_URL`
3. Ensure it's **ALL ON ONE LINE**
4. Format: `postgresql://user:pass@host:5432/db
5. Save and redeploy

### Issue 2: "Network access denied"

**Cause:** postgresql Atlas IP whitelist blocking Vercel

**Fix:**
1. postgresql Atlas → Security → Network Access
2. Add `0.0.0.0/0`
3. Wait 2-3 minutes
4. Redeploy Vercel

### Issue 3: "Connection timeout"

**Cause:** Network connectivity issues or postgresql Atlas down

**Fix:**
1. Check postgresql Atlas cluster status
2. Verify connection string is correct
3. Check network connectivity

### Issue 4: Collection count is 0

**Cause:** Database is empty (not an error, just no data)

**Fix:**
1. Run seed script: `npm run db:seed:production`
2. Verify data was created

---

## 📊 Interpreting Results

### Example: All Tests Pass

```json
{
  "success": true,
  "summary": {
    "totalTests": 17,
    "successful": 17,
    "failed": 0
  }
}
```

**Meaning:** ✅ Database is fully functional

### Example: Some Tests Fail

```json
{
  "success": false,
  "summary": {
    "totalTests": 17,
    "successful": 15,
    "failed": 2
  },
  "tests": [
    {
      "name": "Collection: User",
      "status": "failed",
      "error": "empty database name not allowed"
    }
  ]
}
```

**Meaning:** ❌ Connection string issue - fix DATABASE_URL format

### Example: Connection Fails

```json
{
  "success": false,
  "tests": [
    {
      "name": "Prisma Client Connection",
      "status": "failed",
      "error": "Network access denied"
    }
  ]
}
```

**Meaning:** ❌ IP whitelist issue - add `0.0.0.0/0` to postgresql Atlas

---

## 🎯 Quick Test Commands

```bash
# Quick production test
curl -s https://smarthotel-demo.vercel.app/api/test-db-comprehensive | jq '.success, .summary'

# Full production test with details
npm run db:test:production

# Test specific collection
curl -s https://smarthotel-demo.vercel.app/api/test-db-comprehensive | jq '.collections[] | select(.name == "User")'

# Check for errors
curl -s https://smarthotel-demo.vercel.app/api/test-db-comprehensive | jq '.tests[] | select(.status == "failed")'
```

---

## 📝 Test Checklist

After fixing DATABASE_URL, verify:

- [ ] `/api/test-db-comprehensive` returns JSON (not HTML)
- [ ] `success: true` in response
- [ ] All collections have counts
- [ ] No failed tests
- [ ] Total duration < 5 seconds
- [ ] Database name is correct in `databaseInfo`

---

## 🔗 Related Endpoints

- `/api/test-db` - Basic connection test
- `/api/debug` - Environment and connection debug
- `/api/health/ready` - Health check with database

---

## 📚 Example Output

### Successful Test

```
🚀 Comprehensive Database Connection Test
==================================================
📍 Testing: https://smarthotel-demo.vercel.app/api/test-db-comprehensive

📊 HTTP Status: 200

✅ ALL TESTS PASSED!

📋 Summary:
   Total Tests: 17
   ✅ Successful: 17
   ❌ Failed: 0
   ⏭️  Skipped: 0
   ⏱️  Duration: 1250ms

📊 Collection Statistics:
   ✅ User: 8590 records
   ✅ Room: 420 records
   ✅ Booking: 150 records
   ✅ FoodMenu: 140 records
   ✅ FoodOrder: 50 records
   ✅ Staff: 20 records
   ✅ Task: 30 records
   ✅ Inventory: 15 records
   ✅ Gallery: 12 records
   ✅ Setting: 6 records
```

---

**Endpoint Created:** `/api/test-db-comprehensive`  
**Test Script:** `scripts/test-db-comprehensive.js`  
**NPM Command:** `npm run db:test:production`

