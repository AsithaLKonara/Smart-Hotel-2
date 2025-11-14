#!/usr/bin/env node

/**
 * Comprehensive Page Testing Script
 * Tests all pages in SmartHotel Demo application
 */

const BASE_URL = process.env.BASE_URL || 'https://smarthotel-demo.vercel.app';

const pages = [
  // Public Pages
  { path: '/', name: 'Homepage', category: 'Public' },
  { path: '/rooms', name: 'Rooms Listing', category: 'Public' },
  { path: '/rooms/[id]', name: 'Room Details', category: 'Public', dynamic: true },
  { path: '/booking', name: 'Booking', category: 'Public' },
  { path: '/booking-flow', name: 'Booking Flow', category: 'Public' },
  { path: '/order', name: 'Restaurant Menu', category: 'Public' },
  { path: '/order/tracking/[id]', name: 'Order Tracking', category: 'Public', dynamic: true },
  { path: '/gallery', name: 'Gallery', category: 'Public' },
  { path: '/contact', name: 'Contact', category: 'Public' },
  { path: '/about', name: 'About', category: 'Public' },
  { path: '/facilities', name: 'Facilities', category: 'Public' },
  { path: '/privacy', name: 'Privacy Policy', category: 'Legal' },
  { path: '/terms', name: 'Terms of Service', category: 'Legal' },
  { path: '/cookies', name: 'Cookie Policy', category: 'Legal' },
  
  // Auth Pages
  { path: '/auth/signin', name: 'Sign In', category: 'Auth' },
  { path: '/auth/signup', name: 'Sign Up', category: 'Auth' },
  { path: '/auth/forgot-password', name: 'Forgot Password', category: 'Auth' },
  { path: '/auth/reset-password', name: 'Reset Password', category: 'Auth' },
  
  // Guest Pages
  { path: '/my-bookings', name: 'My Bookings', category: 'Guest', requiresAuth: true },
  
  // Dashboard Pages
  { path: '/dashboard', name: 'Dashboard', category: 'Dashboard', requiresAuth: true },
  { path: '/dashboard/bookings', name: 'Dashboard Bookings', category: 'Dashboard', requiresAuth: true },
  { path: '/dashboard/orders', name: 'Dashboard Orders', category: 'Dashboard', requiresAuth: true },
  { path: '/dashboard/revenue', name: 'Dashboard Revenue', category: 'Dashboard', requiresAuth: true },
  { path: '/dashboard/tasks', name: 'Dashboard Tasks', category: 'Dashboard', requiresAuth: true },
  
  // Kitchen Pages
  { path: '/kitchen/dashboard', name: 'Kitchen Dashboard', category: 'Kitchen', requiresAuth: true },
  
  // Admin Pages
  { path: '/admin', name: 'Admin Dashboard', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/dashboard', name: 'Admin Dashboard Main', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/rooms', name: 'Admin Rooms', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/bookings', name: 'Admin Bookings', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/calendar', name: 'Admin Calendar', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/dashboard/checkin-checkout', name: 'Check-In/Check-Out', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/staff', name: 'Admin Staff', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN'] },
  { path: '/admin/tasks', name: 'Admin Tasks', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/menu', name: 'Admin Menu', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN'] },
  { path: '/admin/orders', name: 'Admin Orders', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/inventory', name: 'Admin Inventory', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN'] },
  { path: '/admin/gallery', name: 'Admin Gallery', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN'] },
  { path: '/admin/qr-codes', name: 'QR Codes', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'] },
  { path: '/admin/analytics', name: 'Admin Analytics', category: 'Admin', requiresAuth: true, requiresRole: ['MANAGER', 'SUPER_ADMIN'] },
];

async function testPage(page) {
  const url = page.dynamic 
    ? `${BASE_URL}${page.path.replace('/[id]', '/test-id')}` 
    : `${BASE_URL}${page.path}`;
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const status = response.status;
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    const isJson = contentType.includes('application/json');
    const isRedirect = status >= 300 && status < 400;
    const isError = status >= 400;
    
    let content = '';
    let hasErrorBoundary = false;
    let hasSignInButton = false;
    let hasNavigation = false;
    
    if (isHtml) {
      content = await response.text();
      hasErrorBoundary = content.includes('Something went wrong') || content.includes('error-boundary');
      hasSignInButton = content.includes('/auth/signin') || content.includes('Sign In') || content.includes('Sign in');
      hasNavigation = content.includes('Primary navigation') || content.includes('nav');
    }
    
    return {
      ...page,
      url,
      status,
      responseTime,
      isHtml,
      isJson,
      isRedirect,
      isError,
      hasErrorBoundary,
      hasSignInButton,
      hasNavigation,
      success: !hasErrorBoundary && (status < 400 || isRedirect),
      error: hasErrorBoundary ? 'Error boundary triggered' : isError ? `HTTP ${status}` : null,
    };
  } catch (error) {
    return {
      ...page,
      url,
      status: 0,
      responseTime: 0,
      success: false,
      error: error.message,
      hasErrorBoundary: false,
      hasSignInButton: false,
      hasNavigation: false,
    };
  }
}

async function testAllPages() {
  console.log('🧪 Comprehensive Page Testing - SmartHotel Demo\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log(`Testing ${pages.length} pages...\n`);
  
  const results = [];
  const categories = {};
  
  for (const page of pages) {
    process.stdout.write(`Testing ${page.path}... `);
    const result = await testPage(page);
    results.push(result);
    
    // Categorize results
    if (!categories[result.category]) {
      categories[result.category] = { total: 0, passed: 0, failed: 0, errors: [] };
    }
    categories[result.category].total++;
    
    if (result.success) {
      categories[result.category].passed++;
      console.log('✅');
    } else {
      categories[result.category].failed++;
      categories[result.category].errors.push({
        path: result.path,
        error: result.error,
        status: result.status,
      });
      console.log(`❌ ${result.error || `HTTP ${result.status}`}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY\n');
  
  // Category breakdown
  for (const [category, stats] of Object.entries(categories)) {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Passed: ${stats.passed} ✅`);
    console.log(`  Failed: ${stats.failed} ❌`);
    console.log(`  Pass Rate: ${passRate}%`);
    if (stats.errors.length > 0) {
      console.log(`  Errors:`);
      stats.errors.forEach(err => {
        console.log(`    - ${err.path}: ${err.error} (${err.status})`);
      });
    }
    console.log('');
  }
  
  // Overall stats
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  console.log('='.repeat(80));
  console.log('OVERALL STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total Pages: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('');
  
  // Navigation analysis
  const pagesWithSignIn = results.filter(r => r.hasSignInButton).length;
  const pagesWithNavigation = results.filter(r => r.hasNavigation).length;
  console.log('Navigation Analysis:');
  console.log(`  Pages with Sign In button: ${pagesWithSignIn}/${total}`);
  console.log(`  Pages with navigation: ${pagesWithNavigation}/${total}`);
  console.log('');
  
  // Error analysis
  const errorPages = results.filter(r => r.hasErrorBoundary);
  if (errorPages.length > 0) {
    console.log('⚠️  Pages with Error Boundary:');
    errorPages.forEach(page => {
      console.log(`  - ${page.path} (${page.name})`);
    });
    console.log('');
  }
  
  // Response time analysis
  const avgResponseTime = results
    .filter(r => r.responseTime > 0)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime > 0).length;
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log('');
  
  // Detailed results
  console.log('='.repeat(80));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(80));
  console.log(JSON.stringify(results, null, 2));
  
  // Save to file
  const fs = require('fs');
  const reportPath = 'COMPREHENSIVE_PAGE_TEST_RESULTS.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total,
      passed,
      failed,
      passRate: `${passRate}%`,
    },
    categories,
    results,
  }, null, 2));
  
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  
  return {
    total,
    passed,
    failed,
    passRate: `${passRate}%`,
    categories,
    results,
  };
}

// Run tests
testAllPages()
  .then((results) => {
    console.log('\n✅ Testing complete!');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
  });

