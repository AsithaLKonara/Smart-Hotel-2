# SmartHotel Changelog

## 2025-11-08 – Full Production Integration

- Added analytics helpers under `lib/analytics/` and refactored `/api/analytics*` routes to share caching, rate limiting, and error handling.
- Regenerated `prisma/seed-comprehensive.ts` with full data purge + rebuild for rooms, bookings, orders, tasks, promotions, notifications, and settings.
- Converted hotel data loader to cached async helpers (`getHotelData`, `getHotelDataSync`) and updated unit tests to mock Prisma and settings.
- Made email templates async, sourced contact info from DB settings, and refreshed `lib/email.ts` sender defaults.
- Introduced Prisma indexes on `Booking`, `Invoice`, `Task`, and `FoodOrder` for faster dashboard queries.
- Documented operations & release flow in `README.md` and `✅_ALL_READY_DEPLOY_NOW.md`; added Mailtrap + analytics smoke scripts.
- Hardened Prisma logging and rate limiting across analytics/export endpoints.
- Verified contact pipeline and dashboard analytics with `tsx` scripts; expanded Jest coverage for hotel data, email templates, and rooms API.
