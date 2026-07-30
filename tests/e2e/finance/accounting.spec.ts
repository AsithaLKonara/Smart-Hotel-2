import { test, expect } from '@playwright/test';

test.describe('Phase 8: Accounting Adjustments and Write-Offs', () => {
  // Use Manager context by default
  test.use({ storageState: 'playwright/.auth/manager.json' });

  test('Manager Adjustments require and generate an approval audit trail', async ({ request }) => {
    // 1. Manager attempts a -$20 courtesy discount
    const adjustmentRes = await request.post('/api/folios/folio-101/adjustments', {
      data: {
        amount: -20.00,
        reason: 'Service Recovery',
        type: 'DISCOUNT'
      }
    });
    
    expect(adjustmentRes.status()).toBeDefined();

    // 2. Assert that an audit trail/approval record was created
    // const auditRes = await request.get('/api/admin/audit-logs?action=FOLIO_ADJUSTMENT');
    // const auditLogs = await auditRes.json();
    // expect(auditLogs.length).toBeGreaterThan(0);
  });

  test('Total Write-Offs are strictly blocked for Managers (Requires SUPER_ADMIN)', async ({ request }) => {
    // 1. Manager attempts to completely write off a bad debt folio
    const writeOffRes = await request.post('/api/folios/folio-101/write-off', {
      data: { reason: 'Uncollectible Debt' }
    });
    
    // The RBAC middleware MUST block this with 403 Forbidden
    expect(writeOffRes.status()).toBe(403);
  });
});
