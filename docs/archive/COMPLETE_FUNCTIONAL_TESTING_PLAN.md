# 🧪 Complete Functional Testing Plan

**Date:** November 19, 2025  
**Production URL:** https://smarthotel-demo.vercel.app/  
**Status:** 🧪 **TESTING IN PROGRESS**

---

## ✅ **COMPLETED**

### 1. Inventory API Fix ✅
- **Issue:** API returning 500 error
- **Root Cause:** 
  - `getRequestSession` could throw errors
  - `quantity` and `minQuantity` need BigInt conversion
- **Fix Applied:**
  - Added `.catch()` error handling for `getRequestSession`
  - Added `BigInt()` conversion for quantity fields
- **Status:** ✅ Fixed and deployed

### 2. Page Load Testing ✅
- ✅ All 23 pages verified
- ✅ 22/23 pages with zero console errors (95.7%)

---

## 🧪 **FUNCTIONAL TESTING IN PROGRESS**

### 1. Authentication Flows Testing

#### Sign In Flow
- [ ] Test with valid SUPER_ADMIN credentials
- [ ] Test with valid MANAGER credentials
- [ ] Test with valid RECEPTIONIST credentials
- [ ] Test with valid GUEST credentials
- [ ] Test with invalid credentials
- [ ] Test password visibility toggle
- [ ] Test form validation
- [ ] Test redirect after successful sign in
- [ ] Test "Forgot password?" link
- [ ] Test "Sign up" link
- [ ] Test Google Sign In (OAuth configuration needed)

#### Sign Up Flow
- [ ] Test registration form
- [ ] Test form validation
- [ ] Test password requirements
- [ ] Test email validation
- [ ] Test successful registration
- [ ] Test duplicate email handling

#### Forgot Password Flow
- [ ] Test email submission
- [ ] Test email sent confirmation
- [ ] Test invalid email handling

#### Reset Password Flow
- [ ] Test password reset with valid token
- [ ] Test password reset with invalid token
- [ ] Test password validation

---

### 2. RBAC Testing

#### GUEST Role
- [ ] Should access: `/`, `/rooms`, `/booking`, `/my-bookings`, `/order`
- [ ] Should NOT access: `/admin/*`, `/kitchen/*`
- [ ] Test redirect to sign-in when accessing protected routes

#### RECEPTIONIST Role
- [ ] Should access: `/admin/bookings`, `/admin/calendar`, `/admin/dashboard/checkin-checkout`
- [ ] Should NOT access: `/admin/dashboard`, `/admin/rooms`, `/admin/staff`
- [ ] Test redirect when accessing unauthorized routes

#### MANAGER Role
- [ ] Should access: All `/admin/*` except super admin only features
- [ ] Should NOT access: Super admin only features
- [ ] Test all manager-accessible dashboards

#### SUPER_ADMIN Role
- [ ] Should access: All routes
- [ ] Test all admin dashboards
- [ ] Test all management features

---

### 3. User Flows Testing

#### Guest Booking Flow
- [ ] Browse rooms (`/rooms`)
- [ ] View room details
- [ ] Select room
- [ ] Fill booking form (`/booking`)
- [ ] Complete booking
- [ ] View booking confirmation
- [ ] View booking in `/my-bookings`

#### Restaurant Ordering Flow
- [ ] Browse menu (`/order`)
- [ ] Add items to cart
- [ ] View cart
- [ ] Place order
- [ ] Track order status
- [ ] View order history

#### Check-In/Out Flow (Receptionist)
- [ ] Access check-in/out dashboard
- [ ] Check in guest
- [ ] Update booking status
- [ ] Check out guest
- [ ] Process payment

---

### 4. Component Testing

#### Navigation Components
- [ ] Main navigation menu
- [ ] Admin sidebar navigation
- [ ] Mobile navigation
- [ ] Breadcrumbs

#### Form Components
- [ ] Input fields
- [ ] Select dropdowns
- [ ] Date pickers
- [ ] File uploads
- [ ] Form validation
- [ ] Form submission

#### UI Components
- [ ] Buttons (all variants)
- [ ] Cards
- [ ] Modals
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

---

## 📊 **TEST CREDENTIALS**

Based on seeded database:
- **SUPER_ADMIN:** admin@smarthotel.com / admin123
- **MANAGER:** manager@smarthotel.com / manager123
- **RECEPTIONIST:** receptionist@smarthotel.com / receptionist123
- **GUEST:** guest@example.com / guest123

---

## 🎯 **TESTING STRATEGY**

1. **API Testing** - Test all API endpoints with different roles
2. **Browser Testing** - Test user interactions and flows
3. **RBAC Testing** - Test access control for all roles
4. **Error Testing** - Test error handling and edge cases

---

**Last Updated:** November 19, 2025

