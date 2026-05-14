# SmartHotel - User Flows Documentation

## 📋 Table of Contents
1. [Guest Booking & Stay Flow](#guest-booking--stay-flow)
2. [Restaurant & Dining Hub Flow](#restaurant--dining-hub-flow)
3. [Check-In/Check-Out Flow](#check-incheck-out-flow)
4. [Admin & Operational Workflows](#admin--operational-workflows)
5. [Signature Elite UI/UX Standards](#signature-elite-uiux-standards)
6. [System Integration & Security](#system-integration--security)

---

## 🏨 Guest Booking & Stay Flow

### Overview
The complete journey from room search to booking confirmation and in-stay management.

### Step-by-Step Flow

```
1. Guest visits homepage (Mobile-First Hero Section)
   ↓
2. Search Available Rooms
   - Select dates and guest count
   - Direct entry from Hero Booking Widget
   ↓
3. View Available Rooms
   - Compare "Signature Elite" suites
   - Real-time availability filtering
   ↓
4. Select & Book
   - Guest Information & Payment Selection
   - Support for Stripe (Pay Now) or On-Site (Pay Later)
   ↓
5. Stay Management (Guest Dashboard)
   - Integrated Stay Summary
   - Personalized Greeting & Room Controls
```

### Key Features
- **Mobile-First Responsiveness**: Hero section optimized for all viewports.
- **Real-time Sync**: Availability reflects current room status across all platforms.
- **Personalized Stay**: Dashboard adapts to active guest session.

---

## 🍽️ Restaurant & Dining Hub Flow

### Overview
Unified dining experience integrating table reservations and room service.

### Step-by-Step Flow

```
1. Guest accesses Dining Hub from Dashboard
   ↓
2. Choose Service Type
   - Table Reservation (The Gilded Plate)
   - In-Room Dining (Room Service)
   ↓
3. Browse Digital Menu
   - Category-based filtering (Appetizers, Mains, Spirits)
   - Real-time price and availability
   ↓
4. Place Order / Reservation
   - Select items/time
   - Specify dietary requirements
   ↓
5. Tracking & Fulfillment
   - Track order through KDS (Kitchen Display System)
   - Automatic room billing integration
```

### Key Features
- **Integrated Portal**: No separate QR scanning required (though supported for quick access).
- **Session-Aware Ordering**: Automatic room assignment based on guest session.
- **KDS Integration**: Direct feed to kitchen prep queue.

---

## ✅ Check-In/Check-Out Flow

### Overview
Streamlined guest arrival and departure handled via the Receptionist Center.

### Check-In Flow
1. **Front Desk Search**: Locate booking by reference or guest name.
2. **Room Assignment**: Match guest to available "Ready" rooms.
3. **Status Update**: Trigger transition from `AVAILABLE` to `OCCUPIED`.
4. **Credential Provisioning**: Handover of room key and digital stay credentials.

### Check-Out Flow
1. **Charge Consolidation**: Review room service, stay fees, and additional amenities.
2. **Final Payment**: Secure settlement via on-site terminal or stored card.
3. **Dispatch Trigger**: Automatically move room to `CLEANING` status and alert Housekeeping.

---

## 👨‍💼 Admin & Operational Workflows

### 🕹️ Admin Command Cockpit
The central "Mission Control" for all administrative and operational centers.

- **Executive Mission Control**: High-level yield and ADR governance.
- **Receptionist Center**: Real-time Arrivals/Departures and Live Desk.
- **Kitchen Display (KDS)**: Culinary queue management and SLA tracking.
- **Housekeeping Hub**: Mobile-first task dispatch and clean-sweep timers.
- **HR & Personnel**: Unified staff governance and department structure.
- **Governance Console**: Root-level property settings and brand identity.

### 👔 HR & Personnel Management
Refactored into a high-end administration panel for human resource governance.

1. **Onboarding**: Direct entry of new personnel into the hotel hierarchy.
2. **Role Assignment**: Granular RBAC (Admin, Manager, Receptionist, Kitchen, Housekeeping).
3. **Performance Tracking**: Overview of task completion rates and SLA compliance.
4. **Luxury Dark UI**: Optimized for long-session administrative focus.

---

## 🎨 Signature Elite UI/UX Standards

### Design System
- **Theme**: Luxury Dark (#0c0c0c background, gold gradients, premium typography).
- **Interactions**: Framer Motion transitions, micro-animations for feedback.
- **Responsiveness**: Complete mobile-first refactor for all public-facing and staff-facing views.

### Principles
- **Clarity**: No disconnected UI or placeholders.
- **Aesthetics**: Premium, cinematic aesthetic to match 5-star brand standards.
- **Accessibility**: High-contrast, semantic HTML, and screen-reader awareness.

---

## 👨‍💼 Role-Based Workflows & Authority

### 🔑 Role Hierarchy & Access Matrix
The platform enforces absolute operational isolation via middleware-level prefix guarding.

| Role | Access Tier | Primary Dashboard | Prefix Authority |
|:---|:---|:---|:---|
| **SUPER_ADMIN** | Tier 0 (Root) | `/admin/dashboard` | `/admin/*`, `/kitchen/*` |
| **MANAGER** | Tier 1 (Strategy) | `/admin/manager` | `/admin/manager`, `/admin/staff` |
| **RECEPTIONIST** | Tier 2 (Front-of-House) | `/admin/receptionist` | `/admin/receptionist`, `/admin/bookings` |
| **KITCHEN** | Tier 3 (Back-of-House) | `/kitchen/dashboard` | `/kitchen/*` |
| **HOUSEKEEPING**| Tier 4 (Services) | `/admin/housekeeping` | `/admin/housekeeping` |
| **GUEST** | Tier 5 (Consumer) | `/dashboard` | `/dashboard`, `/order` |

### 📘 Deep-Dive Architecture
For a complete, field-by-field comparison of role flows, routes, and exhaustive feature lists, refer to the [Role-Based Architecture Matrix](file:///Users/asithalakmal/Documents/web/SmartHotel/docs/ROLE_BASED_ARCH_MATRIX.md).

---

**Last Updated:** 2025-05-15  
**Version:** 2.0.0 (Enterprise Refactor)  
**Maintained By:** Principal Architecture Team
