# SmartHotel - Role-Based Operational Architecture & Flow Matrix

This document provides a deep-dive comparison of all user roles, their specific operational flows, associated routes, and authority boundaries within the SmartHotel Enterprise Ecosystem.

---

## 🎭 Role Comparison & Authority Matrix

| Role | Operational Scope | Prefix Authority | Primary Objective |
|:--- |:--- |:--- |:--- |
| **GUEST** | Personal Stay & Dining | `/dashboard`, `/order` | Stay satisfaction and seamless amenity access. |
| **RECEPTIONIST** | Front-of-House (FOH) | `/admin/receptionist` | Efficient Guest intake, room allocation, and FOH service. |
| **KITCHEN** | Back-of-House (BOH) | `/kitchen/dashboard` | Culinary fulfillment and SLA-based order preparation. |
| **HOUSEKEEPING** | Facility Maintenance | `/admin/housekeeping` | Room readiness, sanitization, and maintenance dispatch. |
| **MANAGER** | Operations Oversight | `/admin/manager` | Yield optimization, performance monitoring, and staff governance. |
| **SUPER_ADMIN** | System Sovereignty | `/admin/*` (Full) | System health, RBAC governance, and property configuration. |

---

## 👤 1. GUEST FLOW: The "Signature Elite" Experience
**Focus**: Personalization, ease of access, and luxury digital interaction.

### 📍 Key Routes:
- `/`: Public Landing & Discovery.
- `/rooms`: Room Catalog & Availability.
- `/booking`: Secure Reservation Engine.
- `/dashboard`: Personal Stay Command Center.
- `/order`: Integrated Dining & Room Service Portal.

### 🔄 Operational Flows:
1.  **Discovery & Intent**: Guest explores the mobile-first landing page, utilizing the **Hero Booking Widget** to check real-time availability.
2.  **Reservation**: Complete intake of guest details and payment processing (Pay Now via Stripe / Pay Later).
3.  **Digital Check-In (Dashboard)**: Upon check-in, the dashboard activates, revealing the **Dining Hub** and personalized greeting.
4.  **Amenity Consumption**: Guest uses the `/order` route to browse the **Digital Menu**, placing room service orders or reserving tables at *The Gilded Plate*.
5.  **Stay Monitoring**: Real-time tracking of orders via the dashboard, integrated with the KDS.

---

## 👩‍💼 2. RECEPTIONIST FLOW: The "Live Desk" Operations
**Focus**: guest logistics, room inventory, and immediate FOH assistance.

### 📍 Key Routes:
- `/admin/receptionist`: Main FOH Dashboard.
- `/admin/bookings`: Global Reservation List.
- `/admin/rooms`: Live Inventory Management.

### 🔄 Operational Flows:
1.  **Arrival Logistics**: Receptionist monitors the "Arrivals" timeline to prepare for guest check-ins.
2.  **Intake & Allocation**: Validating guest credentials and matching them to "Ready" rooms in the inventory.
3.  **Operational Transitions**: Triggers the `CHECKED_IN` status, which activates the Guest's digital stay credentials.
4.  **In-Stay Support**: Managing guest requests and processing manual room service entries if required.
5.  **Departure Logistics**: Consolidating bills, processing check-outs, and triggering the `CLEANING` state for housekeeping.

---

## 👨‍🍳 3. KITCHEN FLOW: The Culinary Display System (KDS)
**Focus**: Accuracy, timing, and SLA-based culinary fulfillment.

### 📍 Key Routes:
- `/kitchen/dashboard`: Interactive KDS Screen.
- `/kitchen/orders`: Historical Order Data.

### 🔄 Operational Flows:
1.  **Order Intake**: New orders from guests or reception appear in real-time in the `PENDING` queue with sound alerts.
2.  **Confirmation**: Chef confirms the order, moving it to `PREPARING` and triggering an estimated time update for the guest.
3.  **Execution**: Culinary staff prepares items, managing allergy alerts and special requests displayed on the KDS card.
4.  **Readiness**: Chef marks order as `READY`, alerting the delivery staff/waiter.
5.  **Completion**: Upon delivery, order is moved to `DELIVERED`/`COMPLETED`, clearing the live queue.

---

## 🧹 4. HOUSEKEEPING FLOW: The "Dispatch" Hub
**Focus**: Sanitization standards, room readiness, and facility maintenance.

### 📍 Key Routes:
- `/admin/housekeeping`: Task Management & Dispatch.
- `/admin/rooms`: Room Status Monitor.

### 🔄 Operational Flows:
1.  **Task Acquisition**: Staff views assigned cleaning tasks triggered automatically by guest check-outs.
2.  **Service Execution**: Cleaning and restocking of rooms according to 5-star hospitality standards.
3.  **Status Propagation**: Upon completion, the room is marked as `READY`, notifying the Receptionist center for the next check-in.
4.  **Maintenance Escalation**: Staff identifies and reports room issues (e.g., broken fixture), triggering a `MAINTENANCE` task and blocking the room from inventory.

---

## 👨‍💼 5. MANAGER FLOW: The Operational Intelligence Center
**Focus**: Performance metrics, staff governance, and yield management.

### 📍 Key Routes:
- `/admin/manager`: Operations Intelligence Dashboard.
- `/admin/staff`: HR & Personnel Governance.
- `/admin/analytics`: Financial & Performance Reporting.

### 🔄 Operational Flows:
1.  **Performance Oversight**: Monitoring SLA breaches and incident reports across Kitchen and Housekeeping.
2.  **Yield Governance**: Reviewing RevPAR, ADR, and occupancy forecasts to optimize pricing and inventory.
3.  **Personnel Management**: assigning roles, monitoring department structure, and tracking staff task completion rates.
4.  **Strategic Adjustments**: Modifying menu prices or inventory status based on analytics data.

---

## 👑 6. SUPER_ADMIN FLOW: System Sovereignty & Root Control
**Focus**: Security, platform integrity, and global configuration.

### 📍 Key Routes:
- `/admin/dashboard`: The Command Cockpit.
- `/admin/settings`: Governance Console.
- `/admin/ota`: Channel Sync Engine.
- `/admin/users`: User RBAC Management.

### 🔄 Operational Flows:
1.  **System Configuration**: Managing property branding, contact infrastructure, and global operational protocols.
2.  **RBAC Governance**: Creating users and assigning granular roles to maintain strict prefix isolation.
3.  **Integration Monitoring**: Overseeing bidirectional sync with Booking.com/Agoda and managing webhook logs.
4.  **Security Auditing**: Reviewing system logs and ensuring the middleware edge is hardening all protected routes.

---

## 🛡️ Prefix-Based Security Architecture (Middleware)

| Route Prefix | Allowed Roles | Isolation Logic |
|:--- |:--- |:--- |
| `/admin/*` | `SUPER_ADMIN`, `MANAGER`, `RECEPTIONIST`, `HOUSEKEEPING` | Access further restricted by sub-route permissions. |
| `/kitchen/*` | `SUPER_ADMIN`, `MANAGER`, `KITCHEN` | Strictly culinary focus; no guest data access. |
| `/dashboard` | `GUEST` (Authenticated) | Redirects to `/signin` if no active guest session. |
| `/admin/settings`| `SUPER_ADMIN` Only | Locked to root administrative credentials. |

---

**Last Updated:** 2025-05-15  
**Version:** 2.0.0 (Enterprise Refactor)  
**Maintained By:** Principal Architecture & Security Team
