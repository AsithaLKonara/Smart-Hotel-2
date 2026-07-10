# 🧪 Comprehensive Test Checklist - SmartHotel Demo

**Deployment URL:** https://smarthotel-demo.vercel.app  
**Last Updated:** 2025-01-15  
**Version:** 2.0 - Complete RBAC, CRUD & Database Integration Testing

---

## 📋 **TESTING INSTRUCTIONS**

### **How to Use This Checklist**
1. ✅ Test each item systematically
2. 🔍 Monitor browser console for errors (F12 → Console tab)
3. 📱 Test on different screen sizes (desktop, tablet, mobile)
4. 📝 Document any issues found
5. ✅ Mark items as: **✅ (Pass)**, **❌ (Fail)**, or **⚠️ (Issue but functional)**

### **Test Credentials**
| Role | Email | Password | Notes |
|------|-------|----------|-------|
| SUPER_ADMIN | admin@smarthotel.com | admin123 | Full access |
| MANAGER | manager@smarthotel.com | manager123 | Management access |
| RECEPTIONIST | receptionist@smarthotel.com | receptionist123 | Front desk access |
| GUEST | guest@smarthotel.com | guest123 | Guest access |

---

## 🔍 **SECTION 1: RECENT UPDATES VERIFICATION**

### **1.1 Footer Removal on Dashboard Pages**
- [ ] **Homepage** (`/`) - Footer is visible ✅
- [ ] **Rooms Page** (`/rooms`) - Footer is visible ✅
- [ ] **Admin Dashboard** (`/admin/dashboard`) - Footer is **NOT** visible ✅
- [ ] **User Dashboard** (`/dashboard`) - Footer is **NOT** visible ✅
- [ ] **Kitchen Dashboard** (`/kitchen/dashboard`) - Footer is **NOT** visible ✅
- [ ] **All Admin Pages** (`/admin/*`) - Footer is **NOT** visible ✅
- [ ] **All Dashboard Pages** (`/dashboard/*`) - Footer is **NOT** visible ✅

**Console Errors:** _______________  
**Notes:** _______________

---

### **1.2 Service Worker Fixes**
- [ ] **Service Worker Install** - No "Failed to clone Response" errors ✅
- [ ] **Static Assets Caching** - Works correctly ✅
- [ ] **Dynamic Caching** - Works correctly ✅
- [ ] **Offline Mode** - Basic functionality works ✅

**Console Errors:** _______________  
**Notes:** _______________

---

### **1.3 Filter Error Fixes**
- [ ] **Admin Bookings Page** - No "filter is not a function" errors ✅
- [ ] **Admin Orders Page** - No "filter is not a function" errors ✅
- [ ] **Check-In/Check-Out Page** - No "filter is not a function" errors ✅
- [ ] **All Admin Pages** - Array operations work correctly ✅

**Console Errors:** _______________  
**Notes:** _______________

---

## 🔐 **SECTION 2: RBAC (ROLE-BASED ACCESS CONTROL) TESTING**

### **2.1 SUPER_ADMIN Role Testing**

**Login:** `admin@smarthotel.com` / `admin123`

#### **2.1.1 Allowed Access**
- [ ] `/admin` - Can access ✅
- [ ] `/admin/dashboard` - Can access ✅
- [ ] `/admin/bookings` - Can access ✅
- [ ] `/admin/rooms` - Can access ✅
- [ ] `/admin/staff` - Can access ✅
- [ ] `/admin/tasks` - Can access ✅
- [ ] `/admin/menu` - Can access ✅
- [ ] `/admin/orders` - Can access ✅
- [ ] `/admin/inventory` - Can access ✅
- [ ] `/admin/gallery` - Can access ✅
- [ ] `/admin/analytics` - Can access ✅
- [ ] `/admin/calendar` - Can access ✅
- [ ] `/admin/dashboard/checkin-checkout` - Can access ✅
- [ ] `/admin/qr-codes` - Can access ✅
- [ ] `/admin/settings` - Can access ✅
- [ ] `/admin/faq` - Can access ✅
- [ ] `/admin/hero-slides` - Can access ✅
- [ ] `/admin/navigation` - Can access ✅
- [ ] `/admin/social-links` - Can access ✅
- [ ] `/admin/amenities` - Can access ✅
- [ ] `/admin/attractions` - Can access ✅
- [ ] `/admin/footer-links` - Can access ✅
- [ ] `/kitchen/dashboard` - Can access ✅
- [ ] `/dashboard` - Can access ✅
- [ ] `/dashboard/bookings` - Can access ✅
- [ ] `/dashboard/orders` - Can access ✅
- [ ] `/dashboard/revenue` - Can access ✅
- [ ] `/dashboard/tasks` - Can access ✅

**Console Errors:** _______________  
**Notes:** _______________

---

### **2.2 MANAGER Role Testing**

**Login:** `manager@smarthotel.com` / `manager123`

#### **2.2.1 Allowed Access**
- [ ] `/admin` - Can access ✅
- [ ] `/admin/dashboard` - Can access ✅
- [ ] `/admin/bookings` - Can access ✅
- [ ] `/admin/rooms` - Can access ✅
- [ ] `/admin/staff` - Can access ✅
- [ ] `/admin/tasks` - Can access ✅
- [ ] `/admin/menu` - Can access ✅
- [ ] `/admin/orders` - Can access ✅
- [ ] `/admin/inventory` - Can access ✅
- [ ] `/admin/gallery` - Can access ✅
- [ ] `/admin/analytics` - Can access ✅
- [ ] `/admin/calendar` - Can access ✅
- [ ] `/admin/dashboard/checkin-checkout` - Can access ✅
- [ ] `/admin/qr-codes` - Can access ✅
- [ ] `/admin/settings` - Can access ✅
- [ ] `/admin/faq` - Can access ✅
- [ ] `/admin/hero-slides` - Can access ✅
- [ ] `/admin/navigation` - Can access ✅
- [ ] `/admin/social-links` - Can access ✅
- [ ] `/admin/amenities` - Can access ✅
- [ ] `/admin/attractions` - Can access ✅
- [ ] `/admin/footer-links` - Can access ✅
- [ ] `/kitchen/dashboard` - Can access ✅
- [ ] `/dashboard` - Can access ✅

#### **2.2.2 Denied Access** (Should redirect to `/auth/signin`)
- [ ] None - MANAGER has full admin access (except user management) ✅

**Console Errors:** _______________  
**Notes:** _______________

---

### **2.3 RECEPTIONIST Role Testing**

**Login:** `receptionist@smarthotel.com` / `receptionist123`

#### **2.3.1 Allowed Access**
- [ ] `/admin` - Can access ✅
- [ ] `/admin/bookings` - Can access ✅
- [ ] `/admin/calendar` - Can access ✅
- [ ] `/admin/dashboard/checkin-checkout` - Can access ✅
- [ ] `/admin/tasks` - Can access ✅
- [ ] `/admin/qr-codes` - Can access ✅
- [ ] `/kitchen/dashboard` - Can access ✅
- [ ] `/dashboard` - Can access ✅

#### **2.3.2 Denied Access** (Should redirect to `/auth/signin`)
- [ ] `/admin/dashboard` - Redirected ✅
- [ ] `/admin/rooms` - Redirected ✅
- [ ] `/admin/staff` - Redirected ✅
- [ ] `/admin/menu` - Redirected ✅
- [ ] `/admin/orders` - Redirected ✅
- [ ] `/admin/inventory` - Redirected ✅
- [ ] `/admin/gallery` - Redirected ✅
- [ ] `/admin/analytics` - Redirected ✅
- [ ] `/admin/settings` - Redirected ✅
- [ ] `/admin/faq` - Redirected ✅
- [ ] `/admin/hero-slides` - Redirected ✅
- [ ] `/admin/navigation` - Redirected ✅
- [ ] `/admin/social-links` - Redirected ✅
- [ ] `/admin/amenities` - Redirected ✅
- [ ] `/admin/attractions` - Redirected ✅
- [ ] `/admin/footer-links` - Redirected ✅

**Console Errors:** _______________  
**Notes:** _______________

---

### **2.4 GUEST Role Testing**

**Login:** `guest@smarthotel.com` / `guest123`

#### **2.4.1 Allowed Access**
- [ ] `/` - Can access (homepage) ✅
- [ ] `/rooms` - Can access ✅
- [ ] `/rooms/[id]` - Can access ✅
- [ ] `/gallery` - Can access ✅
- [ ] `/contact` - Can access ✅
- [ ] `/about` - Can access ✅
- [ ] `/booking` - Can access ✅
- [ ] `/order` - Can access ✅
- [ ] `/my-bookings` - Can access ✅
- [ ] `/dashboard` - Can access (limited view) ✅

#### **2.4.2 Denied Access** (Should redirect to `/auth/signin`)
- [ ] `/admin` - Redirected ✅
- [ ] `/admin/dashboard` - Redirected ✅
- [ ] `/admin/bookings` - Redirected ✅
- [ ] `/admin/rooms` - Redirected ✅
- [ ] `/admin/staff` - Redirected ✅
- [ ] `/admin/tasks` - Redirected ✅
- [ ] `/admin/menu` - Redirected ✅
- [ ] `/admin/orders` - Redirected ✅
- [ ] `/admin/inventory` - Redirected ✅
- [ ] `/admin/gallery` - Redirected ✅
- [ ] `/admin/analytics` - Redirected ✅
- [ ] `/kitchen/dashboard` - Redirected ✅

**Console Errors:** _______________  
**Notes:** _______________

---

## 📊 **SECTION 3: DASHBOARD TESTING**

### **3.1 Admin Dashboard** (`/admin/dashboard`)

**Required Role:** MANAGER, SUPER_ADMIN  
**Test as:** SUPER_ADMIN or MANAGER

#### **3.1.1 Page Loading**
- [ ] Page loads without errors ✅
- [ ] No footer visible ✅
- [ ] Sidebar navigation visible ✅
- [ ] Dashboard metrics display ✅

#### **3.1.2 Database Integration**
- [ ] **Total Bookings** - Data from database ✅
- [ ] **Total Revenue** - Data from database ✅
- [ ] **Occupancy Rate** - Data from database ✅
- [ ] **Total Guests** - Data from database ✅
- [ ] **Occupancy Chart** - Data from database (or empty state) ✅
- [ ] **Room Status** - Data from database (or empty state) ✅
- [ ] **Recent Bookings** - Data from database (or empty state) ✅
- [ ] **Top Rooms** - Data from database (or empty state) ✅

#### **3.1.3 Error Handling**
- [ ] No "Cannot read properties of undefined" errors ✅
- [ ] Empty states display correctly when no data ✅
- [ ] All null checks work correctly ✅

**Console Errors:** _______________  
**API Calls:** Check Network tab - `/api/analytics/dashboard`  
**Database:** postgresql via Prisma ✅  
**Notes:** _______________

---

### **3.2 User Dashboard** (`/dashboard`)

**Required Role:** Any authenticated user  
**Test as:** GUEST, RECEPTIONIST, MANAGER, SUPER_ADMIN

#### **3.2.1 Page Loading**
- [ ] Page loads without errors ✅
- [ ] No footer visible ✅
- [ ] Dashboard overview displays ✅

#### **3.2.2 Database Integration**
- [ ] Dashboard data loads from API ✅
- [ ] Analytics display correctly ✅
- [ ] Recent activity shows data ✅

**Console Errors:** _______________  
**API Calls:** Check Network tab  
**Database:** postgresql via Prisma ✅  
**Notes:** _______________

---

### **3.3 Kitchen Dashboard** (`/kitchen/dashboard`)

**Required Role:** RECEPTIONIST, MANAGER, SUPER_ADMIN  
**Test as:** RECEPTIONIST or MANAGER

#### **3.3.1 Page Loading**
- [ ] Page loads without errors ✅
- [ ] No footer visible ✅
- [ ] Kitchen orders display ✅

#### **3.3.2 Database Integration**
- [ ] Orders fetch from `/api/kitchen/orders` ✅
- [ ] Order status updates work ✅
- [ ] Real-time updates work ✅

**Console Errors:** _______________  
**API Calls:** Check Network tab - `/api/kitchen/orders`  
**Database:** postgresql via Prisma (`prisma.foodOrder`) ✅  
**Notes:** _______________

---

## 🗄️ **SECTION 4: CRUD OPERATIONS TESTING**

### **4.1 Rooms Management** (`/admin/rooms`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/rooms` (GET, POST), `/api/rooms/[id]` (PUT, DELETE)  
**Database:** `prisma.room`

#### **4.1.1 CREATE (POST)**
- [ ] **Add New Room** - Form opens correctly ✅
- [ ] **Fill Form** - All fields work ✅
- [ ] **Submit** - Room created in database ✅
- [ ] **Success Message** - Toast notification shows ✅
- [ ] **List Updates** - New room appears in list ✅
- [ ] **Database Verification** - Check postgresql for new room ✅

**Test Data:** _______________  
**Console Errors:** _______________  
**Notes:** _______________

#### **4.1.2 READ (GET)**
- [ ] **Load Page** - Rooms list displays ✅
- [ ] **API Call** - `/api/rooms` returns data ✅
- [ ] **Data Display** - All room fields display correctly ✅
- [ ] **Search** - Search functionality works ✅
- [ ] **Filter** - Filter by status/type works ✅
- [ ] **Empty State** - Shows message when no rooms ✅

**Console Errors:** _______________  
**Number of Rooms:** _______________  
**Notes:** _______________

#### **4.1.3 UPDATE (PUT)**
- [ ] **Edit Button** - Opens edit form ✅
- [ ] **Form Pre-filled** - Existing data loads ✅
- [ ] **Modify Data** - Changes save correctly ✅
- [ ] **Submit** - Room updated in database ✅
- [ ] **Success Message** - Toast notification shows ✅
- [ ] **List Updates** - Changes reflect in list ✅
- [ ] **Database Verification** - Check postgresql for updated room ✅

**Test Data:** _______________  
**Room ID:** _______________  
**Console Errors:** _______________  
**Notes:** _______________

#### **4.1.4 DELETE**
- [ ] **Delete Button** - Confirmation dialog shows ✅
- [ ] **Confirm Delete** - Room deleted from database ✅
- [ ] **Success Message** - Toast notification shows ✅
- [ ] **List Updates** - Room removed from list ✅
- [ ] **Database Verification** - Check postgresql - room deleted ✅

**Room ID:** _______________  
**Console Errors:** _______________  
**Notes:** _______________

---

### **4.2 Menu Management** (`/admin/menu`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/restaurant/menu` (GET, POST), `/api/restaurant/menu/[id]` (PUT, DELETE)  
**Database:** `prisma.foodMenu`

#### **4.2.1 CREATE**
- [ ] Add new menu item ✅
- [ ] Item created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.2.2 READ**
- [ ] Menu items load from database ✅
- [ ] Search works ✅
- [ ] Filter by category works ✅

**Number of Items:** _______________  
**Notes:** _______________

#### **4.2.3 UPDATE**
- [ ] Edit menu item ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**Item ID:** _______________  
**Notes:** _______________

#### **4.2.4 DELETE**
- [ ] Delete menu item ✅
- [ ] Item removed from database ✅
- [ ] List updates ✅

**Item ID:** _______________  
**Notes:** _______________

---

### **4.3 Gallery Management** (`/admin/gallery`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/gallery` (GET, POST), `/api/gallery/[id]` (PUT, DELETE)  
**Database:** `prisma.gallery`

#### **4.3.1 CREATE**
- [ ] Add new gallery image ✅
- [ ] Image saved to database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.3.2 READ**
- [ ] Gallery items load from database ✅
- [ ] Images display correctly ✅
- [ ] Filter by category works ✅

**Number of Items:** _______________  
**Notes:** _______________

#### **4.3.3 UPDATE**
- [ ] Edit gallery item ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**Item ID:** _______________  
**Notes:** _______________

#### **4.3.4 DELETE**
- [ ] Delete gallery item ✅
- [ ] Item removed from database ✅
- [ ] List updates ✅

**Item ID:** _______________  
**Notes:** _______________

---

### **4.4 Staff Management** (`/admin/staff`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/staff` (GET, POST), `/api/staff/[id]` (PUT, DELETE)  
**Database:** `prisma.staff`

#### **4.4.1 CREATE**
- [ ] Add new staff member ✅
- [ ] Staff created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.4.2 READ**
- [ ] Staff list loads from database ✅
- [ ] Search works ✅
- [ ] Filter by department works ✅

**Number of Staff:** _______________  
**Notes:** _______________

#### **4.4.3 UPDATE**
- [ ] Edit staff member ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**Staff ID:** _______________  
**Notes:** _______________

#### **4.4.4 DELETE**
- [ ] Delete staff member ✅
- [ ] Staff removed from database ✅
- [ ] List updates ✅

**Staff ID:** _______________  
**Notes:** _______________

---

### **4.5 Inventory Management** (`/admin/inventory`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/inventory` (GET, POST), `/api/inventory/[id]` (PATCH, DELETE)  
**Database:** `prisma.inventory`

#### **4.5.1 CREATE**
- [ ] Add new inventory item ✅
- [ ] Item created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.5.2 READ**
- [ ] Inventory items load from database ✅
- [ ] Search works ✅
- [ ] Filter by category/status works ✅

**Number of Items:** _______________  
**Notes:** _______________

#### **4.5.3 UPDATE (PATCH)**
- [ ] Edit inventory item ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**Item ID:** _______________  
**Notes:** _______________

#### **4.5.4 DELETE**
- [ ] Delete inventory item ✅
- [ ] Item removed from database ✅
- [ ] List updates ✅

**Item ID:** _______________  
**Notes:** _______________

---

### **4.6 Tasks Management** (`/admin/tasks`)

**Required Role:** RECEPTIONIST, MANAGER, SUPER_ADMIN  
**API:** `/api/tasks` (GET, POST), `/api/tasks/[id]` (PUT, DELETE)  
**Database:** `prisma.task`

#### **4.6.1 CREATE**
- [ ] Create new task ✅
- [ ] Task created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.6.2 READ**
- [ ] Tasks load from database ✅
- [ ] Filter by status works ✅
- [ ] Search works ✅

**Number of Tasks:** _______________  
**Notes:** _______________

#### **4.6.3 UPDATE**
- [ ] Update task status ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**Task ID:** _______________  
**Notes:** _______________

#### **4.6.4 DELETE**
- [ ] Delete task ✅
- [ ] Task removed from database ✅
- [ ] List updates ✅

**Task ID:** _______________  
**Notes:** _______________

---

### **4.7 Settings Management** (`/admin/settings`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/settings` (GET, PUT), `/api/settings/[key]` (GET, PUT, DELETE)  
**Database:** `prisma.settings`

#### **4.7.1 READ**
- [ ] Settings load from database ✅
- [ ] All settings display correctly ✅

**Notes:** _______________

#### **4.7.2 UPDATE**
- [ ] Update hotel name ✅
- [ ] Update contact info ✅
- [ ] Update check-in/check-out times ✅
- [ ] Changes saved to database ✅

**Test Data:** _______________  
**Notes:** _______________

---

### **4.8 FAQ Management** (`/admin/faq`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/faq` (GET, POST), `/api/faq/[id]` (PUT, DELETE)  
**Database:** `prisma.fAQ`

#### **4.8.1 CREATE**
- [ ] Add new FAQ ✅
- [ ] FAQ created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.8.2 READ**
- [ ] FAQs load from database ✅
- [ ] Search works ✅
- [ ] Filter by category works ✅

**Number of FAQs:** _______________  
**Notes:** _______________

#### **4.8.3 UPDATE**
- [ ] Edit FAQ ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**FAQ ID:** _______________  
**Notes:** _______________

#### **4.8.4 DELETE**
- [ ] Delete FAQ ✅
- [ ] FAQ removed from database ✅
- [ ] List updates ✅

**FAQ ID:** _______________  
**Notes:** _______________

---

### **4.9 Hero Slides Management** (`/admin/hero-slides`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/hero-slides` (GET, POST), `/api/hero-slides/[id]` (PUT, DELETE)  
**Database:** `prisma.heroSlide`

#### **4.9.1 CREATE**
- [ ] Add new hero slide ✅
- [ ] Slide created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.9.2 READ**
- [ ] Hero slides load from database ✅
- [ ] Homepage displays slides from database ✅

**Number of Slides:** _______________  
**Notes:** _______________

#### **4.9.3 UPDATE**
- [ ] Edit hero slide ✅
- [ ] Changes saved to database ✅
- [ ] Homepage updates ✅

**Slide ID:** _______________  
**Notes:** _______________

#### **4.9.4 DELETE**
- [ ] Delete hero slide ✅
- [ ] Slide removed from database ✅
- [ ] Homepage updates ✅

**Slide ID:** _______________  
**Notes:** _______________

---

### **4.10 Navigation Management** (`/admin/navigation`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/navigation` (GET, POST), `/api/navigation/[id]` (PUT, DELETE)  
**Database:** `prisma.navigationLink`

#### **4.10.1 CREATE**
- [ ] Add new navigation link ✅
- [ ] Link created in database ✅
- [ ] Header navigation updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.10.2 READ**
- [ ] Navigation links load from database ✅
- [ ] Header displays links from database ✅

**Number of Links:** _______________  
**Notes:** _______________

#### **4.10.3 UPDATE**
- [ ] Edit navigation link ✅
- [ ] Changes saved to database ✅
- [ ] Header updates ✅

**Link ID:** _______________  
**Notes:** _______________

#### **4.10.4 DELETE**
- [ ] Delete navigation link ✅
- [ ] Link removed from database ✅
- [ ] Header updates ✅

**Link ID:** _______________  
**Notes:** _______________

---

### **4.11 Social Links Management** (`/admin/social-links`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/social-links` (GET, POST), `/api/social-links/[id]` (PUT, DELETE)  
**Database:** `prisma.socialLink`

#### **4.11.1 CREATE**
- [ ] Add new social link ✅
- [ ] Link created in database ✅
- [ ] Footer updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.11.2 READ**
- [ ] Social links load from database ✅
- [ ] Footer displays links from database ✅

**Number of Links:** _______________  
**Notes:** _______________

#### **4.11.3 UPDATE**
- [ ] Edit social link ✅
- [ ] Changes saved to database ✅
- [ ] Footer updates ✅

**Link ID:** _______________  
**Notes:** _______________

#### **4.11.4 DELETE**
- [ ] Delete social link ✅
- [ ] Link removed from database ✅
- [ ] Footer updates ✅

**Link ID:** _______________  
**Notes:** _______________

---

### **4.12 Amenities Management** (`/admin/amenities`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/amenities` (GET, POST), `/api/amenities/[id]` (PUT, DELETE)  
**Database:** `prisma.amenity`

#### **4.12.1 CREATE**
- [ ] Add new amenity ✅
- [ ] Amenity created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.12.2 READ**
- [ ] Amenities load from database ✅
- [ ] Search works ✅
- [ ] Filter by category works ✅

**Number of Amenities:** _______________  
**Notes:** _______________

#### **4.12.3 UPDATE**
- [ ] Edit amenity ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**Amenity ID:** _______________  
**Notes:** _______________

#### **4.12.4 DELETE**
- [ ] Delete amenity ✅
- [ ] Amenity removed from database ✅
- [ ] List updates ✅

**Amenity ID:** _______________  
**Notes:** _______________

---

### **4.13 Attractions Management** (`/admin/attractions`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/attractions` (GET, POST), `/api/attractions/[id]` (PUT, DELETE)  
**Database:** `prisma.nearbyAttraction`

#### **4.13.1 CREATE**
- [ ] Add new attraction ✅
- [ ] Attraction created in database ✅
- [ ] List updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.13.2 READ**
- [ ] Attractions load from database ✅
- [ ] Search works ✅
- [ ] Filter by category works ✅

**Number of Attractions:** _______________  
**Notes:** _______________

#### **4.13.3 UPDATE**
- [ ] Edit attraction ✅
- [ ] Changes saved to database ✅
- [ ] List updates ✅

**Attraction ID:** _______________  
**Notes:** _______________

#### **4.13.4 DELETE**
- [ ] Delete attraction ✅
- [ ] Attraction removed from database ✅
- [ ] List updates ✅

**Attraction ID:** _______________  
**Notes:** _______________

---

### **4.14 Footer Links Management** (`/admin/footer-links`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/footer-links` (GET, POST), `/api/footer-links/[id]` (PUT, DELETE)  
**Database:** `prisma.footerLink`

#### **4.14.1 CREATE**
- [ ] Add new footer link ✅
- [ ] Link created in database ✅
- [ ] Footer updates ✅

**Test Data:** _______________  
**Notes:** _______________

#### **4.14.2 READ**
- [ ] Footer links load from database ✅
- [ ] Footer displays links from database ✅

**Number of Links:** _______________  
**Notes:** _______________

#### **4.14.3 UPDATE**
- [ ] Edit footer link ✅
- [ ] Changes saved to database ✅
- [ ] Footer updates ✅

**Link ID:** _______________  
**Notes:** _______________

#### **4.14.4 DELETE**
- [ ] Delete footer link ✅
- [ ] Link removed from database ✅
- [ ] Footer updates ✅

**Link ID:** _______________  
**Notes:** _______________

---

### **4.15 Bookings Management** (`/admin/bookings`)

**Required Role:** RECEPTIONIST, MANAGER, SUPER_ADMIN  
**API:** `/api/bookings` (GET), `/api/bookings/[id]` (PATCH)  
**Database:** `prisma.booking`

#### **4.15.1 READ**
- [ ] Bookings load from database ✅
- [ ] Search works ✅
- [ ] Filter by status works ✅
- [ ] Filter by payment status works ✅
- [ ] No "filter is not a function" errors ✅

**Number of Bookings:** _______________  
**Notes:** _______________

#### **4.15.2 UPDATE (Status Only)**
- [ ] Update booking status ✅
- [ ] Status saved to database ✅
- [ ] List updates ✅

**Booking ID:** _______________  
**Notes:** _______________

---

### **4.16 Orders Management** (`/admin/orders`)

**Required Role:** MANAGER, SUPER_ADMIN  
**API:** `/api/restaurant/orders` (GET), PATCH for status updates  
**Database:** `prisma.foodOrder`

#### **4.16.1 READ**
- [ ] Orders load from database ✅
- [ ] Search works ✅
- [ ] Filter by status works ✅
- [ ] No "filter is not a function" errors ✅

**Number of Orders:** _______________  
**Notes:** _______________

#### **4.16.2 UPDATE (Status Only)**
- [ ] Update order status ✅
- [ ] Status saved to database ✅
- [ ] List updates ✅

**Order ID:** _______________  
**Notes:** _______________

---

## 🔍 **SECTION 5: FRONTEND-DATABASE INTEGRATION TESTING**

### **5.1 Homepage Integration**
- [ ] **Hero Slides** - Load from `/api/hero-slides` ✅
- [ ] **Navigation Links** - Load from `/api/navigation` ✅
- [ ] **Social Links** - Load from `/api/social-links` (footer) ✅
- [ ] **Footer Links** - Load from `/api/footer-links` ✅

**API Calls:** Check Network tab  
**Database:** postgresql via Prisma ✅  
**Notes:** _______________

---

### **5.2 Contact Page Integration**
- [ ] **FAQs** - Load from `/api/faq` ✅
- [ ] **Contact Info** - Load from `/api/settings/contact` ✅

**API Calls:** Check Network tab  
**Database:** postgresql via Prisma ✅  
**Notes:** _______________

---

### **5.3 Rooms Page Integration**
- [ ] **Rooms List** - Load from `/api/rooms` ✅
- [ ] **Database Data** - All rooms from database display ✅

**API Calls:** Check Network tab - `/api/rooms`  
**Database:** postgresql via Prisma (`prisma.room`) ✅  
**Notes:** _______________

---

### **5.4 Gallery Page Integration**
- [ ] **Gallery Images** - Load from `/api/gallery` ✅
- [ ] **Database Data** - All images from database display ✅

**API Calls:** Check Network tab - `/api/gallery`  
**Database:** postgresql via Prisma (`prisma.gallery`) ✅  
**Notes:** _______________

---

## ✅ **SECTION 6: CONSOLE ERROR CHECKING**

### **6.1 General Console Errors**
- [ ] **No JavaScript Errors** - Check console for red errors ✅
- [ ] **No Network 404s** - Except expected external resources ✅
- [ ] **No CSP Violations** - Content Security Policy errors ✅
- [ ] **No Service Worker Errors** - Clone Response errors fixed ✅
- [ ] **No Filter Errors** - "filter is not a function" fixed ✅
- [ ] **No Undefined Errors** - "Cannot read properties of undefined" fixed ✅

**Errors Found:** _______________  
**Notes:** _______________

---

### **6.2 Expected Warnings (Non-Critical)**
- [ ] **Next.js Prefetch Warnings** - Expected, can be ignored ✅
- [ ] **Unsplash Image 404s** - Expected, handled by fallback ✅
- [ ] **Vimeo Video 404s** - Expected, handled by fallback ✅

**Warnings Found:** _______________  
**Notes:** _______________

---

## 📱 **SECTION 7: RESPONSIVE DESIGN TESTING**

### **7.1 Desktop (1920x1080)**
- [ ] All pages display correctly ✅
- [ ] Navigation works ✅
- [ ] Tables display correctly ✅
- [ ] Forms work correctly ✅

**Notes:** _______________

---

### **7.2 Tablet (768x1024)**
- [ ] All pages responsive ✅
- [ ] Navigation menu works ✅
- [ ] Tables scroll correctly ✅
- [ ] Forms work correctly ✅

**Notes:** _______________

---

### **7.3 Mobile (375x667)**
- [ ] All pages responsive ✅
- [ ] Hamburger menu works ✅
- [ ] Tables scroll correctly ✅
- [ ] Forms work correctly ✅
- [ ] Touch interactions work ✅

**Notes:** _______________

---

## 🔒 **SECTION 8: SECURITY TESTING**

### **8.1 Authentication**
- [ ] **Login Required** - Protected pages redirect when not logged in ✅
- [ ] **Session Persistence** - Session maintained across page refreshes ✅
- [ ] **Logout** - Session cleared on logout ✅

**Notes:** _______________

---

### **8.2 Authorization**
- [ ] **Role-Based Access** - Correct redirects for unauthorized roles ✅
- [ ] **API Protection** - API endpoints check roles ✅
- [ ] **Client-Side Checks** - UI reflects user permissions ✅

**Notes:** _______________

---

## 📝 **TESTING SUMMARY**

### **Overall Status**
- **Total Test Items:** _______________
- **Passed:** _______________
- **Failed:** _______________
- **Issues (Non-Critical):** _______________

### **Critical Issues Found**
1. _______________
2. _______________
3. _______________

### **Recommendations**
1. _______________
2. _______________
3. _______________

---

**Tested By:** _______________  
**Date:** _______________  
**Version:** _______________  
**Deployment URL:** https://smarthotel-demo.vercel.app

---

## ✅ **QUICK REFERENCE**

### **RBAC Roles & Access**
- **SUPER_ADMIN:** Full access to all pages
- **MANAGER:** Full admin access (except user management)
- **RECEPTIONIST:** Limited access (bookings, calendar, check-in/out, tasks, QR codes)
- **GUEST:** Public pages only + personal dashboard

### **CRUD Operations Summary**
| Page | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Rooms | ✅ | ✅ | ✅ | ✅ |
| Menu | ✅ | ✅ | ✅ | ✅ |
| Gallery | ✅ | ✅ | ✅ | ✅ |
| Staff | ✅ | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ |
| FAQ | ✅ | ✅ | ✅ | ✅ |
| Hero Slides | ✅ | ✅ | ✅ | ✅ |
| Navigation | ✅ | ✅ | ✅ | ✅ |
| Social Links | ✅ | ✅ | ✅ | ✅ |
| Amenities | ✅ | ✅ | ✅ | ✅ |
| Attractions | ✅ | ✅ | ✅ | ✅ |
| Footer Links | ✅ | ✅ | ✅ | ✅ |
| Settings | ❌ | ✅ | ✅ | ✅ |
| Bookings | ❌ | ✅ | ✅ (Status) | ❌ |
| Orders | ❌ | ✅ | ✅ (Status) | ❌ |

**Total:** 16 pages with full CRUD, 2 pages with Read/Update only

---

**END OF CHECKLIST** ✅

