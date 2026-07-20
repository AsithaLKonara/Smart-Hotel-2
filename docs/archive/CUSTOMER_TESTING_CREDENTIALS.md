# 🔑 SmartHotel Demo - Customer Testing Credentials

**Demo URL:** `https://smarthotel-demo.vercel.app/`

> [!CAUTION]
> **Passwords are NOT stored in this file.** Retrieve them from the internal password manager (1Password / Bitwarden vault: `SmartHotel Demo`) or from a team member.  
> All demo accounts follow the seeded password pattern defined in `prisma/seed.ts`.

---

## 👑 Admin Access (Full System)

**Email:** `admin@smarthotel.com`  
**Password:** `[retrieve from password manager]`

**Access:**
- All 13 admin pages
- Full system management
- Analytics and reporting
- User management

**Recommended Starting Point:**
- Admin Dashboard: `https://smarthotel-demo.vercel.app/admin`

---

## 👨‍💼 Manager Access

**Email:** `manager@smarthotel.com`  
**Password:** `[retrieve from password manager]`

**Access:**
- Operations management
- Analytics and reporting
- Most admin features

---

## 👩‍💼 Receptionist Access

**Email:** `receptionist@smarthotel.com`  
**Password:** `[retrieve from password manager]`

**Access:**
- Guest services
- Booking management
- Check-in/check-out

---

## 👤 Guest Access

**Email:** `guest@example.com`  
**Password:** `[retrieve from password manager]`

**Access:**
- Booking system
- Room service ordering
- Guest dashboard

---

## 📝 Notes for Testing

- All demo accounts are seeded via `prisma/seed.ts` — run `npm run db:seed` to reset.
- To share credentials externally, use the team password manager share link — do **not** paste passwords into documents or chat.

---

## 🧪 Testing Checklist

- [ ] Login works in Chrome (no password warnings)
- [ ] Login works in Firefox
- [ ] Login works in Safari
- [ ] Login works in Edge
- [ ] Admin dashboard loads correctly
- [ ] All admin pages accessible
- [ ] Guest booking flow works
- [ ] Room service ordering works

---

**Last Updated:** July 2026 (passwords redacted from repo)  
**Status:** ✅ Ready for Testing — retrieve credentials from password manager
