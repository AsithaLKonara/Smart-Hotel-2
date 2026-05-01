# 🧪 CRUD Features Manual Testing Checklist

**Date:** 2025-11-15  
**Deployment URL:** https://smarthotel-demo.vercel.app/  
**Test Type:** Manual Browser Testing

---

## 🔐 **STEP 1: Authentication**

### Login Credentials
- **Super Admin:** `admin@smarthotel.com` / `admin123`
- **Manager:** `manager@smarthotel.com` / `manager123`

**Action:** Log in to the admin dashboard
- [ ] Navigate to `/auth/signin`
- [ ] Enter credentials
- [ ] Click "Sign In"
- [ ] Successfully redirected to `/admin/dashboard`

---

## 📋 **STEP 2: Test Hotel Settings CRUD**

### Access Page
- [ ] Navigate to `/admin/settings`
- [ ] Page loads without errors
- [ ] All form fields are visible

### Test READ
- [ ] Hotel name is displayed
- [ ] Contact info is displayed
- [ ] Check-in/out times are displayed
- [ ] Coordinates are displayed
- [ ] About content is displayed

### Test UPDATE
- [ ] Update hotel name → Click "Save Settings"
- [ ] Verify toast notification appears: "Settings saved successfully"
- [ ] Refresh page → Verify changes persist
- [ ] Update phone number → Save → Verify persistence
- [ ] Update check-in time → Save → Verify persistence

**Expected Result:** ✅ All settings save and persist correctly

---

## ❓ **STEP 3: Test FAQ CRUD**

### Access Page
- [ ] Navigate to `/admin/faq`
- [ ] Page loads without errors
- [ ] FAQ list is displayed

### Test CREATE
- [ ] Click "Add FAQ" button
- [ ] Modal form opens
- [ ] Fill in:
  - Question: "Test Question?"
  - Answer: "Test Answer"
  - Category: "General"
  - Order: 0
- [ ] Check "Active" checkbox
- [ ] Click "Create FAQ"
- [ ] Verify toast: "FAQ added successfully"
- [ ] Verify FAQ appears in list

### Test READ
- [ ] Verify FAQ is displayed in list
- [ ] Verify question and answer are correct
- [ ] Verify category badge is shown

### Test UPDATE
- [ ] Click "Edit" button on FAQ
- [ ] Modal opens with existing data
- [ ] Change the question
- [ ] Click "Update FAQ"
- [ ] Verify toast: "FAQ updated successfully"
- [ ] Verify changes appear in list

### Test DELETE
- [ ] Click "Delete" button on FAQ
- [ ] Confirm deletion dialog
- [ ] Verify toast: "FAQ deleted successfully"
- [ ] Verify FAQ removed from list

### Test SEARCH & FILTER
- [ ] Type in search box → Verify filtering works
- [ ] Select category from dropdown → Verify filtering works

**Expected Result:** ✅ All CRUD operations work correctly

---

## 🎨 **STEP 4: Test Hero Slides CRUD**

### Access Page
- [ ] Navigate to `/admin/hero-slides`
- [ ] Page loads without errors
- [ ] Slides grid is displayed

### Test CREATE
- [ ] Click "Add Slide" button
- [ ] Fill in form:
  - Image URL: "https://images.unsplash.com/photo-1566073771259-6a8506099945"
  - Title: "Test Slide Title"
  - Subtitle: "Test Subtitle"
  - Description: "Test description text"
  - CTA Text: "Book Now"
  - CTA Link: "/booking"
  - Order: 0
- [ ] Check "Active" checkbox
- [ ] Click "Create Slide"
- [ ] Verify toast: "Slide added successfully"
- [ ] Verify slide appears in grid

### Test UPDATE
- [ ] Click "Edit" on a slide
- [ ] Update title
- [ ] Click "Update Slide"
- [ ] Verify changes persist

### Test DELETE
- [ ] Click "Delete" on a slide
- [ ] Confirm deletion
- [ ] Verify slide removed

**Expected Result:** ✅ All CRUD operations work correctly

---

## 🔗 **STEP 5: Test Navigation Links CRUD**

### Access Page
- [ ] Navigate to `/admin/navigation`
- [ ] Page loads without errors
- [ ] Links list is displayed

### Test CREATE
- [ ] Click "Add Link"
- [ ] Fill in:
  - Name: "Test Link"
  - Link (href): "/test"
  - Order: 10
- [ ] Check "Active"
- [ ] Click "Create Link"
- [ ] Verify link appears in list

### Test UPDATE
- [ ] Edit a link
- [ ] Change name or href
- [ ] Save
- [ ] Verify changes

### Test DELETE
- [ ] Delete a link
- [ ] Verify removal

**Expected Result:** ✅ All CRUD operations work correctly

---

## 📱 **STEP 6: Test Social Links CRUD**

### Access Page
- [ ] Navigate to `/admin/social-links`
- [ ] Page loads without errors

### Test CREATE
- [ ] Click "Add Link"
- [ ] Select platform: "Facebook"
- [ ] Enter URL: "https://facebook.com/test"
- [ ] Enter icon (optional): "🔗"
- [ ] Set order: 0
- [ ] Click "Create Link"
- [ ] Verify link appears

### Test UPDATE
- [ ] Edit a social link
- [ ] Update URL
- [ ] Save
- [ ] Verify changes

### Test DELETE
- [ ] Delete a link
- [ ] Verify removal

**Expected Result:** ✅ All CRUD operations work correctly

---

## ⭐ **STEP 7: Test Amenities CRUD**

### Access Page
- [ ] Navigate to `/admin/amenities`
- [ ] Page loads without errors

### Test CREATE
- [ ] Click "Add Amenity"
- [ ] Fill in:
  - Name: "Test Amenity"
  - Description: "Test description"
  - Icon: "🌟"
  - Category: "Wellness"
  - Display Order: 10
- [ ] Check "Active"
- [ ] Click "Create Amenity"
- [ ] Verify amenity appears

### Test UPDATE
- [ ] Edit an amenity
- [ ] Update name or description
- [ ] Save
- [ ] Verify changes

### Test DELETE
- [ ] Delete an amenity
- [ ] Verify removal

**Expected Result:** ✅ All CRUD operations work correctly

---

## 📍 **STEP 8: Test Attractions CRUD**

### Access Page
- [ ] Navigate to `/admin/attractions`
- [ ] Page loads without errors

### Test CREATE
- [ ] Click "Add Attraction"
- [ ] Fill in:
  - Name: "Test Attraction"
  - Distance: "0.5 miles"
  - Description: "Test description"
  - Category: "Tourism"
  - Display Order: 10
- [ ] Check "Active"
- [ ] Click "Create Attraction"
- [ ] Verify attraction appears

### Test UPDATE
- [ ] Edit an attraction
- [ ] Update details
- [ ] Save
- [ ] Verify changes

### Test DELETE
- [ ] Delete an attraction
- [ ] Verify removal

**Expected Result:** ✅ All CRUD operations work correctly

---

## 🔗 **STEP 9: Test Footer Links CRUD**

### Access Page
- [ ] Navigate to `/admin/footer-links`
- [ ] Page loads without errors

### Test CREATE
- [ ] Click "Add Link"
- [ ] Fill in:
  - Label: "Test Link"
  - URL: "/test"
  - Category: "Quick Links"
  - Order: 10
- [ ] Check "Active"
- [ ] Click "Create Link"
- [ ] Verify link appears

### Test UPDATE
- [ ] Edit a footer link
- [ ] Update label or URL
- [ ] Save
- [ ] Verify changes

### Test DELETE
- [ ] Delete a link
- [ ] Verify removal

**Expected Result:** ✅ All CRUD operations work correctly

---

## 🌐 **STEP 10: Test Frontend Integration**

### Test Navigation Component
- [ ] Go to homepage (`/`)
- [ ] Open browser DevTools → Network tab
- [ ] Verify API call to `/api/navigation` is made
- [ ] Verify navigation links in header match database
- [ ] If no data, verify fallback links appear

### Test Hero Section
- [ ] Go to homepage (`/`)
- [ ] Verify API call to `/api/hero-slides` is made
- [ ] Verify hero slides display correctly
- [ ] Verify slides rotate (if multiple slides)
- [ ] Verify CTA buttons work

### Test Footer Component
- [ ] Scroll to bottom of any page
- [ ] Verify API call to `/api/social-links` is made
- [ ] Verify API call to `/api/footer-links` is made
- [ ] Verify social media icons display
- [ ] Verify footer links display correctly
- [ ] Click footer links → Verify they work

### Test Contact Page FAQs
- [ ] Navigate to `/contact`
- [ ] Scroll to FAQ section
- [ ] Verify API call to `/api/faq` is made
- [ ] Verify FAQs display correctly
- [ ] If no FAQs, verify section doesn't show (or shows loading)

**Expected Result:** ✅ All frontend components load data from APIs

---

## 🔍 **STEP 11: Test Console for Errors**

### Check Browser Console
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Navigate through all admin pages
- [ ] Check for any red errors
- [ ] Note any warnings

**Expected Console Errors:**
- [ ] None (or only expected non-critical errors)
- [ ] No 404 errors for API endpoints
- [ ] No authentication errors
- [ ] No TypeScript/JavaScript errors

---

## 📊 **STEP 12: Test Data Persistence**

### Test Settings Persistence
- [ ] Update hotel name in Settings
- [ ] Save
- [ ] Refresh page
- [ ] Verify hotel name persists
- [ ] Check footer → Verify name updated
- [ ] Check navigation → Verify name updated

### Test FAQ Persistence
- [ ] Create a new FAQ
- [ ] Save
- [ ] Refresh page
- [ ] Verify FAQ still exists
- [ ] Go to Contact page → Verify FAQ appears

### Test Hero Slides Persistence
- [ ] Create a new hero slide
- [ ] Save
- [ ] Go to homepage
- [ ] Verify new slide appears in carousel

**Expected Result:** ✅ All data persists correctly

---

## 🎯 **STEP 13: Test Authentication & Authorization**

### Test Protected Routes
- [ ] Log out
- [ ] Try to access `/admin/settings` → Should redirect to login
- [ ] Try to access `/admin/faq` → Should redirect to login
- [ ] Log in as Guest → Try to access admin pages → Should redirect

### Test Role-Based Access
- [ ] Log in as Manager
- [ ] Verify can access all CRUD pages
- [ ] Log in as Receptionist (if exists)
- [ ] Verify cannot access Settings/FAQ pages (should redirect)

**Expected Result:** ✅ Authentication and authorization work correctly

---

## 📝 **TEST RESULTS SUMMARY**

### ✅ **API Endpoints**
- [ ] Settings API: ✅ / ❌
- [ ] Navigation API: ✅ / ❌
- [ ] FAQ API: ✅ / ❌
- [ ] Hero Slides API: ✅ / ❌
- [ ] Social Links API: ✅ / ❌
- [ ] Amenities API: ✅ / ❌
- [ ] Attractions API: ✅ / ❌
- [ ] Footer Links API: ✅ / ❌

### ✅ **Admin Pages**
- [ ] Settings Page: ✅ / ❌
- [ ] FAQ Page: ✅ / ❌
- [ ] Hero Slides Page: ✅ / ❌
- [ ] Navigation Page: ✅ / ❌
- [ ] Social Links Page: ✅ / ❌
- [ ] Amenities Page: ✅ / ❌
- [ ] Attractions Page: ✅ / ❌
- [ ] Footer Links Page: ✅ / ❌

### ✅ **Frontend Integration**
- [ ] Navigation Component: ✅ / ❌
- [ ] Hero Section: ✅ / ❌
- [ ] Footer Component: ✅ / ❌
- [ ] Contact Page FAQs: ✅ / ❌

### ✅ **CRUD Operations**
- [ ] CREATE: ✅ / ❌
- [ ] READ: ✅ / ❌
- [ ] UPDATE: ✅ / ❌
- [ ] DELETE: ✅ / ❌

---

## 🐛 **ISSUES FOUND**

**Issue 1:**
- Description: 
- Steps to reproduce:
- Expected:
- Actual:
- Status:

**Issue 2:**
- Description:
- Steps to reproduce:
- Expected:
- Actual:
- Status:

---

## ✅ **TEST COMPLETION**

- **Test Date:** _______________
- **Tester:** _______________
- **Total Tests:** _______________
- **Passed:** _______________
- **Failed:** _______________
- **Success Rate:** _______________%

**Overall Status:** ✅ Ready / ❌ Needs Fixes

---

**Next Steps:**
1. Document all test results
2. Fix any issues found
3. Re-test fixed issues
4. Deploy to production

