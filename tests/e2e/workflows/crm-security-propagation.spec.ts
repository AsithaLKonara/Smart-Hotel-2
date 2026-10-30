import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Global VIP & Security Blacklist Propagation (Feature 4.2)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters when updating security flags', async ({ request }) => {
    const res = await request.post('/api/crm/security-alerts', {
      headers: CSRF_HEADERS,
      data: {}
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Propagates blacklist flag chain-wide and intercepts check-in at sister properties', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    const guestEmail = `security-test-${Date.now()}@fraudster.test`;

    // 1. Create a guest user
    const guest = await prisma.user.create({
      data: {
        name: 'Victor Vance',
        email: guestEmail,
        phone: '+1 555 999 8888',
        password: crypto.randomBytes(16).toString('hex'),
        propertyId: propA!.id
      }
    });

    try {
      // 2. Flag guest as blacklisted at Property A (CCH)
      const flagRes = await request.post('/api/crm/security-alerts', {
        headers: CSRF_HEADERS,
        data: {
          action: 'FLAG',
          userId: guest.id,
          blacklistStatus: true,
          blacklistReason: 'Severe property damage in room 402 and fraudulent card chargeback',
          flaggedByPropertyId: propA!.id,
          incidentReference: 'INCIDENT-2026-99'
        }
      });
      expect(flagRes.status()).toBe(200);

      // 3. Guest attempts reservation/check-in at Sister Property B (GOR)
      const checkRes = await request.get(
        `/api/crm/security-alerts?email=${encodeURIComponent(guestEmail)}&propertyId=${propB!.id}`
      );
      expect(checkRes.status()).toBe(200);

      const checkData = await checkRes.json();
      expect(checkData.success).toBe(true);
      expect(checkData.clearance.isCleared).toBe(false);
      expect(checkData.clearance.securityAlert.level).toBe('CRITICAL_BLOCK');
      expect(checkData.clearance.securityAlert.message).toContain('CHAIN-WIDE SECURITY INTERCEPT');
      expect(checkData.clearance.securityAlert.message).toContain('CCH');

      // 4. Test VIP Chain-Wide Recognition
      const vipRes = await request.post('/api/crm/security-alerts', {
        headers: CSRF_HEADERS,
        data: {
          action: 'FLAG',
          userId: guest.id,
          blacklistStatus: false,
          vipStatus: 'VIP',
          flaggedByPropertyId: propA!.id
        }
      });
      expect(vipRes.status()).toBe(200);

      // Verify VIP recognition at Sister Property B
      const vipCheckRes = await request.get(
        `/api/crm/security-alerts?email=${encodeURIComponent(guestEmail)}&propertyId=${propB!.id}`
      );
      expect(vipCheckRes.status()).toBe(200);

      const vipCheckData = await vipCheckRes.json();
      expect(vipCheckData.clearance.isCleared).toBe(true);
      expect(vipCheckData.clearance.securityAlert.level).toBe('VIP_CONCIERGE');
      expect(vipCheckData.clearance.securityAlert.message).toContain('GLOBAL VIP GUEST');
    } finally {
      // Clean up audit logs and user
      await prisma.auditLog.deleteMany({
        where: { action: { in: ['GUEST_CHAIN_BLACKLISTED', 'GUEST_VIP_UPDATED', 'GUEST_BLACKLIST_PARDONED'] } }
      });
      await prisma.user.delete({
        where: { id: guest.id }
      });
    }
  });
});
