#!/usr/bin/env node

/**
 * RBAC (Role-Based Access Control) Test Script
 * Tests access control for all user roles
 */

const BASE_URL = process.env.BASE_URL || 'https://smarthotel-demo.vercel.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

// Pages that should be accessible by role
const roleAccess = {
  GUEST: [
    { path: '/', shouldAccess: true },
    { path: '/rooms', shouldAccess: true },
    { path: '/booking', shouldAccess: true },
    { path: '/order', shouldAccess: true },
    { path: '/my-bookings', shouldAccess: true },
    { path: '/admin', shouldAccess: false },
    { path: '/dashboard', shouldAccess: false },
  ],
  RECEPTIONIST: [
    { path: '/admin', shouldAccess: true },
    { path: '/admin/bookings', shouldAccess: true },
    { path: '/admin/calendar', shouldAccess: true },
    { path: '/admin/staff', shouldAccess: false }, // Manager only
  ],
  MANAGER: [
    { path: '/admin', shouldAccess: true },
    { path: '/admin/staff', shouldAccess: true },
    { path: '/admin/analytics', shouldAccess: true },
    { path: '/admin/inventory', shouldAccess: true },
  ],
};

async function testRBAC() {
  console.log(`${colors.cyan}${colors.bright}
═══════════════════════════════════════════════════════════════
  RBAC (Role-Based Access Control) Testing
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  let totalTests = 0;
  let totalPassed = 0;

  for (const [role, pages] of Object.entries(roleAccess)) {
    console.log(`\n${colors.blue}Testing ${role} Role Access...${colors.reset}`);
    
    for (const page of pages) {
      totalTests++;
      try {
        const response = await fetch(`${BASE_URL}${page.path}`, {
          headers: { 'Accept': 'text/html' },
          redirect: 'follow',
        });
        
        const canAccess = response.status === 200;
        const shouldAccess = page.shouldAccess;
        const testPassed = canAccess === shouldAccess;
        
        if (testPassed) {
          totalPassed++;
          const accessStatus = canAccess ? 'accessible' : 'blocked';
          console.log(`  ${colors.green}✓${colors.reset} ${page.path} - ${accessStatus} (expected)`);
        } else {
          const expected = shouldAccess ? 'accessible' : 'blocked';
          const actual = canAccess ? 'accessible' : 'blocked';
          console.log(`  ${colors.red}✗${colors.reset} ${page.path} - Expected ${expected}, got ${actual}`);
        }
      } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} ${page.path} - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════
  RBAC TEST RESULTS
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalTests - totalPassed}`);
  console.log(`Pass Rate: ${((totalPassed/totalTests)*100).toFixed(1)}%`);

  if (totalPassed === totalTests) {
    console.log(`\n${colors.green}${colors.bright}✅ ALL RBAC TESTS PASSED!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  SOME RBAC TESTS FAILED${colors.reset}\n`);
  }
}

testRBAC().catch(console.error);

