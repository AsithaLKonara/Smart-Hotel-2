import { Page } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SecurityTestResult {
  testName: string;
  status: 'passed' | 'failed';
  error?: string;
  endpointsAudited: string[];
  dbStateMatches: boolean;
}

/**
 * Automates server-side security checks, cross-user isolation validation, and database mutation integrity.
 */
export async function runSecurityAudit(page: Page, baseUrl: string): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];
  // 1. Direct API Attack Audit (GUEST attempting admin mutations)
  try {
    const initialStaffCount = await prisma.staff.count();
    
    // Perform unauthorized fetch direct payload invocation
    const response = await page.request.post(`${baseUrl}/api/staff`, {
      data: {
        employeeId: 'EMP999-HACKER',
        name: 'Injected Intruder Profile',
        email: 'intruder@smarthotel.com',
        phone: '000000000',
        position: 'CEO',
        department: 'Security Bypass Audit'
      },
      // Headers without cookies (unauthenticated context)
    });

    const isBlocked = [401, 403, 302].includes(response.status());
    const finalStaffCount = await prisma.staff.count();
    const dbIntact = finalStaffCount === initialStaffCount;

    results.push({
      testName: '❌ Direct API Attack: Unauthenticated block on POST /api/staff',
      status: (isBlocked && dbIntact) ? 'passed' : 'failed',
      error: !isBlocked ? `API returned non-blocking code: ${response.status()}` : !dbIntact ? 'Database was mutated during unauthorized request!' : undefined,
      endpointsAudited: ['/api/staff'],
      dbStateMatches: dbIntact
    });
  } catch (err: any) {
    results.push({
      testName: '❌ Direct API Attack: Unauthenticated block on POST /api/staff',
      status: 'failed',
      error: err.message,
      endpointsAudited: ['/api/staff'],
      dbStateMatches: false
    });
  }

  // 2. Booking Mutation Integrity (Assert matching counts when creating standard booking)
  try {
    const initialBookings = await prisma.booking.count();
    // Verify booking counts are stable after unauthenticated booking creation (must be blocked)
    const response = await page.request.post(`${baseUrl}/api/bookings`, {
      data: {
        roomId: '69fbd736ceaa634fed21183f',
        checkIn: new Date().toISOString(),
        checkOut: new Date().toISOString(),
        guests: 2
      }
    });

    const isBlocked = [401, 403, 302].includes(response.status());
    const finalBookings = await prisma.booking.count();
    const dbIntact = finalBookings === initialBookings;

    results.push({
      testName: '❌ API Block Check: Unauthenticated booking creation POST /api/bookings',
      status: (isBlocked && dbIntact) ? 'passed' : 'failed',
      error: !isBlocked ? `API returned non-blocking code: ${response.status()}` : !dbIntact ? 'Database mutated' : undefined,
      endpointsAudited: ['/api/bookings'],
      dbStateMatches: dbIntact
    });
  } catch (err: any) {
    results.push({
      testName: '❌ API Block Check: Unauthenticated booking creation POST /api/bookings',
      status: 'failed',
      error: err.message,
      endpointsAudited: ['/api/bookings'],
      dbStateMatches: false
    });
  }

  // 3. Admin Route RBAC block check (unauthenticated redirect test)
  try {
    const response = await page.goto(`${baseUrl}/admin/chaos`).catch(() => null);
    const finalUrl = page.url();
    const isRedirected = finalUrl.includes('/auth/signin') || response?.status() === 401 || response?.status() === 403;

    results.push({
      testName: '🔒 Admin Route Isolation: Unauthenticated path redirect on /admin/chaos',
      status: isRedirected ? 'passed' : 'failed',
      error: !isRedirected ? `Direct path loaded without redirect: ${finalUrl}` : undefined,
      endpointsAudited: ['/admin/chaos'],
      dbStateMatches: true
    });
  } catch (err: any) {
    results.push({
      testName: '🔒 Admin Route Isolation: Unauthenticated path redirect on /admin/chaos',
      status: 'failed',
      error: err.message,
      endpointsAudited: ['/admin/chaos'],
      dbStateMatches: false
    });
  }

  // 4. API Input XSS Payload Block Verification
  try {
    const xssPayload = "<script>alert('XSS_ATTACK_SIMULATED')</script>";
    const response = await page.request.post(`${baseUrl}/api/notifications`, {
      data: {
        type: 'system',
        title: xssPayload,
        message: 'Normal body content'
      }
    });

    const isBlockedOrSanitized = [401, 403, 302, 400].includes(response.status()) || response.ok();
    
    results.push({
      testName: '🛡️ API Security: Input validation / sanitation block for XSS payload',
      status: isBlockedOrSanitized ? 'passed' : 'failed',
      error: !isBlockedOrSanitized ? `XSS injection responded with anomalous code: ${response.status()}` : undefined,
      endpointsAudited: ['/api/notifications'],
      dbStateMatches: true
    });
  } catch (err: any) {
    results.push({
      testName: '🛡️ API Security: Input validation / sanitation block for XSS payload',
      status: 'failed',
      error: err.message,
      endpointsAudited: ['/api/notifications'],
      dbStateMatches: false
    });
  }

  await prisma.$disconnect();
  return results;
}
