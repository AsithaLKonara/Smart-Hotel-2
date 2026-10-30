import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Hierarchical Role Scoping and Cluster RBAC (Feature 7.1)', () => {
  test.setTimeout(90000);

  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required cluster creation parameters', async ({ request }) => {
    const res = await request.post('/api/admin/clusters', {
      headers: CSRF_HEADERS,
      data: {
        action: 'CREATE_CLUSTER',
        name: 'Incomplete Cluster'
      }
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Enforces hierarchical cluster boundaries: allows assigned cluster properties, blocks outside properties', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    // 1. Create a third property (Property C) that belongs outside the cluster
    const propC = await prisma.property.create({
      data: {
        name: 'Capital City Suites',
        code: `CCS-${Date.now().toString().slice(-4)}`,
        address: '100 Parliament Road, Colombo',
        city: 'Colombo',
        country: 'Sri Lanka',
        phone: '+94 11 555 4444',
        email: `ccs-${Date.now()}@testchain.com`,
        status: 'ACTIVE'
      }
    });

    // 2. Create a regional user (Sarah Jenkins)
    const regionalEmail = `regional-dir-${Date.now()}@hotelchain.test`;
    const regionalUser = await prisma.user.create({
      data: {
        name: 'Sarah Jenkins',
        email: regionalEmail,
        password: crypto.randomBytes(16).toString('hex'),
        propertyId: propA!.id
      }
    });

    let clusterRecordId: string | null = null;
    let assignmentRecordId: string | null = null;

    try {
      // 3. Define Cluster "South Coast Cluster" with only [Property A, Property B]
      const clusterCode = `SCC-${Date.now().toString().slice(-4)}`;
      const createClusterRes = await request.post('/api/admin/clusters', {
        headers: CSRF_HEADERS,
        data: {
          action: 'CREATE_CLUSTER',
          name: 'South Coast Cluster',
          code: clusterCode,
          region: 'Southern Province',
          description: 'Luxury beachfront and heritage properties',
          propertyIds: [propA!.id, propB!.id]
        }
      });
      expect(createClusterRes.status()).toBe(200);
      const clusterData = await createClusterRes.json();
      expect(clusterData.success).toBe(true);
      const clusterId = clusterData.cluster.clusterId;
      clusterRecordId = clusterData.cluster.id;

      // 4. Assign Sarah Jenkins as REGIONAL_DIRECTOR for South Coast Cluster
      const assignRes = await request.post('/api/admin/clusters', {
        headers: CSRF_HEADERS,
        data: {
          action: 'ASSIGN_USER',
          userId: regionalUser.id,
          clusterId,
          clusterRole: 'REGIONAL_DIRECTOR'
        }
      });
      expect(assignRes.status()).toBe(200);
      const assignData = await assignRes.json();
      assignmentRecordId = assignData.assignment.id;

      // 5. Query Sarah Jenkins's cluster scope
      const scopeRes = await request.get(`/api/admin/clusters?type=user-scope&userId=${regionalUser.id}`);
      expect(scopeRes.status()).toBe(200);
      const scopeData = await scopeRes.json();
      expect(scopeData.success).toBe(true);

      const scope = scopeData.scope;
      expect(scope.isGlobal).toBe(false);
      expect(scope.clusterRole).toBe('REGIONAL_DIRECTOR');
      expect(scope.authorizedPropertyIds).toContain(propA!.id);
      expect(scope.authorizedPropertyIds).toContain(propB!.id);
      expect(scope.authorizedPropertyIds).not.toContain(propC.id);

      // 6. Access Verification:
      // Property A (Inside cluster) -> Should be APPROVED
      const verifyPropARes = await request.get(
        `/api/admin/clusters?type=verify&userId=${regionalUser.id}&propertyId=${propA!.id}`
      );
      expect(verifyPropARes.status()).toBe(200);
      const verifyAData = await verifyPropARes.json();
      expect(verifyAData.authorized).toBe(true);

      // Property B (Inside cluster) -> Should be APPROVED
      const verifyPropBRes = await request.get(
        `/api/admin/clusters?type=verify&userId=${regionalUser.id}&propertyId=${propB!.id}`
      );
      expect(verifyPropBRes.status()).toBe(200);
      const verifyBData = await verifyPropBRes.json();
      expect(verifyBData.authorized).toBe(true);

      // Property C (Outside cluster) -> Must be FORBIDDEN (403)
      const verifyPropCRes = await request.get(
        `/api/admin/clusters?type=verify&userId=${regionalUser.id}&propertyId=${propC.id}`
      );
      expect(verifyPropCRes.status()).toBe(403);
      const verifyCData = await verifyPropCRes.json();
      expect(verifyCData.authorized).toBe(false);
      expect(verifyCData.error).toContain('not authorized to access Property ID');
    } finally {
      if (assignmentRecordId) {
        await prisma.auditLog.delete({ where: { id: assignmentRecordId } }).catch(() => {});
      }
      if (clusterRecordId) {
        await prisma.auditLog.delete({ where: { id: clusterRecordId } }).catch(() => {});
      }
      await prisma.user.delete({ where: { id: regionalUser.id } }).catch(() => {});
      await prisma.property.delete({ where: { id: propC.id } }).catch(() => {});
    }
  });
});
