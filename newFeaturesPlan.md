Based on an architectural and operational review of the codebase against international hospitality chain standards (e.g., Marriott, Hilton, Taj multi-property PMS/CRS standards), here is a breakdown of the **critical missing features** required for a true **Enterprise Multi-Property Hotel Management System**:

---

### 1. Central Reservation System (CRS) & Cross-Property Booking
* **Cluster Availability Search & Cross-Selling:** When Property A is 100% sold out for requested dates, the front-desk/booking engine cannot automatically offer or book rooms at sister properties (e.g., *"Beach Resort is fully booked, but City Hotel has 3 Deluxe rooms available 15km away"*).
* **Cross-Property Booking Transfers:** Inability to transfer a reservation from Property A to Property B (for overbooking resolution or guest rerouting) with one click without manually cancelling, refunding, and recreating the booking.
* **CRO (Central Reservation Office / Call Center) Mode:** Call-center reservation agents currently have to switch properties in the header one by one. A true multi-property PMS needs a single unified screen to quote rates, check availability, and hold rooms across all properties simultaneously.
* **Multi-Property Group Blocks (Master Contracts):** Inability to create a single master contract for tour operators, conferences, or destination weddings that split room allocations across multiple sister properties under one group organizer.

---

### 2. Multi-Property Rate & Revenue Management
* **Rate Plan Inheritance & Master Bar Grid:** Rate plans are currently configured per property. There is no central inheritance model where HQ defines a global rate structure (e.g., *"Best Flexible Rate"* or *"Corporate Preferred"*) that automatically cascades to all branches with property-specific base rates or percentage multipliers.
* **Cluster Dynamic Pricing / Yield Coordination:** When regional demand surges (e.g., a major sporting event or festival in a city), the system cannot apply coordinated yield rules across a cluster of properties in that region.
* **Rate Parity Enforcement Across Properties:** No central dashboard monitoring whether different branches are accidentally competing against each other with inconsistent OTA rates.

---

### 3. Consolidated Group Financials & Inter-Company Accounting
* **Inter-Company Debits & Credits (Due To / Due From Ledgers):** 
  * If a guest checks in at Property A but settles their bill at the restaurant of Property B, the system has no automated Inter-Company Clearing Account to debit Property A and credit Property B.
  * No inter-property linen, amenity, or asset transfer accounting.
* **Multi-Currency Consolidation to HQ Reporting Currency:** Different properties may transact in local currencies (e.g., LKR, USD, EUR, AED). There is no automated daily FX table to convert and consolidate P&L, RevPAR, and ADR into a single unified HQ currency (e.g., USD) with unrealized FX gain/loss tracking.
* **HQ Royalty & Management Fee Automation:** Automatic deduction of corporate brand management fees (e.g., 3% gross revenue + 2% marketing fee) calculated from each property’s monthly close.

---

### 4. Enterprise CRM & Global Guest Identity Resolution
* **Central Guest Deduplication (Golden Record):** If a guest books at Property 1 with `john@example.com` and at Property 2 with `j.doe@example.com` or phone number, there is no identity resolution engine to detect and merge duplicate profiles into a single global chain profile.
* **Global VIP & Security Blacklist Propagation:** If a guest causes property damage, disputes charges, or is flagged as a high-roller VIP at Property A, this flag does not automatically alert the front desk at Property B when they attempt to check in.
* **Cross-Property Guest Preferences & History:** A guest's pillow preference, allergies, or past complaints logged at Hotel A are not surfaced to the concierge or housekeeping staff at Hotel B.

---

### 5. Multi-Property Inventory & Central Procurement
* **Central Warehouse & Internal Transfer Orders (STO):** Chains buy bulk amenities, linen, and dry rations at central storage. The current procurement module is property-isolated and lacks:
  * Central Purchase Orders (CPO) to vendors with bulk discounts.
  * Internal Stock Requisitions and Transfer Notes between properties.
* **Central Kitchen / Commissary Model:** No workflow for a centralized bakery or food production unit distributing prepped goods to satellite hotel restaurants.

---

### 6. Human Resources & Shared Workforce Management
* **Floating Staff & Relief Staff Scheduling:** Maintenance specialists, relief night auditors, and executive chefs frequently cover shifts across multiple branches. The current HR module ties staff to a single `propertyId`, preventing cross-property shift rostering, timesheet consolidation, or split-payroll allocation.
* **Chain-Wide Training & Compliance Certifications:** No central tracking for health, safety, and fire compliance renewals across property staff.

---

### 7. Governance, Clustering & Regional Management
* **Hierarchical Role Scoping (Regional / Cluster Roles):**
  * Currently, the system only supports Global (`SUPER_ADMIN`) or Single-Property (`MANAGER`, `RECEPTIONIST`).
  * Missing: **Regional Director** or **Cluster Revenue Manager** (e.g., managing only "South Coast Cluster" consisting of 3 specific properties, without access to "Capital City" properties).
* **Brand Standards QA & Property Audit Inspections:** No digital audit checklist module for corporate inspectors to visit properties, score cleanliness, service standards, and physical asset condition against chain benchmarks.