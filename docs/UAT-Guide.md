# SmartHotel User Acceptance Testing (UAT) Guide

Welcome to the User Acceptance Testing phase for SmartHotel! 
As department leads and operational staff, you are the true experts. The goal of this phase is for you to try and "break" the system by running through your actual daily routines. Do not be gentle—if a workflow is clumsy, or if the system allows you to do something impossible (like checking a guest into a dirty room), we need to know!

## General Instructions
1. **Access the Application**: Navigate to the provided Staging URL.
2. **Log Issues**: Track all bugs, confusing UI elements, or workflow blockages in the shared company tracker (e.g., Jira, Trello, or a shared Spreadsheet). 
3. **Include Details**: For every bug, note the Email used to log in, what you tried to do, what you expected, and what actually happened.

---

## 1. Reception & Front Desk
**Login**: `receptionist@smarthotel.com` (Pass: `SmartHotel@2025!Reception`)

### Workflows to Test:
- [ ] **Walk-in Booking:** Create a new booking for a guest standing at the desk for tonight. Ensure pricing is correct and the room is instantly removed from availability.
- [ ] **Check-In Validation:** Attempt to check-in a guest early. Attempt to check-in a guest into a room currently marked as "Dirty" by Housekeeping (this should show a warning or be blocked).
- [ ] **Folio Routing:** Post a manual charge (e.g., Spa) to a guest's folio. 
- [ ] **Check-Out:** Process a full checkout, generate the invoice, and ensure the room status automatically flips to "Dirty" for Housekeeping.
- [ ] **Overbooking Check:** Attempt to book 2 different guests into the same specific room number for overlapping dates. The system must prevent this.

## 2. Housekeeping
**Login**: `housekeeping@smarthotel.com` (Pass: `SmartHotel@2025!House`)

### Workflows to Test:
- [ ] **Room Status Updates:** Check your daily dashboard. Select a "Dirty" room, mark it "In Progress", and then "Clean". Verify it disappears from your priority list.
- [ ] **Discrepancy Reporting:** Mark a room as "Out of Order" (e.g., broken AC). Ensure Maintenance is notified.
- [ ] **Lost and Found:** Log a found item (e.g., "Left laptop charger") with a photo.
- [ ] **Inventory:** Deduct 10 fresh towels from your cart inventory. Does the system update stock correctly?

## 3. Maintenance (Engineering)
**Login**: `maintenance@smarthotel.com` (Pass: `SmartHotel@2025!Maint`)

### Workflows to Test:
- [ ] **Work Orders:** Locate the "Out of Order" room reported by Housekeeping. Assign it to yourself, mark it "Resolved", and verify the room becomes available again for Reception.
- [ ] **Preventative Maintenance:** Check the automatically generated monthly HVAC inspection tasks. Mark one as complete.

## 4. Restaurant & F&B (Kitchen / POS)
**Login**: `kitchen@smarthotel.com` (Pass: `SmartHotel@2025!Kitchen`)

### Workflows to Test:
- [ ] **Room Service Order:** As a guest (use incognito window), place a digital room service order. As the Kitchen, receive the order on the POS dashboard, update status to "Preparing", and then "Delivered".
- [ ] **Charge to Room (POS):** Open the POS interface, add a Burger and Beer, and charge it to "Room 101". Verify the signature/validation flow. 
- [ ] **Menu Management:** Temporarily mark an item as "Out of Stock" (86'd) and verify it disappears from the guest-facing digital menu.

## 5. Management & Finance
**Login**: `manager@smarthotel.com` (Pass: `SmartHotel@2025!Manager`)

### Workflows to Test:
- [ ] **Night Audit:** Run the Night Audit simulation. Verify that room rates are correctly posted to all currently occupied rooms, and no-shows are penalized.
- [ ] **Analytics:** Open the Analytics dashboard. Verify that RevPAR (Revenue Per Available Room) and ADR (Average Daily Rate) calculate correctly based on the current occupancy.
- [ ] **Yield Management:** Set a rule to increase prices by 15% when occupancy > 80%. Verify the booking engine reflects this price hike.

## 6. Guest Portal
**Login**: `guest@example.com` (Pass: `SmartHotel@2025!Guest`) or create a new account!

### Workflows to Test:
- [ ] **Self-Service:** Log in, view your current active stay.
- [ ] **Requests:** Request "Extra Towels" via the digital concierge. (Switch to the Housekeeping account and ensure the task popped up!)
- [ ] **Mobile Responsiveness:** Do all of this from your actual smartphone to ensure the UI isn't broken on small screens.
