# Manual Testing Guide - SmartHotel Production

**Date**: November 19, 2025  
**Environment**: Production  
**URL**: https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app

---

## 🎯 Testing Overview

This guide covers manual testing procedures for features that require user interaction and cannot be fully automated. Follow this guide systematically to ensure comprehensive testing.

---

## 📋 Pre-Testing Setup

### Test Accounts Needed
Create test accounts for each role:
- **SUPER_ADMIN** - Full access
- **MANAGER** - Management access
- **RECEPTIONIST** - Front desk access
- **GUEST** - Basic user access

### Test Data
- Sample rooms
- Sample bookings
- Sample staff members
- Sample menu items
- Sample tasks

---

## ✅ 1. AUTHENTICATION & AUTHORIZATION TESTING

### 1.1 User Registration
**Test Steps:**
1. Navigate to `/auth/signin` or registration page
2. Fill in registration form with valid data
3. Submit form
4. Verify user is created
5. Verify default role is GUEST
6. Verify password is hashed (check database)

**Expected Results:**
- ✅ User can register with valid credentials
- ✅ Invalid email format is rejected
- ✅ Weak password is rejected
- ✅ Duplicate email is prevented
- ✅ User is redirected after registration

### 1.2 User Login
**Test Steps:**
1. Navigate to `/auth/signin`
2. Enter valid credentials
3. Click "Sign In"
4. Verify session is created
5. Refresh page - verify session persists
6. Test logout functionality

**Expected Results:**
- ✅ Valid credentials allow login
- ✅ Invalid credentials show error
- ✅ Session persists across refreshes
- ✅ Logout clears session
- ✅ Redirects to appropriate dashboard based on role

### 1.3 Role-Based Access Control (RBAC)
**Test Steps:**
1. Login as SUPER_ADMIN
2. Verify access to all 28 dashboards
3. Login as MANAGER
4. Verify access to 27 dashboards (not user management)
5. Login as RECEPTIONIST
6. Verify access to 5 dashboards only
7. Login as GUEST
8. Verify access to public pages + booking/order pages
9. Try accessing protected pages directly via URL

**Expected Results:**
- ✅ SUPER_ADMIN can access all dashboards
- ✅ MANAGER cannot access user management
- ✅ RECEPTIONIST has limited access
- ✅ GUEST has minimal access
- ✅ Unauthorized access redirects to login
- ✅ Direct URL access to protected pages is blocked

---

## ✅ 2. CRUD OPERATIONS TESTING

### 2.1 Room Management
**Test Steps:**
1. Login as MANAGER or SUPER_ADMIN
2. Navigate to `/admin/rooms`
3. Click "Create New Room"
4. Fill in all required fields
5. Submit form
6. Verify room appears in list
7. Click on room to view details
8. Edit room details
9. Save changes
10. Delete room (with validation)

**Expected Results:**
- ✅ Create room with all fields
- ✅ Read/list all rooms
- ✅ Update room details
- ✅ Delete room (with proper validation)
- ✅ Room availability calculation is accurate
- ✅ Room images upload correctly
- ✅ Room search and filtering works

### 2.2 Booking Management
**Test Steps:**
1. Navigate to `/booking` as guest
2. Select dates, guests, room type
3. Search for available rooms
4. Select a room
5. Fill in booking details
6. Complete booking
7. Verify booking confirmation
8. Navigate to "My Bookings"
9. Test booking cancellation
10. Test booking modification

**Expected Results:**
- ✅ Create booking with valid dates
- ✅ Booking prevents double-booking
- ✅ Booking status transitions work
- ✅ Booking cancellation works
- ✅ Booking email confirmation sent (if SMTP configured)
- ✅ Booking calendar view displays correctly

### 2.3 Staff Management
**Test Steps:**
1. Login as SUPER_ADMIN
2. Navigate to `/admin/staff`
3. Create new staff member
4. Assign department
5. Update staff information
6. Delete staff member

**Expected Results:**
- ✅ Create staff member with all fields
- ✅ Staff list displays correctly
- ✅ Update staff information
- ✅ Delete staff member
- ✅ Staff department assignment works

### 2.4 Task Management
**Test Steps:**
1. Login as MANAGER
2. Navigate to `/admin/tasks`
3. Create new task
4. Assign task to staff member
5. Update task status
6. Filter tasks by type, status, priority
7. Search for tasks

**Expected Results:**
- ✅ Create task with priority and type
- ✅ Assign task to staff member
- ✅ Task status updates work
- ✅ Overdue tasks are identified
- ✅ Task filtering works
- ✅ Task search works

### 2.5 Restaurant System
**Test Steps:**
1. Navigate to `/order` as guest
2. View menu items
3. Add items to cart
4. Update quantities
5. Place order
6. Navigate to kitchen dashboard (as staff)
7. Update order status
8. Verify order tracking

**Expected Results:**
- ✅ Menu item creation works
- ✅ Menu item availability toggle works
- ✅ Food order creation works
- ✅ Order status updates work
- ✅ Kitchen dashboard shows orders correctly
- ✅ QR code generation works (if applicable)
- ✅ Order tracking works

---

## ✅ 3. USER WORKFLOWS TESTING

### 3.1 Guest Booking Flow
**Test Steps:**
1. Start from homepage
2. Click "Book Now"
3. Search rooms by date, guests, location
4. Select a room
5. Fill in guest information
6. Complete booking
7. Verify confirmation page
8. Check "My Bookings" page
9. Test booking cancellation
10. Test booking modification

**Expected Results:**
- ✅ Search rooms works
- ✅ Room selection works
- ✅ Booking confirmation displays
- ✅ "My Bookings" shows bookings
- ✅ Cancellation works
- ✅ Modification works

### 3.2 Room Service Ordering
**Test Steps:**
1. As guest, navigate to room service page
2. Scan QR code (or access directly)
3. Browse menu
4. Add items to cart
5. Update quantities
6. Remove items
7. Place order
8. Track order status
9. View order history

**Expected Results:**
- ✅ QR code scan opens ordering page
- ✅ Add items to cart works
- ✅ Update quantities works
- ✅ Remove items works
- ✅ Place order works
- ✅ Track order status works
- ✅ Order history displays

### 3.3 Admin Dashboard
**Test Steps:**
1. Login as SUPER_ADMIN
2. Navigate to `/admin/dashboard`
3. Verify dashboard loads with data
4. Check analytics charts
5. Verify revenue metrics
6. Verify booking statistics
7. Test export functionality (PDF, CSV, Excel)

**Expected Results:**
- ✅ Dashboard loads with real-time data
- ✅ Analytics charts display correctly
- ✅ Revenue metrics are accurate
- ✅ Booking statistics are correct
- ✅ Export functionality works

---

## ✅ 4. UI/UX TESTING

### 4.1 Responsive Design
**Test Steps:**
1. Open application in different screen sizes:
   - Mobile (375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1920px, 1366px)
2. Test navigation
3. Test forms
4. Test images
5. Test buttons and interactions

**Expected Results:**
- ✅ Responsive on mobile
- ✅ Responsive on tablet
- ✅ Responsive on desktop
- ✅ Touch interactions work
- ✅ Navigation is usable on all sizes

### 4.2 Forms & Validation
**Test Steps:**
1. Test all forms in the application
2. Submit with invalid data
3. Submit with valid data
4. Test required field validation
5. Test email format validation
6. Test date validation
7. Test number validation

**Expected Results:**
- ✅ Required fields are validated
- ✅ Email format is validated
- ✅ Date validation works
- ✅ Number validation works
- ✅ Error messages are clear
- ✅ Success messages are visible

### 4.3 Error Handling
**Test Steps:**
1. Trigger network errors (disable network)
2. Trigger validation errors
3. Trigger server errors
4. Verify error messages
5. Verify error recovery

**Expected Results:**
- ✅ Network errors handled gracefully
- ✅ Validation errors show clear messages
- ✅ Server errors don't crash app
- ✅ Error messages are user-friendly
- ✅ Error recovery works

---

## ✅ 5. INTEGRATION TESTING

### 5.1 Email Service (SMTP)
**Test Steps:**
1. Complete a booking
2. Check if confirmation email is sent
3. Request password reset
4. Check if reset email is sent
5. Verify email templates render correctly

**Expected Results:**
- ✅ Booking confirmation emails sent
- ✅ Password reset emails sent
- ✅ Email templates render correctly
- ✅ Graceful fallback when SMTP not configured

### 5.2 Payment Service (Stripe)
**Test Steps:**
1. Create a booking
2. Select payment method
3. Complete payment
4. Verify payment processing
5. Check payment webhook handling

**Expected Results:**
- ✅ Payment processing works
- ✅ Payment success handling works
- ✅ Payment failure handling works
- ✅ Graceful fallback when Stripe not configured

### 5.3 Image Upload (Cloudinary)
**Test Steps:**
1. Navigate to room management
2. Upload room image
3. Verify image uploads
4. Verify image displays
5. Delete image

**Expected Results:**
- ✅ Image upload works
- ✅ Image optimization works
- ✅ Image deletion works
- ✅ Graceful fallback when Cloudinary not configured

---

## ✅ 6. BROWSER COMPATIBILITY TESTING

### 6.1 Desktop Browsers
**Test Steps:**
Test in each browser:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Expected Results:**
- ✅ All features work in Chrome
- ✅ All features work in Firefox
- ✅ All features work in Safari
- ✅ All features work in Edge

### 6.2 Mobile Browsers
**Test Steps:**
Test on:
- iOS Safari
- Chrome Mobile
- Samsung Internet

**Expected Results:**
- ✅ All features work on iOS Safari
- ✅ All features work on Chrome Mobile
- ✅ Touch interactions work
- ✅ Mobile navigation works

---

## ✅ 7. PERFORMANCE TESTING

### 7.1 Page Load Times
**Test Steps:**
1. Use browser DevTools
2. Measure page load times
3. Test on slow network (3G)
4. Test on fast network (4G/WiFi)

**Expected Results:**
- ✅ Page load time < 2 seconds
- ✅ API response time < 500ms
- ✅ Images load efficiently
- ✅ Bundle size is optimized

### 7.2 Performance Metrics
**Test Steps:**
1. Use Lighthouse in Chrome DevTools
2. Run performance audit
3. Check Core Web Vitals
4. Review recommendations

**Expected Results:**
- ✅ Performance score > 90
- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1

---

## 📝 TEST EXECUTION CHECKLIST

### Critical Tests (Must Complete)
- [ ] Authentication & Authorization
- [ ] Booking System
- [ ] Payment Processing
- [ ] Role-Based Access Control
- [ ] Core CRUD Operations

### Important Tests (Should Complete)
- [ ] All CRUD Operations
- [ ] Analytics & Reporting
- [ ] Email Notifications
- [ ] Image Uploads
- [ ] Real-Time Features

### Nice to Have Tests
- [ ] Advanced Analytics
- [ ] Export Features
- [ ] Theme Customization
- [ ] Advanced Filtering

---

## 🐛 BUG REPORTING

When you find issues, document:
1. **Description**: What happened
2. **Steps to Reproduce**: How to trigger the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happened
5. **Screenshots**: Visual evidence
6. **Browser/Device**: Testing environment
7. **Priority**: Critical/High/Medium/Low

---

## ✅ SIGN-OFF

After completing all tests:
- [ ] All critical tests passed
- [ ] All important tests passed
- [ ] Bugs documented and prioritized
- [ ] Test report completed
- [ ] Ready for production use

---

**Testing Guide Version**: 1.0  
**Last Updated**: November 19, 2025

