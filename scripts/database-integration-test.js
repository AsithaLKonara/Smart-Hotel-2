#!/usr/bin/env node

/**
 * Database Integration Test Script
 * Tests all database connections, queries, and operations
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

const dbTests = {
  connections: { passed: 0, failed: 0, tests: [] },
  queries: { passed: 0, failed: 0, tests: [] },
  operations: { passed: 0, failed: 0, tests: [] },
};

// Test database connections via API endpoints
async function testDatabaseConnections() {
  console.log(`${colors.blue}Testing Database Connections...${colors.reset}`);
  
  const connectionTests = [
    { path: '/api/test-db', name: 'Database Connection Test' },
    { path: '/api/test-db-comprehensive', name: 'Comprehensive DB Test' },
    { path: '/api/health/ready', name: 'Health Ready (DB Check)' },
  ];

  for (const test of connectionTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`);
      const data = await response.json();
      
      if (response.status === 200 && (data.success || data.status === 'ok' || data.message)) {
        dbTests.connections.passed++;
        dbTests.connections.tests.push({ test: test.name, status: 'PASS' });
        console.log(`  ${colors.green}✓${colors.reset} ${test.name} - Connected`);
      } else {
        dbTests.connections.failed++;
        dbTests.connections.tests.push({ test: test.name, status: 'FAIL', reason: `Status ${response.status}` });
        console.log(`  ${colors.red}✗${colors.reset} ${test.name} - Failed`);
      }
    } catch (error) {
      dbTests.connections.failed++;
      dbTests.connections.tests.push({ test: test.name, status: 'FAIL', reason: error.message });
      console.log(`  ${colors.red}✗${colors.reset} ${test.name} - ${error.message}`);
    }
  }
}

// Test database queries via API endpoints
async function testDatabaseQueries() {
  console.log(`\n${colors.blue}Testing Database Queries...${colors.reset}`);
  
  const queryTests = [
    { path: '/api/rooms', name: 'Rooms Query', expectedField: 'length' },
    { path: '/api/restaurant/menu', name: 'Menu Query', expectedField: 'length' },
    { path: '/api/settings/contact', name: 'Settings Query', expectedField: 'name' },
  ];

  for (const test of queryTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`);
      const data = await response.json();
      
      if (response.status === 200) {
        // Check if data is array or object with expected field
        const hasData = Array.isArray(data) ? data.length > 0 : data[test.expectedField] !== undefined;
        
        if (hasData) {
          dbTests.queries.passed++;
          dbTests.queries.tests.push({ test: test.name, status: 'PASS' });
          const count = Array.isArray(data) ? data.length : 'Object';
          console.log(`  ${colors.green}✓${colors.reset} ${test.name} - Data retrieved (${count})`);
        } else {
          dbTests.queries.failed++;
          dbTests.queries.tests.push({ test: test.name, status: 'FAIL', reason: 'No data returned' });
          console.log(`  ${colors.red}✗${colors.reset} ${test.name} - No data`);
        }
      } else {
        dbTests.queries.failed++;
        dbTests.queries.tests.push({ test: test.name, status: 'FAIL', reason: `HTTP ${response.status}` });
        console.log(`  ${colors.red}✗${colors.reset} ${test.name} - HTTP ${response.status}`);
      }
    } catch (error) {
      dbTests.queries.failed++;
      dbTests.queries.tests.push({ test: test.name, status: 'FAIL', reason: error.message });
      console.log(`  ${colors.red}✗${colors.reset} ${test.name} - ${error.message}`);
    }
  }
}

// Test database operations (CRUD)
async function testDatabaseOperations() {
  console.log(`\n${colors.blue}Testing Database Operations...${colors.reset}`);
  
  const operationTests = [
    { 
      path: '/api/contact', 
      method: 'POST', 
      name: 'Create Contact', 
      body: { name: 'Test User', email: 'test@example.com', message: 'Test message' }
    },
  ];

  for (const test of operationTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`, {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body),
      });
      
      const data = await response.json();
      
      if (response.status === 201 || (response.status === 200 && data.success)) {
        dbTests.operations.passed++;
        dbTests.operations.tests.push({ test: test.name, status: 'PASS' });
        console.log(`  ${colors.green}✓${colors.reset} ${test.name} - Operation successful`);
      } else {
        dbTests.operations.failed++;
        dbTests.operations.tests.push({ test: test.name, status: 'FAIL', reason: `Status ${response.status}` });
        console.log(`  ${colors.red}✗${colors.reset} ${test.name} - Failed`);
      }
    } catch (error) {
      dbTests.operations.failed++;
      dbTests.operations.tests.push({ test: test.name, status: 'FAIL', reason: error.message });
      console.log(`  ${colors.red}✗${colors.reset} ${test.name} - ${error.message}`);
    }
  }
}

async function runDatabaseTests() {
  console.log(`${colors.cyan}${colors.bright}
═══════════════════════════════════════════════════════════════
  Database Integration Testing
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  await testDatabaseConnections();
  await testDatabaseQueries();
  await testDatabaseOperations();

  // Print summary
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════
  DATABASE TEST RESULTS
═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const totalPassed = dbTests.connections.passed + dbTests.queries.passed + dbTests.operations.passed;
  const totalTests = (dbTests.connections.passed + dbTests.connections.failed) +
                    (dbTests.queries.passed + dbTests.queries.failed) +
                    (dbTests.operations.passed + dbTests.operations.failed);

  console.log(`Connections: ${dbTests.connections.passed}/${dbTests.connections.passed + dbTests.connections.failed} passed`);
  console.log(`Queries: ${dbTests.queries.passed}/${dbTests.queries.passed + dbTests.queries.failed} passed`);
  console.log(`Operations: ${dbTests.operations.passed}/${dbTests.operations.passed + dbTests.operations.failed} passed`);
  console.log(`\n${colors.bright}Overall:${colors.reset} ${totalPassed}/${totalTests} passed (${((totalPassed/totalTests)*100).toFixed(1)}%)`);

  if (totalPassed === totalTests) {
    console.log(`\n${colors.green}${colors.bright}✅ ALL DATABASE TESTS PASSED!${colors.reset}\n`);
  }
}

runDatabaseTests().catch(console.error);

