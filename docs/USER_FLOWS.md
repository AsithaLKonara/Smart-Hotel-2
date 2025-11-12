# SmartHotel - User Flows Documentation

## 📋 Table of Contents
1. [Guest Booking Flow](#guest-booking-flow)
2. [Restaurant Ordering Flow](#restaurant-ordering-flow)
3. [Check-In/Check-Out Flow](#check-incheck-out-flow)
4. [Admin Management Flows](#admin-management-flows)
5. [System Integration Flows](#system-integration-flows)

---

## 🏨 Guest Booking Flow

### Overview
The complete journey from room search to booking confirmation.

### Step-by-Step Flow

```
1. Guest visits homepage
   ↓
2. Clicks "Book Now" or navigates to /booking
   ↓
3. Search Available Rooms
   - Select check-in date
   - Select check-out date
   - Select number of guests
   - (Optional) Filter by room type
   ↓
4. View Available Rooms
   - See room list with prices
   - View room details
   - Compare options
   ↓
5. Select Room
   - Click "Book Now" on desired room
   - Or click "View Details" for more info
   ↓
6. Guest Information Form
   - Enter guest name
   - Enter email address
   - Enter phone number
   - Add special requests (optional)
   ↓
7. Payment Selection
   - Choose payment method (Pay Now / Pay Later)
   - Review booking summary
   ↓
8. Confirm Booking
   - Review all details
   - Accept terms and conditions
   - Submit booking
   ↓
9. Booking Confirmation
   - Receive confirmation email
   - Get booking reference number
   - View booking details
```

### API Endpoints Used
- `GET /api/rooms/availability` - Search available rooms
- `GET /api/rooms/[id]` - Get room details
- `POST /api/bookings` - Create booking

### Key Features
- Real-time availability checking
- Date validation (no past dates, check-out after check-in)
- Guest capacity validation
- Price calculation (nights × room price)
- Booking conflict prevention

---

## 🍽️ Restaurant Ordering Flow

### Overview
Room service ordering system using QR codes.

### Step-by-Step Flow

```
1. Guest checks into hotel room
   ↓
2. Staff generates QR code
   - Admin → QR Generator
   - Select room number
   - Enter guest booking ID
   - Generate QR code
   ↓
3. Guest scans QR code
   - Opens ordering portal
   - Room-specific access
   ↓
4. Browse Menu
   - View menu by category
   - Filter by dietary requirements
   - See prices and descriptions
   ↓
5. Add Items to Cart
   - Select items
   - Specify quantities
   - Add special requests
   ↓
6. Review Cart
   - Check items and quantities
   - Review total price
   - Add/remove items
   ↓
7. Place Order
   - Confirm order details
   - Submit order
   ↓
8. Order Tracking
   - View order status (Pending → Preparing → Ready → Delivered)
   - Real-time updates
   - Estimated preparation time
   ↓
9. Order Fulfillment
   - Kitchen receives order
   - Staff updates status
   - Guest receives notification
   ↓
10. Delivery & Billing
    - Order delivered to room
    - Charges added to room bill
    - Order marked as completed
```

### API Endpoints Used
- `GET /api/restaurant/menu` - Get menu items
- `POST /api/restaurant/orders` - Create order
- `GET /api/restaurant/orders/[id]` - Track order status
- `PATCH /api/restaurant/orders/[id]` - Update order status

### Key Features
- Room-specific access
- Real-time order tracking
- Category filtering
- Special requests handling
- Automatic room billing

---

## ✅ Check-In/Check-Out Flow

### Overview
Guest arrival and departure processes.

### Check-In Flow

```
1. Guest arrives at hotel
   ↓
2. Front desk searches booking
   - By name, email, or confirmation code
   ↓
3. Verify booking details
   - Check dates
   - Verify guest identity
   - Review special requests
   ↓
4. Process check-in
   - Update booking status to "CHECKED_IN"
   - Assign room
   - Update room status to "OCCUPIED"
   - Generate room key
   ↓
5. Provide information
   - Room number and location
   - WiFi password
   - Hotel amenities
   - QR code for room service
   ↓
6. Complete check-in
   - Guest receives confirmation
   - Booking visible in system
```

### Check-Out Flow

```
1. Guest requests check-out
   ↓
2. Review charges
   - Room charges
   - Room service orders
   - Additional services
   - Calculate total
   ↓
3. Process payment
   - Verify payment method
   - Process final payment
   - Generate receipt
   ↓
4. Complete check-out
   - Update booking status to "CHECKED_OUT"
   - Update room status to "CLEANING"
   - Assign housekeeping task
   ↓
5. Guest departure
   - Provide receipt
   - Collect feedback (optional)
   - Thank guest
```

### API Endpoints Used
- `GET /api/bookings` - Search bookings
- `PATCH /api/bookings/[id]` - Update booking status
- `PATCH /api/rooms/[id]` - Update room status
- `POST /api/tasks` - Create housekeeping task

---

## 👨‍💼 Role-Based Workflows

### 🔑 Role Hierarchy & Access

```
SUPER_ADMIN (Full Access)
   ↓
MANAGER (Operations Management)
   ↓
RECEPTIONIST (Front Desk Operations)
   ↓
GUEST (Public Access)
```

---

## 👑 Super Admin Flows

### System Management Flow

```
1. Access Admin Dashboard
   - Navigate to /admin
   - Login with SUPER_ADMIN credentials
   ↓
2. Full System Access
   - User Management
   - System Configuration
   - Audit Logs
   - All Manager/Receptionist features
   ↓
3. User Management
   - Create/edit/delete users
   - Assign roles
   - Manage permissions
   - Reset passwords
   ↓
4. System Configuration
   - Hotel settings
   - Email configuration
   - Payment settings
   - API keys management
   ↓
5. Audit & Monitoring
   - View audit logs
   - Monitor system health
   - Review error logs
   - Performance metrics
```

### Accessible Pages
- All admin pages
- User management
- System settings
- Audit logs
- Analytics dashboard

---

## 👨‍💼 Manager Flows

### Daily Operations Management Flow

```
1. Access Admin Dashboard
   - Navigate to /admin
   - Login with MANAGER credentials
   ↓
2. Morning Routine
   - Review today's arrivals
   - Check pending bookings
   - Review room status
   - Check kitchen orders
   ↓
3. Staff Management
   - Navigate to Admin → Staff
   - View all staff members
   - Add/edit staff information
   - Assign departments
   - Track performance
   ↓
4. Task Assignment
   - Navigate to Admin → Tasks
   - Create tasks for housekeeping/maintenance
   - Assign to specific staff
   - Set priorities and due dates
   - Track completion
   ↓
5. Analytics Review
   - Navigate to Admin → Analytics
   - View revenue reports
   - Check occupancy rates
   - Review order statistics
   - Analyze trends
   ↓
6. Inventory Management
   - Navigate to Admin → Inventory
   - Check stock levels
   - Reorder low stock items
   - Update inventory counts
   - Monitor alerts
   ↓
7. Menu Management
   - Navigate to Admin → Menu
   - Add/edit menu items
   - Update prices
   - Manage categories
   - Toggle availability
   ↓
8. Gallery Management
   - Navigate to Admin → Gallery
   - Upload new images
   - Categorize photos
   - Delete outdated images
   - Organize by type
```

### Accessible Pages
- All admin pages EXCEPT user management
- Staff management
- Task management
- Analytics dashboard
- Inventory management
- Gallery management

---

## 👩‍💼 Receptionist Flows

### Front Desk Operations Flow

```
1. Access Admin Dashboard
   - Navigate to /admin
   - Login with RECEPTIONIST credentials
   ↓
2. Check-In Process
   - Navigate to Admin → Bookings
   - Search for guest booking
   - Verify guest identity
   - Update booking status to "CHECKED_IN"
   - Assign room
   - Update room status to "OCCUPIED"
   - Generate QR code for room service
   - Provide room key and information
   ↓
3. Check-Out Process
   - Navigate to Admin → Bookings
   - Find guest's booking
   - Review all charges
   - Process payment
   - Update booking status to "CHECKED_OUT"
   - Update room status to "CLEANING"
   - Create housekeeping task
   - Generate receipt
   ↓
4. Booking Management
   - View all bookings
   - Filter by status/date
   - Search by guest name/room
   - Confirm pending bookings
   - Modify booking details
   - Handle cancellations
   ↓
5. Room Management
   - View all rooms
   - Check room availability
   - Update room status
   - View room details
   - Assign rooms to guests
   ↓
6. Order Processing
   - Navigate to Admin → Orders
   - View active orders
   - Update order status
   - Track order progress
   - Handle special requests
   ↓
7. Calendar View
   - Navigate to Admin → Calendar
   - View monthly bookings
   - See room occupancy
   - Plan room assignments
   - Identify availability gaps
```

### Accessible Pages
- Bookings management
- Room management
- Order processing
- Calendar view
- Task viewing (assigned tasks)
- Kitchen dashboard access

---

## 👨‍🍳 Kitchen Staff Flows

### Order Processing Flow

```
1. Access Kitchen Dashboard
   - Navigate to /kitchen/dashboard
   - Login with RECEPTIONIST/MANAGER/SUPER_ADMIN credentials
   ↓
2. View Active Orders
   - See all orders grouped by status
   - PENDING orders (new orders)
   - CONFIRMED orders (acknowledged)
   - PREPARING orders (in progress)
   - READY orders (awaiting pickup)
   ↓
3. Process New Order
   - Order appears in PENDING section
   - Review order details:
     * Room number
     * Guest name
     * Items and quantities
     * Special requests
     * Estimated prep time
   ↓
4. Confirm Order
   - Click "Confirm" button
   - Order moves to CONFIRMED status
   - Guest receives notification
   ↓
5. Start Preparation
   - Click "Start Preparing"
   - Order moves to PREPARING status
   - Timer starts for estimated prep time
   - Kitchen staff begins cooking
   ↓
6. Mark as Ready
   - When food is ready
   - Click "Mark as Ready"
   - Order moves to READY status
   - Notification sent to delivery staff
   - Order ready for pickup
   ↓
7. Order Delivery
   - Delivery staff picks up order
   - Delivers to guest room
   - Updates status to DELIVERED
   - Order marked as completed
   ↓
8. Monitor Order Queue
   - View order statistics
   - Track preparation times
   - Identify bottlenecks
   - Prioritize urgent orders
```

### Kitchen Dashboard Features
- Real-time order updates (refreshes every 10 seconds)
- Order filtering by status
- Order details with special requests
- Estimated preparation times
- Order statistics
- Today's orders view

### API Endpoints Used
- `GET /api/kitchen/orders` - Get all orders
- `PUT /api/kitchen/orders` - Update order status
- `GET /api/kitchen/orders?today=true` - Get today's orders

---

## 🧹 Housekeeping Staff Flows

### Room Cleaning & Maintenance Flow

```
1. Access Task Panel
   - Navigate to Admin → Tasks
   - Login with assigned credentials
   ↓
2. View Assigned Tasks
   - Filter by "HOUSEKEEPING" type
   - See tasks assigned to you
   - View task priorities
   - Check due dates
   ↓
3. Start Task
   - Select task from list
   - Click "Start Task"
   - Status changes to "IN_PROGRESS"
   ↓
4. Complete Room Cleaning
   - Clean room thoroughly
   - Restock amenities
   - Check room condition
   - Update room status
   ↓
5. Mark Task Complete
   - Click "Mark Complete"
   - Add completion notes
   - Update room status to "AVAILABLE"
   - Task status: COMPLETED
   ↓
6. Report Issues
   - If maintenance needed
   - Create maintenance task
   - Update room status to "MAINTENANCE"
   - Notify manager
```

### Task Types
- **HOUSEKEEPING** - Room cleaning after check-out
- **MAINTENANCE** - Room repairs/issues
- **SETUP** - Room preparation for arrival
- **INSPECTION** - Quality checks

### API Endpoints Used
- `GET /api/tasks` - Get assigned tasks
- `PATCH /api/tasks/[id]` - Update task status
- `PATCH /api/rooms/[id]` - Update room status

---

## 📋 Admin Management Flows (All Roles)

### Room Management Flow

```
1. Access Admin Dashboard
   - Navigate to /admin
   - Login with credentials
   ↓
2. Navigate to Rooms
   - Click "Rooms" in sidebar
   ↓
3. Manage Rooms
   - View all rooms
   - Filter by status/type
   - Search by room number
   ↓
4. Add/Edit Room
   - Click "Add Room" or "Edit"
   - Fill in room details
   - Set status and amenities
   - Save changes
   ↓
5. Update Room Status
   - Available → Occupied → Cleaning → Available
   - Or set to Maintenance
```

### Booking Management Flow

```
1. Access Bookings
   - Navigate to Admin → Bookings
   ↓
2. View Bookings
   - See all reservations
   - Filter by status
   - Search by guest/room
   ↓
3. Manage Booking
   - View booking details
   - Update status
   - Modify dates (if needed)
   - Add notes
   ↓
4. Process Status Changes
   - PENDING → CONFIRMED
   - CONFIRMED → CHECKED_IN
   - CHECKED_IN → CHECKED_OUT
```

### Task Management Flow

```
1. Create Task
   - Navigate to Admin → Tasks
   - Click "Create Task"
   ↓
2. Fill Task Details
   - Title and description
   - Priority level
   - Task type (Housekeeping, Maintenance, etc.)
   - Assign to staff
   - Set due date
   ↓
3. Track Progress
   - PENDING → IN_PROGRESS → COMPLETED
   - Update status as work progresses
   ↓
4. Complete Task
   - Mark as completed
   - Add completion notes
```

---

## 🔄 System Integration Flows

### Email Notification Flow

```
Booking Created
   ↓
Send Confirmation Email
   - Booking details
   - Confirmation number
   - Check-in instructions
   ↓
Status Updates
   - Booking confirmed
   - Check-in reminder
   - Check-out confirmation
```

### Payment Processing Flow

```
Booking Submission
   ↓
Payment Method Selected
   ↓
If Pay Now:
   - Process payment via Stripe
   - Verify payment
   - Update payment status
   ↓
If Pay Later:
   - Mark as pending
   - Charge at check-in
   ↓
Payment Confirmation
   - Update booking status
   - Send receipt
```

### Availability Checking Flow

```
Search Request
   ↓
Query Database
   - Get all rooms matching criteria
   - Check room status
   ↓
Check Existing Bookings
   - Find conflicting bookings
   - Filter unavailable rooms
   ↓
Calculate Pricing
   - Base price × nights
   - Apply discounts (if any)
   ↓
Return Available Rooms
   - With pricing
   - With availability status
```

---

## 📊 Flow Diagrams

### Booking Flow States

```
PENDING
   ↓
CONFIRMED
   ↓
CHECKED_IN
   ↓
CHECKED_OUT
   ↓
CANCELLED (can occur at any stage)
```

### Room Status Flow

```
AVAILABLE
   ↓
RESERVED (when booked)
   ↓
OCCUPIED (at check-in)
   ↓
CLEANING (at check-out)
   ↓
AVAILABLE (after cleaning)
   ↓
MAINTENANCE (if needed)
```

### Order Status Flow

```
PENDING
   ↓
PREPARING
   ↓
READY
   ↓
DELIVERED
   ↓
COMPLETED
```

---

## 📦 Additional Admin Flows

### Inventory Management Flow

```
1. Access Inventory
   - Navigate to Admin → Inventory
   ↓
2. View Inventory
   - See all inventory items
   - Filter by category/status
   - Check stock levels
   - View low stock alerts
   ↓
3. Add Inventory Item
   - Click "Add Item"
   - Enter item details:
     * Name and description
     * Category
     * Current quantity
     * Minimum quantity threshold
     * Unit of measurement
   - Save item
   ↓
4. Update Stock
   - Select item
   - Update quantity
   - Record reason (restock/usage)
   - Save changes
   ↓
5. Low Stock Alerts
   - System alerts when below threshold
   - Create reorder task
   - Track reorder status
```

### Menu Management Flow

```
1. Access Menu Management
   - Navigate to Admin → Menu
   ↓
2. View Menu Items
   - See all menu items
   - Filter by category
   - Check availability status
   ↓
3. Add Menu Item
   - Click "Add Menu Item"
   - Fill in details:
     * Name and description
     * Category (Breakfast, Lunch, Dinner, etc.)
     * Price
     * Preparation time
     * Dietary information
     * Image upload
   - Set availability
   - Save item
   ↓
4. Edit Menu Item
   - Select item to edit
   - Update any details
   - Change price/availability
   - Save changes
   ↓
5. Manage Categories
   - Organize items by category
   - Add new categories
   - Reorder categories
```

### QR Code Generation Flow

```
1. Access QR Generator
   - Navigate to Admin → QR Codes
   ↓
2. Generate QR Code
   - Select room number
   - Enter guest booking ID
   - Click "Generate QR Code"
   ↓
3. QR Code Created
   - QR code displayed
   - Ordering URL generated
   - Room-specific link created
   ↓
4. Print QR Code
   - Print QR code
   - Place in guest room
   - Guest can scan to order
```

### Gallery Management Flow

```
1. Access Gallery
   - Navigate to Admin → Gallery
   ↓
2. View Images
   - See all uploaded images
   - Filter by category
   - Preview images
   ↓
3. Upload Image
   - Click "Upload Image"
   - Select image file
   - Choose category:
     * Rooms
     * Lobby
     * Restaurant
     * Pool & Spa
     * Events
     * Exterior
   - Add description
   - Upload
   ↓
4. Manage Images
   - Edit image details
   - Change category
   - Delete images
   - Set as featured
```

### Analytics Dashboard Flow

```
1. Access Analytics
   - Navigate to Admin → Analytics
   ↓
2. View Dashboard
   - Revenue metrics
   - Occupancy rates
   - Booking statistics
   - Order statistics
   ↓
3. Filter Data
   - Select date range
   - Filter by category
   - Compare periods
   ↓
4. Generate Reports
   - Export data
   - Print reports
   - Share insights
```

---

## 🎯 Complete User Journeys by Role

### 👤 Guest Journey
1. **Discovery** → Browse homepage, view rooms, check gallery
2. **Booking** → Search availability, select room, complete booking
3. **Pre-Arrival** → Receive confirmation, check booking details
4. **Arrival** → Check-in at front desk, receive room key
5. **Stay** → Use amenities, order room service via QR code, track orders
6. **Departure** → Check-out, review charges, receive receipt

### 👩‍💼 Receptionist Journey
1. **Morning Setup** → Review today's arrivals, check room status
2. **Check-In** → Verify bookings, assign rooms, provide information
3. **Guest Services** → Handle requests, process orders, assist guests
4. **Check-Out** → Process payments, update statuses, create cleaning tasks
5. **End of Day** → Review completed check-outs, update room statuses

### 👨‍💼 Manager Journey
1. **Daily Review** → Check analytics, review occupancy, monitor operations
2. **Staff Management** → Assign tasks, review performance, manage schedules
3. **Operations** → Monitor kitchen, review inventory, manage menu
4. **Optimization** → Adjust pricing, update availability, improve processes
5. **Reporting** → Generate reports, analyze trends, plan improvements

### 👨‍🍳 Kitchen Staff Journey
1. **Shift Start** → Access kitchen dashboard, review pending orders
2. **Order Processing** → Confirm orders, start preparation, track progress
3. **Food Preparation** → Cook items, manage timing, handle special requests
4. **Order Completion** → Mark orders ready, coordinate with delivery
5. **Shift End** → Review completed orders, update inventory usage

### 🧹 Housekeeping Journey
1. **Task Assignment** → View assigned tasks, check priorities
2. **Room Cleaning** → Clean rooms, restock amenities, check condition
3. **Status Updates** → Update room status, mark tasks complete
4. **Issue Reporting** → Report maintenance needs, create tasks
5. **Completion** → Verify room readiness, update availability

### 👑 Super Admin Journey
1. **System Management** → Manage users, configure settings, monitor health
2. **Access Control** → Assign roles, manage permissions, audit access
3. **System Monitoring** → Review logs, check performance, troubleshoot issues
4. **Configuration** → Update settings, manage integrations, configure APIs
5. **Maintenance** → Plan updates, schedule backups, optimize performance

---

## 📝 Flow Documentation References

### Related Documents
- **README.md** - System flow overview (lines 102-113)
- **USER_TRAINING_GUIDE.md** - Step-by-step workflows
- **TESTING_CHECKLIST.md** - E2E flow testing scenarios
- **IMPROVEMENT_ROADMAP.md** - Booking flow improvements

### Code References
- `components/booking/booking-flow.tsx` - Booking UI flow component
- `lib/booking-api.ts` - Booking API functions
- `app/api/bookings/route.ts` - Booking API endpoints
- `app/api/rooms/availability/route.ts` - Availability checking

---

## 🔍 Testing Flows

### E2E Test Scenarios
1. **Guest Booking Flow** - Complete booking from search to confirmation
2. **Room Service Ordering** - QR code scan to order delivery
3. **Check-In Process** - Booking verification to room assignment
4. **Check-Out Process** - Charge calculation to receipt generation
5. **Admin Management** - Room/booking/task management workflows
6. **Kitchen Order Processing** - Order receipt to delivery completion
7. **Housekeeping Task Flow** - Task assignment to room availability
8. **Manager Operations** - Staff management, analytics, inventory

---

## 📊 Complete Feature Matrix by Role

| Feature | Guest | Receptionist | Manager | Super Admin |
|---------|-------|--------------|---------|-------------|
| Browse Rooms | ✅ | ✅ | ✅ | ✅ |
| Make Booking | ✅ | ✅ | ✅ | ✅ |
| Order Food | ✅ | ✅ | ✅ | ✅ |
| View Own Bookings | ✅ | ❌ | ❌ | ❌ |
| Manage All Bookings | ❌ | ✅ | ✅ | ✅ |
| Check-In/Check-Out | ❌ | ✅ | ✅ | ✅ |
| Manage Rooms | ❌ | ✅ | ✅ | ✅ |
| Process Orders | ❌ | ✅ | ✅ | ✅ |
| Kitchen Dashboard | ❌ | ✅ | ✅ | ✅ |
| Manage Staff | ❌ | ❌ | ✅ | ✅ |
| Assign Tasks | ❌ | ❌ | ✅ | ✅ |
| View Analytics | ❌ | ❌ | ✅ | ✅ |
| Manage Inventory | ❌ | ✅ | ✅ | ✅ |
| Edit Menu | ❌ | ✅ | ✅ | ✅ |
| Manage Gallery | ❌ | ❌ | ✅ | ✅ |
| Generate QR Codes | ❌ | ✅ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| System Configuration | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ |

---

## 🗺️ Complete Flow Map

### Guest-Facing Flows
- ✅ Room browsing and search
- ✅ Booking creation
- ✅ Room service ordering
- ✅ Order tracking
- ✅ Profile management

### Receptionist Flows
- ✅ Check-in process
- ✅ Check-out process
- ✅ Booking management
- ✅ Room status updates
- ✅ Order processing
- ✅ Calendar view

### Manager Flows
- ✅ All Receptionist flows
- ✅ Staff management
- ✅ Task assignment
- ✅ Analytics review
- ✅ Inventory management
- ✅ Menu management
- ✅ Gallery management

### Kitchen Staff Flows
- ✅ Order confirmation
- ✅ Order preparation
- ✅ Status updates
- ✅ Order queue management

### Housekeeping Flows
- ✅ Task viewing
- ✅ Task completion
- ✅ Room status updates
- ✅ Issue reporting

### Super Admin Flows
- ✅ All Manager flows
- ✅ User management
- ✅ System configuration
- ✅ Audit and monitoring

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0  
**Maintained By:** Development Team

