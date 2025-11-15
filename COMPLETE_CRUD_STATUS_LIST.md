# 📋 Complete CRUD Status List

**Date:** 2025-11-15  
**Purpose:** Comprehensive list of all CRUD operations and missing CRUD features

---

## ✅ **COMPLETE CRUD OPERATIONS (8/8)**

### 1. 🏨 **Rooms Management** (`/admin/rooms`)
**Status:** ✅ **FULL CRUD COMPLETE**

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/rooms` | POST | ✅ Modal Form | ✅ Working |
| **Read** | `/api/rooms` | GET | ✅ Table View | ✅ Working |
| **Read One** | `/api/rooms/[id]` | GET | ✅ Detail View | ✅ Working |
| **Update** | `/api/rooms/[id]` | PUT | ✅ Edit Modal | ✅ Working |
| **Delete** | `/api/rooms/[id]` | DELETE | ✅ Delete Button | ✅ Working |

**Features:**
- ✅ Add new rooms
- ✅ Edit room details (number, type, price, capacity, amenities, images, floor, size, status)
- ✅ Delete rooms
- ✅ Search and filter (type, status, price range)
- ✅ Status management (Available, Occupied, Maintenance, Reserved)
- ✅ Real-time availability stats

---

### 2. 🍽️ **Menu Management** (`/admin/menu`)
**Status:** ✅ **FULL CRUD COMPLETE**

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/restaurant/menu` | POST | ✅ Modal Form | ✅ Working |
| **Read** | `/api/restaurant/menu` | GET | ✅ Grid View | ✅ Working |
| **Read One** | `/api/restaurant/menu/[id]` | GET | ✅ Detail View | ✅ Working |
| **Update** | `/api/restaurant/menu/[id]` | PUT | ✅ Edit Modal | ✅ Working |
| **Delete** | `/api/restaurant/menu/[id]` | DELETE | ✅ Delete Button | ✅ Working |

**Features:**
- ✅ Add menu items
- ✅ Edit menu items (name, description, price, category, preparation time, availability)
- ✅ Delete menu items
- ✅ Search and filter by category
- ✅ Availability toggle
- ✅ Category management (APPETIZERS, MAIN_COURSE, SNACKS, DESSERTS, BEVERAGES)

---

### 3. 🖼️ **Gallery Management** (`/admin/gallery`)
**Status:** ✅ **FULL CRUD COMPLETE** (Just Updated)

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/gallery` | POST | ✅ Modal Form | ✅ Working |
| **Read** | `/api/gallery` | GET | ✅ Grid View | ✅ Working |
| **Read One** | `/api/gallery/[id]` | GET | ✅ Detail View | ✅ Working |
| **Update** | `/api/gallery/[id]` | PUT | ✅ Edit Modal | ✅ Working |
| **Delete** | `/api/gallery/[id]` | DELETE | ✅ Delete Button | ✅ Working |

**Features:**
- ✅ Add images
- ✅ Edit images (title, URL, category) - **NEW!**
- ✅ Delete images
- ✅ Search and filter by category
- ✅ Category management (ROOM, AMENITY, EVENT, FOOD, EXTERIOR)

---

### 4. 👥 **Staff Management** (`/admin/staff`)
**Status:** ✅ **FULL CRUD COMPLETE**

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/staff` | POST | ✅ Modal Form | ✅ Working |
| **Read** | `/api/staff` | GET | ✅ Table View | ✅ Working |
| **Update** | `/api/staff/[id]` | PUT | ✅ Edit Modal | ✅ Working |
| **Delete** | `/api/staff` | DELETE | ✅ Delete Button | ✅ Working |

**Features:**
- ✅ Add staff members
- ✅ Edit staff details (employee ID, name, email, phone, position, department, salary, hire date)
- ✅ Delete staff members
- ✅ Search and filter by department, status
- ✅ Active/inactive status management

---

### 5. 📋 **Task Management** (`/admin/tasks`)
**Status:** ✅ **FULL CRUD COMPLETE**

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/tasks` | POST | ✅ Form | ✅ Working |
| **Read** | `/api/tasks` | GET | ✅ List View | ✅ Working |
| **Read One** | `/api/tasks/[id]` | GET | ✅ Detail View | ✅ Working |
| **Update** | `/api/tasks/[id]` | PATCH | ✅ Edit Form | ✅ Working |
| **Delete** | `/api/tasks/[id]` | DELETE | ✅ Delete Button | ✅ Working |

**Features:**
- ✅ Create tasks
- ✅ Update task status, priority, assignee, due dates
- ✅ Delete tasks
- ✅ Search and filter (status, priority, type)
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Task types (Housekeeping, Maintenance, Room Service, Guest Requests)

---

### 6. 📦 **Inventory Management** (`/admin/inventory`)
**Status:** ✅ **FULL CRUD COMPLETE**

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/inventory` | POST | ✅ Modal Form | ✅ Working |
| **Read** | `/api/inventory` | GET | ✅ Table View | ✅ Working |
| **Read One** | `/api/inventory/[id]` | GET | ✅ Detail View | ✅ Working |
| **Update** | `/api/inventory/[id]` | PATCH | ✅ Edit Modal | ✅ Working |
| **Delete** | `/api/inventory/[id]` | DELETE | ✅ Delete Button | ✅ Working |

**Features:**
- ✅ Add inventory items
- ✅ Update quantities, status, descriptions
- ✅ Delete items
- ✅ Search and filter by category, status
- ✅ Low stock alerts
- ✅ Status management (IN_STOCK, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED)

---

### 7. 📅 **Booking Management** (`/admin/bookings`)
**Status:** ✅ **FULL CRUD COMPLETE**

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/bookings` | POST | ✅ Form | ✅ Working |
| **Read** | `/api/bookings` | GET | ✅ Table View | ✅ Working |
| **Read One** | `/api/bookings/[id]` | GET | ✅ Detail View | ✅ Working |
| **Update** | `/api/bookings/[id]` | PATCH | ✅ Edit Form | ✅ Working |
| **Delete** | `/api/bookings/[id]` | DELETE | ✅ Delete Button | ✅ Working |

**Features:**
- ✅ Create bookings
- ✅ Update booking status, payment status, dates, guest info
- ✅ Delete/cancel bookings
- ✅ Search and filter (status, payment status, dates)
- ✅ Status management (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)
- ✅ Revenue statistics

---

### 8. 🛒 **Order Management** (`/admin/orders`)
**Status:** ✅ **FULL CRUD COMPLETE**

| Operation | API Endpoint | Method | Admin Page | Status |
|---|---|---|---|---|
| **Create** | `/api/restaurant/orders` | POST | ✅ Form | ✅ Working |
| **Read** | `/api/restaurant/orders` | GET | ✅ List View | ✅ Working |
| **Read One** | `/api/restaurant/orders/[id]` | GET | ✅ Detail View | ✅ Working |
| **Update** | `/api/restaurant/orders/[id]` | PATCH | ✅ Edit Form | ✅ Working |
| **Delete** | - | - | ✅ Cancel Action | ✅ Working |

**Features:**
- ✅ Create food orders
- ✅ Update order status, items, special requests
- ✅ Cancel orders
- ✅ Search and filter (status, room, date)
- ✅ Order status tracking (PENDING, PREPARING, READY, DELIVERED, CANCELLED)

---

## ❌ **MISSING CRUD OPERATIONS (Need to be Added)**

### 1. ⚙️ **Hotel Settings/Configuration** 
**Status:** ❌ **NO CRUD** (Only Read via GET)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ GET `/api/settings/contact` | Working (reads from Settings table) |
| **Create** | ❌ **MISSING** | No POST endpoint, no admin page |
| **Update** | ❌ **MISSING** | No PUT/PATCH endpoint, no admin page |
| **Delete** | ❌ **MISSING** | No DELETE endpoint |

**Data That Needs CRUD:**
- Hotel Name (`hotel_name`)
- Hotel Tagline (`hotel_tagline`)
- Hotel Description (`hotel_description`)
- Contact Email (`hotel_email`)
- Contact Phone (`hotel_phone`)
- Address (`hotel_address`)
- Check-in Time (`check_in_time`)
- Check-out Time (`check_out_time`)
- Latitude (`hotel_latitude`)
- Longitude (`hotel_longitude`)
- Hotel Story (`hotel_story`)
- Founded Year (`hotel_founded`)
- Milestones (`hotel_milestones` - JSON array)

**Current Location:** Stored in `Setting` table (key-value pairs)  
**Currently:** Hardcoded defaults in `lib/settings.ts` and `app/api/settings/contact/route.ts`

**Required:**
- ❌ API: `POST /api/settings` - Create/Update settings
- ❌ API: `PUT /api/settings/[key]` - Update individual setting
- ❌ API: `GET /api/settings` - Get all settings
- ❌ Admin Page: `/admin/settings` - Settings management page with forms

---

### 2. 🏠 **Homepage Content Management**
**Status:** ❌ **NO CRUD** (Hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays content | Working (hardcoded in components) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- Hero slides (in `components/enhanced-hero-section.tsx`):
  - Slide titles, subtitles, descriptions
  - CTA button text and links
  - Background images
- Welcome section (in `app/page.tsx`):
  - Welcome heading
  - Description text
  - Feature cards (5-Star Luxury, Prime Location, Award-Winning)
- Rooms section:
  - Section heading
  - Description text
- Amenities section:
  - Section heading
  - Description text
  - Amenity list (hardcoded)
- Restaurant section:
  - Section heading
  - Description text
  - Restaurant features
- Location section:
  - Section heading
  - Description text
  - Nearby attractions list

**Required:**
- ❌ Database Model: `HomepageContent` or extend `Setting` table
- ❌ API: `POST /api/homepage` - Create/Update homepage content
- ❌ API: `GET /api/homepage` - Get homepage content
- ❌ API: `PUT /api/homepage/slides` - Update hero slides
- ❌ Admin Page: `/admin/homepage` - Homepage content editor

---

### 3. 📖 **About Page Content Management**
**Status:** ⚠️ **PARTIAL CRUD** (Some from DB, some hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays content | Working (partially from DB) |
| **Create** | ⚠️ **PARTIAL** | Story, founded, milestones in DB, but no CRUD UI |
| **Update** | ⚠️ **PARTIAL** | Can update via Settings, but no admin page |
| **Delete** | ❌ **MISSING** | No DELETE |

**From Database (via Settings):**
- ✅ Story (`hotel_story`)
- ✅ Founded Year (`hotel_founded`)
- ✅ Milestones (`hotel_milestones`)
- ✅ Staff (from Staff table)

**Hardcoded Content:**
- ❌ Values section (Excellence, Integrity, Sustainability) - Hardcoded in `app/about/page.tsx`
- ❌ Awards section - Hardcoded in `app/about/page.tsx`
- ❌ Values descriptions - Hardcoded

**Required:**
- ❌ API: `POST /api/settings/about` - Update about content
- ❌ API: `PUT /api/settings/about/values` - Update values section
- ❌ API: `PUT /api/settings/about/awards` - Update awards section
- ❌ Admin Page: `/admin/settings/about` - About page content editor

---

### 4. 🔗 **Navigation Links Management**
**Status:** ❌ **NO CRUD** (Hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays links | Working (hardcoded) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- Navigation links in `components/hotel-navigation.tsx`:
  ```typescript
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Restaurant', href: '/order' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ]
  ```

**Required:**
- ❌ Database Model: `NavigationLink` or extend `Setting` table
- ❌ API: `POST /api/navigation` - Create navigation link
- ❌ API: `GET /api/navigation` - Get navigation links
- ❌ API: `PUT /api/navigation/[id]` - Update navigation link
- ❌ API: `DELETE /api/navigation/[id]` - Delete navigation link
- ❌ Admin Page: `/admin/settings/navigation` - Navigation links manager

---

### 5. 📝 **FAQ Management**
**Status:** ❌ **NO CRUD** (Hardcoded in Contact Page)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays FAQs | Working (hardcoded in `app/contact/page.tsx`) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- FAQ section in contact page (`app/contact/page.tsx`)
- Questions and answers are hardcoded

**Required:**
- ❌ Database Model: `FAQ` (question, answer, category, order, active)
- ❌ API: `POST /api/faq` - Create FAQ
- ❌ API: `GET /api/faq` - Get FAQs
- ❌ API: `PUT /api/faq/[id]` - Update FAQ
- ❌ API: `DELETE /api/faq/[id]` - Delete FAQ
- ❌ Admin Page: `/admin/faq` - FAQ manager

---

### 6. 🔗 **Social Media Links Management**
**Status:** ❌ **NO CRUD** (Hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays links | Working (hardcoded in `components/hotel-footer.tsx`) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- Social media links in footer (`components/hotel-footer.tsx` lines 27-38)
- All links currently point to `#` (Facebook, Twitter, Instagram, YouTube)
- Icons are hardcoded

**Required:**
- ❌ Database Model: `SocialLink` (platform, url, icon, active, displayOrder) or extend `Setting` table
- ❌ API: `POST /api/settings/social` - Create/Update social media link
- ❌ API: `GET /api/settings/social` - Get social media links
- ❌ API: `PUT /api/settings/social/[id]` - Update social link
- ❌ API: `DELETE /api/settings/social/[id]` - Delete social link
- ❌ Admin Page: `/admin/settings/social` - Social media links manager

---

### 7. 📄 **Policies Content Management** (Privacy, Terms, Cookies)
**Status:** ❌ **NO CRUD** (Static Pages)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Static pages | Working (hardcoded) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **NOT APPLICABLE** | N/A |

**Current Pages:**
- `/privacy` - Privacy Policy (static)
- `/terms` - Terms of Service (static)
- `/cookies` - Cookie Policy (static)

**Required:**
- ❌ Database Model: `Policy` (type, content, lastUpdated)
- ❌ API: `GET /api/policies/[type]` - Get policy content
- ❌ API: `PUT /api/policies/[type]` - Update policy content
- ❌ Admin Page: `/admin/settings/policies` - Policy content editor

---

### 8. 🎨 **Hero Slides Management**
**Status:** ❌ **NO CRUD** (Hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays slides | Working (hardcoded) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- Hero slides in `components/enhanced-hero-section.tsx`:
  ```typescript
  const slides = [
    { image: '/images/hotel/hotel-hero-1.jpg', title: '...', subtitle: '...', description: '...', cta: '...', ctaLink: '...' },
    // ... more slides
  ]
  ```

**Required:**
- ❌ Database Model: `HeroSlide` (image, title, subtitle, description, cta, ctaLink, order, active)
- ❌ API: `POST /api/hero-slides` - Create hero slide
- ❌ API: `GET /api/hero-slides` - Get hero slides
- ❌ API: `PUT /api/hero-slides/[id]` - Update hero slide
- ❌ API: `DELETE /api/hero-slides/[id]` - Delete hero slide
- ❌ Admin Page: `/admin/settings/hero-slides` - Hero slides manager

---

### 9. 🎯 **Amenities List Management**
**Status:** ❌ **NO CRUD** (Hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays amenities | Working (hardcoded in multiple places) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- Homepage amenities list (in `app/page.tsx` or `lib/hotel-data.ts`)
- About page amenities

**Required:**
- ❌ Database Model: `Amenity` (name, description, icon, category, displayOrder)
- ❌ API: `POST /api/amenities` - Create amenity
- ❌ API: `GET /api/amenities` - Get amenities
- ❌ API: `PUT /api/amenities/[id]` - Update amenity
- ❌ API: `DELETE /api/amenities/[id]` - Delete amenity
- ❌ Admin Page: `/admin/amenities` - Amenities manager

---

### 10. 📍 **Nearby Attractions Management**
**Status:** ❌ **NO CRUD** (Hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays attractions | Working (hardcoded) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- Nearby attractions list in homepage location section

**Required:**
- ❌ Database Model: `NearbyAttraction` (name, distance, description, category, displayOrder)
- ❌ API: `POST /api/attractions` - Create attraction
- ❌ API: `GET /api/attractions` - Get attractions
- ❌ API: `PUT /api/attractions/[id]` - Update attraction
- ❌ API: `DELETE /api/attractions/[id]` - Delete attraction
- ❌ Admin Page: `/admin/attractions` - Nearby attractions manager

---

### 11. 🔗 **Footer Links Management**
**Status:** ❌ **NO CRUD** (Hardcoded)

| Operation | Current Status | What's Missing |
|---|---|---|
| **Read** | ✅ Displays links | Working (hardcoded) |
| **Create** | ❌ **MISSING** | No API, no admin page |
| **Update** | ❌ **MISSING** | No API, no admin page |
| **Delete** | ❌ **MISSING** | No API, no admin page |

**Hardcoded Content:**
- Quick Links section (Home, Rooms, Restaurant, Gallery, Book Now)
- Services section (Spa, Fitness, Pool, Business Center, etc.)
- Footer links in `components/hotel-footer.tsx`

**Required:**
- ❌ Database Model: `FooterLink` (label, url, category, order) or extend `Setting` table
- ❌ API: `POST /api/footer/links` - Create footer link
- ❌ API: `GET /api/footer/links` - Get footer links
- ❌ API: `PUT /api/footer/links/[id]` - Update footer link
- ❌ API: `DELETE /api/footer/links/[id]` - Delete footer link
- ❌ Admin Page: `/admin/settings/footer` - Footer links manager

---

## 📊 **SUMMARY**

### ✅ **Complete CRUD (8 Features):**
1. ✅ Rooms
2. ✅ Menu
3. ✅ Gallery
4. ✅ Staff
5. ✅ Tasks
6. ✅ Inventory
7. ✅ Bookings
8. ✅ Orders

### ❌ **Missing CRUD (10+ Features):**
1. ❌ Hotel Settings/Configuration
2. ❌ Homepage Content
3. ❌ About Page Content (Partial)
4. ❌ Navigation Links
5. ❌ FAQ
6. ❌ Social Media Links
7. ❌ Policies (Privacy, Terms, Cookies)
8. ❌ Hero Slides
9. ❌ Amenities List
10. ❌ Nearby Attractions

---

## 🎯 **PRIORITY RECOMMENDATIONS**

### **HIGH PRIORITY** (Essential for hotel management):
1. **Hotel Settings/Configuration** - Most important! Controls hotel name, contact info, check-in/out times
2. **Homepage Content** - Allows customization of hero slides and main content
3. **About Page Content** - Allows editing story, values, awards

### **MEDIUM PRIORITY** (Improves flexibility):
4. **Navigation Links** - Allows customizing menu items
5. **Hero Slides** - Allows managing homepage hero carousel
6. **FAQ** - Allows managing frequently asked questions

### **LOW PRIORITY** (Nice to have):
7. **Social Media Links** - Allows updating social links
8. **Policies** - Allows editing legal pages
9. **Amenities List** - Allows managing featured amenities
10. **Nearby Attractions** - Allows managing location section

---

## 🚀 **NEXT STEPS**

To make everything fully CRUD-enabled, we need to:

1. **Create Settings Management Admin Page** (`/admin/settings`)
   - Hotel basic info (name, tagline, description)
   - Contact information (email, phone, address)
   - Check-in/out times
   - Coordinates
   - About content (story, founded, milestones)
   - Social media links

2. **Create Homepage Content Management** (`/admin/settings/homepage`)
   - Hero slides CRUD
   - Section content editing
   - Amenities management

3. **Create Additional Management Pages**
   - `/admin/navigation` - Navigation links
   - `/admin/faq` - FAQ management
   - `/admin/amenities` - Amenities list
   - `/admin/attractions` - Nearby attractions

4. **Create API Endpoints**
   - `/api/settings` - Settings CRUD
   - `/api/hero-slides` - Hero slides CRUD
   - `/api/navigation` - Navigation CRUD
   - `/api/faq` - FAQ CRUD
   - `/api/amenities` - Amenities CRUD
   - `/api/attractions` - Attractions CRUD

---

**Total CRUD Status:** 8/19 Features Complete (42%)

---

## 📋 **QUICK REFERENCE**

### ✅ **Complete CRUD Features:**
1. ✅ Rooms (`/admin/rooms`)
2. ✅ Menu (`/admin/menu`)
3. ✅ Gallery (`/admin/gallery`)
4. ✅ Staff (`/admin/staff`)
5. ✅ Tasks (`/admin/tasks`)
6. ✅ Inventory (`/admin/inventory`)
7. ✅ Bookings (`/admin/bookings`)
8. ✅ Orders (`/admin/orders`)

### ❌ **Missing CRUD Features:**
1. ❌ Hotel Settings (`/admin/settings`) - **HIGH PRIORITY**
2. ❌ Homepage Content (`/admin/settings/homepage`) - **HIGH PRIORITY**
3. ❌ About Page Content (`/admin/settings/about`) - **HIGH PRIORITY**
4. ❌ Navigation Links (`/admin/settings/navigation`) - **MEDIUM PRIORITY**
5. ❌ FAQ (`/admin/faq`) - **MEDIUM PRIORITY**
6. ❌ Social Media Links (`/admin/settings/social`) - **LOW PRIORITY**
7. ❌ Policies (`/admin/settings/policies`) - **LOW PRIORITY**
8. ❌ Hero Slides (`/admin/settings/hero-slides`) - **MEDIUM PRIORITY**
9. ❌ Amenities List (`/admin/amenities`) - **LOW PRIORITY**
10. ❌ Nearby Attractions (`/admin/attractions`) - **LOW PRIORITY**
11. ❌ Footer Links (`/admin/settings/footer`) - **LOW PRIORITY**

