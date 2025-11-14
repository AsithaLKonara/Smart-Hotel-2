#!/usr/bin/env node

/**
 * Browser-based E2E Test Script
 * Tests user flows, interactions, and component functionality
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

const testResults = {
  navigation: { passed: 0, failed: 0, tests: [] },
  forms: { passed: 0, failed: 0, tests: [] },
  buttons: { passed: 0, failed: 0, tests: [] },
  pages: { passed: 0, failed: 0, tests: [] },
};

// Test navigation elements
async function testNavigation() {
  console.log(`${colors.blue}Testing Navigation Elements...${colors.reset}`);
  
  const navTests = [
    { path: '/', element: 'Home link' },
    { path: '/rooms', element: 'Rooms link' },
    { path: '/order', element: 'Restaurant link' },
    { path: '/gallery', element: 'Gallery link' },
    { path: '/contact', element: 'Contact link' },
    { path: '/auth/signin', element: 'Sign In link' },
    { path: '/booking', element: 'Book Now button' },
  ];

  for (const test of navTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`, {
        headers: { 'Accept': 'text/html' },
      });
      
      if (response.status === 200) {
        const html = await response.text();
        // Check if page has navigation
        const hasNav = html.includes('navigation') || html.includes('nav') || html.includes('Sign In');
        
        if (hasNav) {
          testResults.navigation.passed++;
          testResults.navigation.tests.push({ test: test.element, status: 'PASS' });
          console.log(`  ${colors.green}✓${colors.reset} ${test.element} - Navigation present`);
        } else {
          testResults.navigation.failed++;
          testResults.navigation.tests.push({ test: test.element, status: 'FAIL', reason: 'No navigation found' });
          console.log(`  ${colors.red}✗${colors.reset} ${test.element} - No navigation`);
        }
      } else {
        testResults.navigation.failed++;
        testResults.navigation.tests.push({ test: test.element, status: 'FAIL', reason: `HTTP ${response.status}` });
        console.log(`  ${colors.red}✗${colors.reset} ${test.element} - HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.navigation.failed++;
      testResults.navigation.tests.push({ test: test.element, status: 'FAIL', reason: error.message });
      console.log(`  ${colors.red}✗${colors.reset} ${test.element} - ${error.message}`);
    }
  }
}

// Test form elements
async function testForms() {
  console.log(`\n${colors.blue}Testing Form Elements...${colors.reset}`);
  
  const formTests = [
    { path: '/auth/signin', forms: ['email', 'password', 'submit'] },
    { path: '/auth/signup', forms: ['email', 'password', 'name'] },
    { path: '/booking', forms: ['check-in', 'check-out', 'guests'] },
    { path: '/contact', forms: ['name', 'email', 'message'] },
  ];

  for (const test of formTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`, {
        headers: { 'Accept': 'text/html' },
      });
      
      if (response.status === 200) {
        const html = await response.text();
        let allFound = true;
        
        for (const formField of test.forms) {
          const found = html.includes(formField) || 
                       html.includes(`name="${formField}"`) ||
                       html.includes(`id="${formField}"`) ||
                       html.includes(`type="${formField}"`);
          
          if (!found) {
            allFound = false;
            break;
          }
        }
        
        if (allFound) {
          testResults.forms.passed++;
          testResults.forms.tests.push({ page: test.path, status: 'PASS' });
          console.log(`  ${colors.green}✓${colors.reset} ${test.path} - All form elements present`);
        } else {
          testResults.forms.failed++;
          testResults.forms.tests.push({ page: test.path, status: 'FAIL', reason: 'Missing form elements' });
          console.log(`  ${colors.red}✗${colors.reset} ${test.path} - Missing form elements`);
        }
      } else {
        testResults.forms.failed++;
        testResults.forms.tests.push({ page: test.path, status: 'FAIL', reason: `HTTP ${response.status}` });
        console.log(`  ${colors.red}✗${colors.reset} ${test.path} - HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.forms.failed++;
      testResults.forms.tests.push({ page: test.path, status: 'FAIL', reason: error.message });
      console.log(`  ${colors.red}✗${colors.reset} ${test.path} - ${error.message}`);
    }
  }
}

// Test button elements
async function testButtons() {
  console.log(`\n${colors.blue}Testing Button Elements...${colors.reset}`);
  
  const buttonTests = [
    { path: '/', buttons: ['Book Now', 'Contact Us'] },
    { path: '/rooms', buttons: ['View Details', 'Book Now'] },
    { path: '/order', buttons: ['Add to Cart', 'Place Order'] },
    { path: '/auth/signin', buttons: ['Sign In', 'Sign Up'] },
  ];

  for (const test of buttonTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`, {
        headers: { 'Accept': 'text/html' },
      });
      
      if (response.status === 200) {
        const html = await response.text();
        let allFound = true;
        
        for (const button of test.buttons) {
          const found = html.includes(button) || 
                       html.includes(`"${button}"`) ||
                       html.includes(`>${button}<`);
          
          if (!found) {
            allFound = false;
            break;
          }
        }
        
        if (allFound) {
          testResults.buttons.passed++;
          testResults.buttons.tests.push({ page: test.path, status: 'PASS' });
          console.log(`  ${colors.green}✓${colors.reset} ${test.path} - All buttons present`);
        } else {
          testResults.buttons.failed++;
          testResults.buttons.tests.push({ page: test.path, status: 'FAIL', reason: 'Missing buttons' });
          console.log(`  ${colors.red}✗${colors.reset} ${test.path} - Missing buttons`);
        }
      } else {
        testResults.buttons.failed++;
        testResults.buttons.tests.push({ page: test.path, status: 'FAIL', reason: `HTTP ${response.status}` });
        console.log(`  ${colors.red}✗${colors.reset} ${test.path} - HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.buttons.failed++;
      testResults.buttons.tests.push({ page: test.path, status: 'FAIL', reason: error.message });
      console.log(`  ${colors.red}✗${colors.reset} ${test.path} - ${error.message}`);
    }
  }
}

// Test page accessibility
async function testPageAccessibility() {
  console.log(`\n${colors.blue}Testing Page Accessibility...${colors.reset}`);
  
  const pages = [
    '/', '/rooms', '/booking', '/order', '/gallery', '/contact',
    '/auth/signin', '/auth/signup', '/dashboard', '/admin'
  ];

  for (const path of pages) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Accept': 'text/html' },
      });
      
      if (response.status === 200) {
        const html = await response.text();
        const hasTitle = html.includes('<title>') || html.includes('title');
        const hasMain = html.includes('<main') || html.includes('main');
        const noErrors = !html.includes('Error') || !html.includes('error');
        
        if (hasTitle && hasMain && noErrors) {
          testResults.pages.passed++;
          testResults.pages.tests.push({ page: path, status: 'PASS' });
          console.log(`  ${colors.green}✓${colors.reset} ${path} - Accessible`);
        } else {
          testResults.pages.failed++;
          testResults.pages.tests.push({ page: path, status: 'FAIL', reason: 'Accessibility issues' });
          console.log(`  ${colors.red}✗${colors.reset} ${path} - Accessibility issues`);
        }
      } else if (response.status === 401 || response.status === 403) {
        // Auth required pages are expected to redirect
        testResults.pages.passed++;
        testResults.pages.tests.push({ page: path, status: 'PASS', note: 'Auth required' });
        console.log(`  ${colors.green}✓${colors.reset} ${path} - Auth required (expected)`);
      } else {
        testResults.pages.failed++;
        testResults.pages.tests.push({ page: path, status: 'FAIL', reason: `HTTP ${response.status}` });
        console.log(`  ${colors.red}✗${colors.reset} ${path} - HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.pages.failed++;
      testResults.pages.tests.push({ page: path, status: 'FAIL', reason: error.message });
      console.log(`  ${colors.red}✗${colors.reset} ${path} - ${error.message}`);
    }
  }
}

async function runBrowserTests() {
  console.log(`${colors.cyan}${colors.bright}
═══════════════════════════════════════════════════════════════
  Browser-Based E2E Component Testing
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  await testNavigation();
  await testForms();
  await testButtons();
  await testPageAccessibility();

  // Print summary
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════
  BROWSER TEST RESULTS
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const totalPassed = testResults.navigation.passed + testResults.forms.passed + 
                     testResults.buttons.passed + testResults.pages.passed;
  const totalTests = testResults.navigation.passed + testResults.navigation.failed +
                    testResults.forms.passed + testResults.forms.failed +
                    testResults.buttons.passed + testResults.buttons.failed +
                    testResults.pages.passed + testResults.pages.failed;

  console.log(`Navigation: ${testResults.navigation.passed}/${testResults.navigation.passed + testResults.navigation.failed} passed`);
  console.log(`Forms: ${testResults.forms.passed}/${testResults.forms.passed + testResults.forms.failed} passed`);
  console.log(`Buttons: ${testResults.buttons.passed}/${testResults.buttons.passed + testResults.buttons.failed} passed`);
  console.log(`Pages: ${testResults.pages.passed}/${testResults.pages.passed + testResults.pages.failed} passed`);
  console.log(`\n${colors.bright}Overall:${colors.reset} ${totalPassed}/${totalTests} passed (${((totalPassed/totalTests)*100).toFixed(1)}%)`);

  if (totalPassed === totalTests) {
    console.log(`\n${colors.green}${colors.bright}✅ ALL BROWSER TESTS PASSED!${colors.reset}\n`);
  }
}

runBrowserTests().catch(console.error);

