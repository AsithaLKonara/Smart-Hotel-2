Remaining Tasks & Recommended Next Steps 📋
Here are the remaining items to finish:

1. Unify Inventory & Procurement (Priority 3 Item) - [COMPLETED] ✅
- Embedded "Stock Catalog & Levels" and "Purchase Orders & Deliveries" tabs directly inside /admin/inventory.
- Integrated 1-click "Reorder PO" from low/out-of-stock items that automatically pre-fills purchase orders.
- Direct PO approval, goods receiving (which replenishes storeroom stock), and vendor invoice registration.
- Legacy /admin/procurement/orders cleanly redirects to /admin/inventory?tab=orders.

2. Reservations Route Alignment - [COMPLETED] ✅
- Seamlessly redirects `/admin/bookings` to `/admin/receptionist?view=bookings`.
- Updated all navigation sidebars (dashboard sidebar and admin sidebar) to directly open `/admin/receptionist?view=bookings`.
- Unified hotkeys (Alt+B), search results, and POS checkout redirects into the unified Receptionist desk.


3. Hall & Event Booking Integration (Open Document: /admin/halls/[id]) - [COMPLETED] ✅
- Integrated direct room folio posting into the Hall/Venue booking lifecycle (`/api/admin/halls/bookings`).
- Hall bookings can now be linked directly to an in-house room reservation upon booking creation or via the dedicated "Charge to Folio" button in the booking management UI.
- Posts double-entry ledger items and `EVENTS` category folio line items, updating BI revenue metrics accurately without hardcoded zeroes.

4. Git Commit & Cleanup - [COMPLETED] ✅
- All unified PMS changes verified via clean production build (`npm run build`).
- Changes staged and committed to `fix-bugs` branch.