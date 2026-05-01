# 🧪 How to Test All CRUD Features

**Quick Start Guide for Testing**

---

## 🚀 **Option 1: Test on Deployment URL (Recommended)**

**URL:** https://smarthotel-demo.vercel.app/

### Steps:
1. **Open the deployment URL** in your browser
2. **Log in** as admin: `admin@smarthotel.com` / `admin123`
3. **Navigate to admin pages** using the sidebar:
   - Settings → `/admin/settings`
   - FAQ → `/admin/faq`
   - Hero Slides → `/admin/hero-slides`
   - Navigation → `/admin/navigation`
   - Social Links → `/admin/social-links`
   - Amenities → `/admin/amenities`
   - Attractions → `/admin/attractions`
   - Footer Links → `/admin/footer-links`
4. **Test each CRUD operation:**
   - Create: Click "Add" button → Fill form → Save
   - Read: Verify item appears in list
   - Update: Click "Edit" → Modify → Save
   - Delete: Click "Delete" → Confirm

5. **Test Frontend Integration:**
   - Go to homepage → Check navigation loads from API
   - Check hero slides load from API
   - Scroll to footer → Check social links and footer links load
   - Go to Contact page → Check FAQs load

---

## 🏠 **Option 2: Test Locally**

### Prerequisites:
1. Make sure database is configured (DATABASE_URL)
2. Run `npm run dev` to start local server
3. Server should start on `http://localhost:3000`

### Steps:
1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Navigate to `http://localhost:3000`

3. **Follow same testing steps as Option 1**

---

## ✅ **Quick Test Checklist**

### Essential Tests (Must Do):
- [ ] Can log in to admin dashboard
- [ ] Settings page loads and saves
- [ ] FAQ page loads and can create/update/delete
- [ ] Hero Slides page loads and can create/update/delete
- [ ] Navigation page loads and can create/update/delete
- [ ] Social Links page loads and can create/update/delete
- [ ] Footer links appear on frontend
- [ ] Navigation links appear on frontend

### Comprehensive Tests (Should Do):
- [ ] Test all 8 admin pages
- [ ] Test all CRUD operations on each page
- [ ] Test search/filter functionality
- [ ] Test frontend components load data
- [ ] Test data persists after refresh
- [ ] Test authentication/authorization
- [ ] Check console for errors

---

## 🐛 **Common Issues & Solutions**

### Issue: "Failed to load [resource]"
**Solution:** Check if database is connected and seeded

### Issue: "Unauthorized" errors
**Solution:** Make sure you're logged in with admin credentials

### Issue: Empty lists on admin pages
**Solution:** This is normal - create items using "Add" button

### Issue: Frontend doesn't show data
**Solution:** 
- Check browser console for API errors
- Verify API endpoints return data
- Check if data has `active: true`

---

## 📊 **Expected Results**

### After Testing:
- ✅ All 8 admin pages load correctly
- ✅ All CRUD operations work
- ✅ Frontend components load data from APIs
- ✅ No console errors (or only expected ones)
- ✅ Data persists after refresh
- ✅ Authentication works correctly

---

**Use `CRUD_MANUAL_TEST_CHECKLIST.md` for detailed testing steps!**

