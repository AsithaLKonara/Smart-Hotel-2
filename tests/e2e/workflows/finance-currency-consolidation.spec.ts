import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Multi-Currency Consolidation to HQ Reporting Currency (Feature 3.2)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Retrieves active daily FX rate matrix and updates conversion rates', async ({ request }) => {
    // 1. Get rates
    const getRes = await request.get('/api/admin/accounting/fx-rates');
    expect(getRes.status()).toBe(200);

    const getData = await getRes.json();
    expect(getData.success).toBe(true);
    expect(getData.baseCurrency).toBe('USD');
    expect(getData.fxRates.USD).toBe(1.0);
    expect(getData.fxRates.EUR).toBeDefined();
    expect(getData.fxRates.LKR).toBeDefined();

    // 2. Update EUR rate
    const updateRes = await request.post('/api/admin/accounting/fx-rates', {
      headers: CSRF_HEADERS,
      data: {
        currency: 'EUR',
        rateToUsd: 0.95
      }
    });
    expect(updateRes.status()).toBe(200);

    const updateData = await updateRes.json();
    expect(updateData.success).toBe(true);
    expect(updateData.updatedRate.currency).toBe('EUR');
    expect(updateData.updatedRate.rateToUsd).toBe(0.95);
  });

  test('2. Generates multi-property consolidated P&L, RevPAR, and ADR in HQ reporting currency', async ({ request }) => {
    const res = await request.get(
      '/api/admin/accounting/consolidated-pl?startDate=2026-01-01&endDate=2026-12-31&hqCurrency=USD'
    );
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    const report = data.report;
    expect(report.hqReportingCurrency).toBe('USD');
    expect(report.totalChainProperties).toBeGreaterThanOrEqual(3);
    expect(report.totalChainRooms).toBeGreaterThan(0);

    // Consolidated Portfolio KPIs
    const metrics = report.consolidatedMetrics;
    expect(typeof metrics.totalGroupRevenue).toBe('number');
    expect(typeof metrics.portfolioOccupancyRate).toBe('number');
    expect(typeof metrics.portfolioAdr).toBe('number');
    expect(typeof metrics.portfolioRevPar).toBe('number');

    // Property Level breakdowns
    expect(Array.isArray(report.propertyBreakdowns)).toBe(true);
    expect(report.propertyBreakdowns.length).toBeGreaterThanOrEqual(3);

    for (const prop of report.propertyBreakdowns) {
      expect(prop.propertyId).toBeDefined();
      expect(prop.propertyName).toBeDefined();
      expect(prop.localCurrency).toBeDefined();
      expect(typeof prop.localRevenue.totalRevenue).toBe('number');
      expect(typeof prop.hqRevenue.totalRevenue).toBe('number');
      expect(typeof prop.metrics.contributionPercentage).toBe('number');
    }

    // Verify sort order: highest revenue property first
    if (report.propertyBreakdowns.length >= 2) {
      expect(report.propertyBreakdowns[0].hqRevenue.totalRevenue).toBeGreaterThanOrEqual(
        report.propertyBreakdowns[1].hqRevenue.totalRevenue
      );
    }
  });
});
