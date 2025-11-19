# 🌐 Browser-Based Production Testing Guide

**Date**: November 19, 2025  
**Production URL**: https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app  
**Testing Method**: Manual browser testing with authentication

---

## 🎯 Testing Strategy

This guide provides step-by-step instructions for testing all features from the QA checklist using a browser. You'll need to authenticate with different user roles to test all functionality.

---

## 📋 Pre-Testing Setup

### Test Accounts Needed
Create or use existing accounts for each role:
- **SUPER_ADMIN** - Full system access
- **MANAGER** - Management access (27 dashboards)
- **RECEPTIONIST** - Front desk access (5 dashboards)
- **GUEST** - Basic user access

### Browser Setup
- Open browser DevTools (F12)
- Enable Network tab to monitor API calls
- Enable Console tab to check for errors
- Use Incognito/Private mode for clean sessions

---

## ✅ 1. FUNCTIONAL TESTING

### 1.1 Authentication & Authorization

#### Test 1.1.1: User Registration
**URL**: `/auth/signin` or registration page

**Steps**:
1. Navigate to sign-in page
2. Look for "Register" or "Sign Up" link
3. Fill registration form:
   - Email: `testuser@example.com`
   - Password: `Test123456!`
   - Name: `Test User`
4. Submit form
5. Check for success message
6. Verify redirect to appropriate page

**Expected Results**:
- [ ] Registration form displays correctly
- [ ] Valid credentials allow registration
- [ ] Invalid email format is rejected
- [ ] Weak password is rejected (if validation exists)
- [ ] Duplicate email shows error
- [ ] User is redirected after registration
- [ ] Default role is GUEST

**Screenshots**: Take screenshots of form, success message, errors

---

#### Test 1.1.2: User Login
**URL**: `/auth/signin`

**Steps**:
1. Navigate to `/auth/signin`
2. Enter valid credentials
3. Click "Sign In"
4. Check browser console for errors
5. Verify redirect
6. Refresh page - verify session persists
7. Test logout

**Expected Results**:
- [ ] Login form displays correctly
- [ ] Valid credentials allow login
- [ ] Invalid credentials show error message
- [ ] Session is created (check cookies/localStorage)
- [ ] Session persists across page refreshes
- [ ] Logout clears session
- [ ] Redirects to appropriate dashboard based on role

**Test with different roles**:
- [ ] GUEST → Redirects to homepage or booking page
- [ ] RECEPTIONIST → Redirects to receptionist dashboard
- [ ] MANAGER → Redirects to manager dashboard
- [ ] SUPER_ADMIN → Redirects to admin dashboard

---

#### Test 1.1.3: Password Reset Flow
**URL**: `/auth/forgot-password`

**Steps**:
1. Navigate to `/auth/forgot-password`
2. Enter registered email
3. Submit form
4. Check for confirmation message
5. Check email (if SMTP configured)
6. Use reset link/token
7. Navigate to `/auth/reset-password`
8. Enter new password
9. Submit form
10. Try logging in with new password

**Expected Results**:
- [ ] Forgot password form works
- [ ] Email is sent (if SMTP configured)
- [ ] Reset link works
- [ ] New password can be set
- [ ] Login works with new password
- [ ] Old password no longer works

---

#### Test 1.1.4: Role-Based Access Control (RBAC)

**Test as SUPER_ADMIN**:
1. Login as SUPER_ADMIN
2. Navigate to `/admin`
3. Check available dashboards
4. Try accessing:
   - `/admin/users` - Should be accessible
   - `/admin/bookings` - Should be accessible
   - `/admin/rooms` - Should be accessible
   - `/admin/staff` - Should be accessible
   - `/admin/tasks` - Should be accessible
   - `/admin/analytics` - Should be accessible
   - All other admin pages

**Expected Results**:
- [ ] SUPER_ADMIN can access all 28 dashboards
- [ ] No "Unauthorized" errors
- [ ] All CRUD operations work

**Test as MANAGER**:
1. Login as MANAGER
2. Try accessing `/admin/users`
3. Try accessing other dashboards

**Expected Results**:
- [ ] MANAGER can access 27 dashboards
- [ ] `/admin/users` shows "Unauthorized" or redirects
- [ ] Other dashboards work

**Test as RECEPTIONIST**:
1. Login as RECEPTIONIST
2. Try accessing various dashboards

**Expected Results**:
- [ ] RECEPTIONIST can access 5 dashboards only:
  - [ ] Bookings dashboard
  - [ ] Kitchen/Orders dashboard
  - [ ] Tasks dashboard (if assigned)
  - [ ] Other limited dashboards
- [ ] Unauthorized dashboards show error or redirect

**Test as GUEST**:
1. Login as GUEST
2. Try accessing `/admin` pages

**Expected Results**:
- [ ] GUEST cannot access admin pages
- [ ] Redirects to login or homepage
- [ ] Can access public pages and booking pages

**Test Direct URL Access**:
1. While logged out, try accessing `/admin/dashboard`
2. While logged in as GUEST, try accessing `/admin/users`

**Expected Results**:
- [ ] Unauthenticated access redirects to login
- [ ] Unauthorized access shows error or redirects

---

### 1.2 CRUD Operations Testing

#### Test 1.2.1: Room Management
**URL**: `/admin/rooms`

**Steps**:
1. Login as MANAGER or SUPER_ADMIN
2. Navigate to `/admin/rooms`
3. **CREATE**:
   - Click "Add New Room" or "Create Room"
   - Fill in all fields:
     - Room number: `101`
     - Type: `STANDARD` or `DELUXE`
     - Capacity: `2`
     - Price: `150`
     - Floor: `1`
     - Description: `Test room`
   - Upload room image (if available)
   - Submit form
   - Verify room appears in list
4. **READ**:
   - View room list
   - Click on room to view details
   - Verify all information displays correctly
5. **UPDATE**:
   - Click "Edit" on a room
   - Change price to `175`
   - Change status to `MAINTENANCE`
   - Save changes
   - Verify changes are reflected
6. **DELETE**:
   - Click "Delete" on a test room
   - Confirm deletion
   - Verify room is removed from list

**Expected Results**:
- [ ] Create room works with all fields
- [ ] Room list displays correctly
- [ ] Room details page shows all information
- [ ] Update room works
- [ ] Delete room works (with validation)
- [ ] Room images upload correctly
- [ ] Room search and filtering works
- [ ] Room availability calculation is accurate

---

#### Test 1.2.2: Booking Management
**URL**: `/booking` (guest) or `/admin/bookings` (admin)

**Steps as Guest**:
1. Navigate to `/booking`
2. Select dates (check-in, check-out)
3. Select number of guests
4. Click "Search" or "Find Rooms"
5. View available rooms
6. Select a room
7. Fill in booking details:
   - Guest name
   - Email
   - Phone
   - Special requests
8. Complete booking
9. Verify confirmation page

**Steps as Admin**:
1. Navigate to `/admin/bookings`
2. View all bookings
3. Click on a booking to view details
4. **UPDATE**:
   - Change booking status (PENDING → CONFIRMED → CHECKED_IN)
   - Update dates
   - Update guest information
   - Save changes
5. **DELETE**:
   - Cancel a booking
   - Verify cancellation

**Expected Results**:
- [ ] Room search works
- [ ] Available rooms display correctly
- [ ] Booking creation works
- [ ] Booking prevents double-booking (overlapping dates)
- [ ] Booking status transitions work
- [ ] Booking cancellation works
- [ ] Booking email confirmation sent (if SMTP configured)
- [ ] Booking calendar view displays correctly
- [ ] Booking search and filters work

---

#### Test 1.2.3: Staff Management
**URL**: `/admin/staff`

**Steps**:
1. Login as SUPER_ADMIN
2. Navigate to `/admin/staff`
3. **CREATE**:
   - Click "Add Staff Member"
   - Fill in:
     - Name
     - Email
     - Phone
     - Department (HOUSEKEEPING, RECEPTIONIST, etc.)
     - Role
   - Submit form
4. **READ**:
   - View staff list
   - Click on staff member to view details
5. **UPDATE**:
   - Edit staff information
   - Change department
   - Save changes
6. **DELETE**:
   - Delete a test staff member
   - Verify deletion

**Expected Results**:
- [ ] Create staff member works
- [ ] Staff list displays correctly
- [ ] Update staff information works
- [ ] Delete staff member works
- [ ] Staff department assignment works
- [ ] Staff task assignment works

---

#### Test 1.2.4: Task Management
**URL**: `/admin/tasks`

**Steps**:
1. Login as MANAGER or SUPER_ADMIN
2. Navigate to `/admin/tasks`
3. **CREATE**:
   - Click "Create Task"
   - Fill in:
     - Title: `Clean Room 101`
     - Description
     - Type: `HOUSEKEEPING`
     - Priority: `HIGH`
     - Assign to staff member
     - Due date
   - Submit form
4. **READ**:
   - View task list
   - Filter by status, type, priority
   - Search for tasks
5. **UPDATE**:
   - Change task status (PENDING → IN_PROGRESS → COMPLETED)
   - Update priority
   - Reassign task
6. **DELETE**:
   - Delete a test task

**Expected Results**:
- [ ] Create task works
- [ ] Assign task to staff works
- [ ] Task status updates work
- [ ] Overdue tasks are identified
- [ ] Task filtering works
- [ ] Task search works

---

#### Test 1.2.5: Restaurant System
**URL**: `/order` (guest) or `/admin/kitchen` (kitchen staff)

**Steps as Guest**:
1. Navigate to `/order`
2. View menu items
3. Add items to cart
4. Update quantities
5. Remove items
6. Proceed to checkout
7. Fill in delivery details (room number)
8. Place order
9. View order confirmation

**Steps as Kitchen Staff**:
1. Login as RECEPTIONIST or KITCHEN staff
2. Navigate to `/admin/kitchen` or kitchen dashboard
3. View pending orders
4. Update order status:
   - PENDING → PREPARING
   - PREPARING → READY
   - READY → DELIVERED
5. Verify order tracking

**Expected Results**:
- [ ] Menu items display correctly
- [ ] Add to cart works
- [ ] Update quantities works
- [ ] Remove items works
- [ ] Order creation works
- [ ] Order status updates work
- [ ] Kitchen dashboard shows orders correctly
- [ ] Order tracking works
- [ ] QR code generation works (if applicable)

---

### 1.3 User Workflows

#### Test 1.3.1: Complete Guest Booking Flow
**Steps**:
1. Start from homepage
2. Click "Book Now" button
3. Search for rooms:
   - Select check-in date
   - Select check-out date
   - Select number of guests
   - Click "Search"
4. View available rooms
5. Select a room
6. Review room details
7. Fill in booking form:
   - Guest name
   - Email
   - Phone
   - Special requests
8. Select payment method
9. Complete booking
10. View confirmation page
11. Check email for confirmation (if SMTP configured)
12. Navigate to "My Bookings"
13. View booking details
14. Test booking cancellation
15. Test booking modification

**Expected Results**:
- [ ] Search rooms works
- [ ] Room selection works
- [ ] Booking form works
- [ ] Booking confirmation displays
- [ ] "My Bookings" shows booking
- [ ] Cancellation works
- [ ] Modification works

---

#### Test 1.3.2: Room Service Ordering Flow
**Steps**:
1. As guest, navigate to room service page
2. Scan QR code or access directly
3. Browse menu
4. Add items to cart
5. Update quantities
6. Remove items
7. View cart total
8. Place order
9. View order confirmation
10. Track order status
11. View order history

**Expected Results**:
- [ ] QR code scan opens ordering page (if applicable)
- [ ] Menu displays correctly
- [ ] Add items to cart works
- [ ] Update quantities works
- [ ] Remove items works
- [ ] Place order works
- [ ] Order tracking works
- [ ] Order history displays

---

#### Test 1.3.3: Admin Dashboard Workflow
**Steps**:
1. Login as SUPER_ADMIN
2. Navigate to `/admin/dashboard`
3. Verify dashboard loads with data
4. Check analytics charts:
   - Revenue chart
   - Booking chart
   - Occupancy chart
5. Verify metrics:
   - Total revenue
   - Total bookings
   - Occupancy rate
   - Task completion rate
6. Test export functionality:
   - Export as PDF
   - Export as Excel
   - Export as CSV
7. Navigate to different sections
8. Test real-time updates (if applicable)

**Expected Results**:
- [ ] Dashboard loads with real-time data
- [ ] Analytics charts display correctly
- [ ] Revenue metrics are accurate
- [ ] Booking statistics are correct
- [ ] Task statistics are accurate
- [ ] Export functionality works (PDF, CSV, Excel)

---

## ✅ 2. UI/UX TESTING

### 2.1 Responsive Design Testing

**Test on Different Screen Sizes**:

#### Mobile (375px, 414px)
1. Open DevTools → Toggle device toolbar
2. Select mobile device (iPhone, Android)
3. Test:
   - [ ] Navigation menu (hamburger menu)
   - [ ] Forms are usable
   - [ ] Buttons are tappable
   - [ ] Images load correctly
   - [ ] Text is readable
   - [ ] No horizontal scrolling

#### Tablet (768px, 1024px)
1. Select tablet device
2. Test:
   - [ ] Layout adapts correctly
   - [ ] Navigation works
   - [ ] Forms are usable
   - [ ] Touch interactions work

#### Desktop (1920px, 1366px)
1. Test on full desktop view
2. Test:
   - [ ] Full navigation menu displays
   - [ ] All features accessible
   - [ ] Hover states work
   - [ ] Layout is optimal

**Expected Results**:
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Touch interactions work
- [ ] Navigation is usable on all sizes

---

### 2.2 Form Validation Testing

**Test All Forms**:
1. Registration form
2. Login form
3. Booking form
4. Room creation form
5. Staff creation form
6. Task creation form
7. Order form

**For Each Form**:
- [ ] Submit with empty required fields → Shows validation errors
- [ ] Submit with invalid email → Shows error
- [ ] Submit with invalid date → Shows error
- [ ] Submit with invalid number → Shows error
- [ ] Submit with valid data → Works correctly
- [ ] Error messages are clear and helpful
- [ ] Success messages are visible

---

### 2.3 Error Handling Testing

**Test Error Scenarios**:
1. **Network Error**:
   - Disable network in DevTools
   - Try to submit a form
   - Verify error message displays
2. **Validation Errors**:
   - Submit invalid data
   - Verify error messages
3. **Server Errors**:
   - Trigger a server error (if possible)
   - Verify graceful error handling
4. **404 Errors**:
   - Navigate to non-existent page
   - Verify 404 page displays

**Expected Results**:
- [ ] Network errors handled gracefully
- [ ] Validation errors show clear messages
- [ ] Server errors don't crash app
- [ ] Error messages are user-friendly
- [ ] Error recovery works

---

## ✅ 3. BROWSER COMPATIBILITY TESTING

### Test in Multiple Browsers

#### Chrome (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

#### Firefox (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

#### Safari (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

#### Edge (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

---

## ✅ 4. PERFORMANCE TESTING

### 4.1 Page Load Times
1. Open DevTools → Network tab
2. Clear cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Load each page and measure:
   - [ ] Homepage loads < 2 seconds
   - [ ] Booking page loads < 2 seconds
   - [ ] Admin dashboard loads < 3 seconds
   - [ ] API responses < 500ms

### 4.2 Lighthouse Audit
1. Open DevTools → Lighthouse tab
2. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO
3. Verify scores:
   - [ ] Performance > 90
   - [ ] Accessibility > 90
   - [ ] Best Practices > 90
   - [ ] SEO > 90

---

## ✅ 5. INTEGRATION TESTING

### 5.1 Email Service (SMTP)
**Test**:
1. Complete a booking
2. Check email inbox for confirmation
3. Request password reset
4. Check email for reset link

**Expected Results**:
- [ ] Booking confirmation emails sent (if SMTP configured)
- [ ] Password reset emails sent (if SMTP configured)
- [ ] Email templates render correctly
- [ ] Graceful fallback when SMTP not configured

### 5.2 Payment Service (Stripe)
**Test**:
1. Create a booking
2. Select "Pay Now" option
3. Complete payment form
4. Submit payment
5. Verify payment processing

**Expected Results**:
- [ ] Payment form displays (if Stripe configured)
- [ ] Payment processing works
- [ ] Payment success handling works
- [ ] Payment failure handling works
- [ ] Graceful fallback when Stripe not configured

### 5.3 Image Upload (Cloudinary)
**Test**:
1. Navigate to room management
2. Upload a room image
3. Verify image uploads
4. Verify image displays
5. Delete image

**Expected Results**:
- [ ] Image upload works (if Cloudinary configured)
- [ ] Image optimization works
- [ ] Image deletion works
- [ ] Graceful fallback when Cloudinary not configured

---

## 📝 TEST EXECUTION CHECKLIST

### Critical Tests (Must Complete)
- [ ] Authentication & Authorization (all roles)
- [ ] Booking System (end-to-end)
- [ ] Payment Processing (if applicable)
- [ ] Role-Based Access Control
- [ ] Core CRUD Operations (Rooms, Bookings, Staff, Tasks)

### Important Tests (Should Complete)
- [ ] All CRUD Operations (19 features)
- [ ] Analytics & Reporting
- [ ] Email Notifications
- [ ] Image Uploads
- [ ] Real-Time Features
- [ ] Responsive Design
- [ ] Form Validation

### Nice to Have Tests
- [ ] Advanced Analytics
- [ ] Export Features
- [ ] Theme Customization
- [ ] Advanced Filtering
- [ ] Browser Compatibility (all browsers)

---

## 🐛 BUG REPORTING TEMPLATE

When you find issues, document:

**Bug #**: [Number]  
**Title**: [Brief description]  
**Priority**: Critical / High / Medium / Low  
**Browser**: [Chrome/Firefox/Safari/Edge]  
**Device**: [Desktop/Tablet/Mobile]  
**URL**: [Page where bug occurs]  
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**: [What should happen]  
**Actual Behavior**: [What actually happens]  
**Screenshots**: [Attach screenshots]  
**Console Errors**: [Any console errors]  
**Network Errors**: [Any network errors]

---

## ✅ TESTING SIGN-OFF

After completing all tests:

- [ ] All critical tests passed
- [ ] All important tests passed
- [ ] Bugs documented and prioritized
- [ ] Test report completed
- [ ] Ready for production use

**Tester Name**: _______________  
**Date**: _______________  
**Sign-Off**: _______________

---

## 📊 TESTING PROGRESS TRACKER

### Authentication & Authorization
- [ ] User Registration
- [ ] User Login
- [ ] Password Reset
- [ ] RBAC (SUPER_ADMIN)
- [ ] RBAC (MANAGER)
- [ ] RBAC (RECEPTIONIST)
- [ ] RBAC (GUEST)

### CRUD Operations
- [ ] Room Management
- [ ] Booking Management
- [ ] Staff Management
- [ ] Task Management
- [ ] Restaurant System
- [ ] Inventory Management
- [ ] Gallery Management
- [ ] System Configuration

### User Workflows
- [ ] Guest Booking Flow
- [ ] Room Service Ordering
- [ ] Admin Dashboard

### UI/UX
- [ ] Responsive Design (Mobile)
- [ ] Responsive Design (Tablet)
- [ ] Responsive Design (Desktop)
- [ ] Form Validation
- [ ] Error Handling

### Integration
- [ ] Email Service
- [ ] Payment Service
- [ ] Image Upload
- [ ] Google Services

### Performance
- [ ] Page Load Times
- [ ] Lighthouse Audit
- [ ] API Response Times

---

**Testing Guide Version**: 1.0  
**Last Updated**: November 19, 2025  
**Production URL**: https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app

