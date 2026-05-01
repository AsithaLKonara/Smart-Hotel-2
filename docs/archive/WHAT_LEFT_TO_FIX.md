# 🔧 What's Left to Fix

**Date:** November 13, 2025  
**Based on:** E2E QA Testing Results

---

## 🔴 CRITICAL (Must Fix Now)

### 1. BigInt Serialization Error - Room Availability API
**File:** `app/api/rooms/availability/route.ts`  
**Line:** 146-147  
**Issue:** Spreading `...room` includes BigInt fields that can't be serialized  
**Fix:** Convert `capacity`, `floor`, `size` to Number before returning

### 2. BigInt Serialization Error - Rooms API  
**File:** `app/api/rooms/route.ts`  
**Line:** 110, 119  
**Issue:** Returning room objects with BigInt fields  
**Fix:** Convert BigInt fields to Number before JSON response

---

## 🟡 HIGH PRIORITY

### 3. Restaurant Menu Empty
**File:** `app/api/restaurant/menu/route.ts`  
**Issue:** API returns empty array `[]`  
**Possible Causes:**
- No menu items in database
- Query failing silently
- Filter too restrictive

**Action:** Verify menu items exist, check query logic

---

## 🟢 LOW PRIORITY

### 4. Service Worker Registration Failed
**Issue:** PWA features may not work  
**Impact:** Low - not critical for core functionality

### 5. Google Maps Iframe Blocked
**Issue:** Maps don't display  
**Impact:** Low - optional feature

---

## 📊 Summary

| Priority | Issue | Files | Status |
|----------|-------|-------|--------|
| 🔴 Critical | BigInt serialization | 2 files | ❌ Not Fixed |
| 🟡 High | Menu empty | 1 file | ❌ Not Fixed |
| 🟢 Low | Service Worker | 1 file | ⚠️ Minor |
| 🟢 Low | Google Maps | 1 file | ⚠️ Minor |

---

## ⏱️ Estimated Fix Time

- **BigInt fixes:** 15 minutes (2 files)
- **Menu investigation:** 10 minutes  
- **Total critical fixes:** ~25 minutes

---

## ✅ Already Fixed

- ✅ Homepage 500 error (logger fix)
- ✅ Database connection
- ✅ Environment variables
- ✅ Deployment successful

---

**Next Action:** Fix BigInt serialization in both room APIs immediately

