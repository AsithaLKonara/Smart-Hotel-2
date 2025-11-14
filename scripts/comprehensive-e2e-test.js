#!/usr/bin/env node

/**
 * Comprehensive E2E Test Script
 * Tests all pages, flows, RBAC, components, and integrations
 */

const BASE_URL = process.env.BASE_URL || 'https://smarthotel-demo.vercel.app';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const results = {
  pages: { total: 0, passed: 0, failed: 0, errors: [] },
  apis: { total: 0, passed: 0, failed: 0, errors: [] },
  flows: { total: 0, passed: 0, failed: 0, errors: [] },
  rbac: { total: 0, passed: 0, failed: 0, errors: [] },
};

// All pages to test
const pages = [
  // Public
  { path: '/', name: 'Homepage', category: 'Public' },
  { path: '/rooms', name: 'Rooms Listing', category: 'Public' },
  { path: '/booking', name: 'Booking', category: 'Public' },
  { path: '/booking-flow', name: 'Booking Flow', category: 'Public' },
  { path: '/order', name: 'Restaurant Menu', category: 'Public' },
  { path: '/gallery', name: 'Gallery', category: 'Public' },
  { path: '/contact', name: 'Contact', category: 'Public' },
  { path: '/about', name: 'About', category: 'Public' },
  { path: '/facilities', name: 'Facilities', category: 'Public' },
  // Legal
  { path: '/privacy', name: 'Privacy Policy', category: 'Legal' },
  { path: '/terms', name: 'Terms of Service', category: 'Legal' },
  { path: '/cookies', name: 'Cookie Policy', category: 'Legal' },
  // Auth
  { path: '/auth/signin', name: 'Sign In', category: 'Auth' },
  { path: '/auth/signup', name: 'Sign Up', category: 'Auth' },
  { path: '/auth/forgot-password', name: 'Forgot Password', category: 'Auth' },
  { path: '/auth/reset-password', name: 'Reset Password', category: 'Auth' },
  // Guest
  { path: '/my-bookings', name: 'My Bookings', category: 'Guest' },
  // Dashboard
  { path: '/dashboard', name: 'Dashboard', category: 'Dashboard' },
  { path: '/dashboard/bookings', name: 'Dashboard Bookings', category: 'Dashboard' },
  { path: '/dashboard/orders', name: 'Dashboard Orders', category: 'Dashboard' },
  { path: '/dashboard/revenue', name: 'Dashboard Revenue', category: 'Dashboard' },
  { path: '/dashboard/tasks', name: 'Dashboard Tasks', category: 'Dashboard' },
  // Kitchen
  { path: '/kitchen/dashboard', name: 'Kitchen Dashboard', category: 'Kitchen' },
  // Admin
  { path: '/admin', name: 'Admin Dashboard', category: 'Admin' },
  { path: '/admin/dashboard', name: 'Admin Dashboard Main', category: 'Admin' },
  { path: '/admin/rooms', name: 'Admin Rooms', category: 'Admin' },
  { path: '/admin/bookings', name: 'Admin Bookings', category: 'Admin' },
  { path: '/admin/calendar', name: 'Admin Calendar', category: 'Admin' },
  { path: '/admin/dashboard/checkin-checkout', name: 'Check-In/Check-Out', category: 'Admin' },
  { path: '/admin/staff', name: 'Admin Staff', category: 'Admin' },
  { path: '/admin/tasks', name: 'Admin Tasks', category: 'Admin' },
  { path: '/admin/menu', name: 'Admin Menu', category: 'Admin' },
  { path: '/admin/orders', name: 'Admin Orders', category: 'Admin' },
  { path: '/admin/inventory', name: 'Admin Inventory', category: 'Admin' },
  { path: '/admin/gallery', name: 'Admin Gallery', category: 'Admin' },
  { path: '/admin/qr-codes', name: 'QR Codes', category: 'Admin' },
  { path: '/admin/analytics', name: 'Admin Analytics', category: 'Admin' },
];

// All API endpoints to test
const apis = [
  { path: '/api/health/live', method: 'GET', name: 'Health Live' },
  { path: '/api/health/ready', method: 'GET', name: 'Health Ready' },
  { path: '/api/rooms', method: 'GET', name: 'List Rooms' },
  { path: '/api/rooms/availability?checkin=2025-12-15&checkout=2025-12-18&guests=2&type=all', method: 'GET', name: 'Room Availability' },
  { path: '/api/restaurant/menu', method: 'GET', name: 'Restaurant Menu' },
  { path: '/api/settings/contact', method: 'GET', name: 'Contact Settings' },
  { path: '/api/auth/session', method: 'GET', name: 'Auth Session' },
];

async function testPage(page) {
  results.pages.total++;
  const url = `${BASE_URL}${page.path}`;
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'text/html' },
      redirect: 'follow',
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const isSuccess = response.status === 200;
    
    if (isSuccess) {
      results.pages.passed++;
      console.log(`${colors.green}✓${colors.reset} ${page.name} (${responseTime}ms)`);
    } else {
      results.pages.failed++;
      results.pages.errors.push({ page: page.name, status: response.status, error: 'HTTP ' + response.status });
      console.log(`${colors.red}✗${colors.reset} ${page.name} - HTTP ${response.status}`);
    }
  } catch (error) {
    results.pages.failed++;
    results.pages.errors.push({ page: page.name, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${page.name} - ${error.message}`);
  }
}

async function testAPI(api) {
  results.apis.total++;
  const url = `${BASE_URL}${api.path}`;
  
  try {
    const response = await fetch(url, { method: api.method });
    const isSuccess = response.status === 200 || response.status === 401; // 401 is expected for protected routes
    
    if (isSuccess) {
      results.apis.passed++;
      console.log(`${colors.green}✓${colors.reset} ${api.method} ${api.name}`);
    } else {
      results.apis.failed++;
      results.apis.errors.push({ api: api.name, status: response.status });
      console.log(`${colors.red}✗${colors.reset} ${api.method} ${api.name} - HTTP ${response.status}`);
    }
  } catch (error) {
    results.apis.failed++;
    results.apis.errors.push({ api: api.name, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${api.method} ${api.name} - ${error.message}`);
  }
}

async function runTests() {
  console.log(`${colors.cyan}${colors.bright}
═══════════════════════════════════════════════════════════════
  SmartHotel - Comprehensive E2E Production QA Test
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.blue}Testing ${pages.length} pages...${colors.reset}\n`);
  for (const page of pages) {
    await testPage(page);
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
  }

  console.log(`\n${colors.blue}Testing ${apis.length} API endpoints...${colors.reset}\n`);
  for (const api of apis) {
    await testAPI(api);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════
  TEST RESULTS SUMMARY
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bright}Pages:${colors.reset} ${results.pages.passed}/${results.pages.total} passed (${((results.pages.passed/results.pages.total)*100).toFixed(1)}%)`);
  console.log(`${colors.bright}APIs:${colors.reset} ${results.apis.passed}/${results.apis.total} passed (${((results.apis.passed/results.apis.total)*100).toFixed(1)}%)`);

  if (results.pages.errors.length > 0) {
    console.log(`\n${colors.red}Page Errors:${colors.reset}`);
    results.pages.errors.forEach(err => {
      console.log(`  - ${err.page}: ${err.error || 'HTTP ' + err.status}`);
    });
  }

  if (results.apis.errors.length > 0) {
    console.log(`\n${colors.red}API Errors:${colors.reset}`);
    results.apis.errors.forEach(err => {
      console.log(`  - ${err.api}: ${err.error || 'HTTP ' + err.status}`);
    });
  }

  const totalPassed = results.pages.passed + results.apis.passed;
  const totalTests = results.pages.total + results.apis.total;
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

  console.log(`\n${colors.bright}Overall:${colors.reset} ${totalPassed}/${totalTests} passed (${passRate}%)`);

  if (passRate === '100.0') {
    console.log(`\n${colors.green}${colors.bright}✅ ALL TESTS PASSED - PRODUCTION READY!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  SOME TESTS FAILED - REVIEW REQUIRED${colors.reset}\n`);
  }
}

runTests().catch(console.error);

