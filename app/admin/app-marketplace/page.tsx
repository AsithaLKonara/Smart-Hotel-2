import React from 'react';
import { PrismaClient } from '@prisma/client';
import ClientMarketplace, { MarketplaceApp, PartnerVendor } from './ClientMarketplace';

const prisma = new PrismaClient();

const APPS_CATALOG: MarketplaceApp[] = [
  { id: "app-ota", title: "Global OTA Sync Engine", category: "INTEGRATION", description: "Real-time room availability sync with Booking.com, Expedia, and Agoda.", rating: 4.9, installed: false, cost: "1.5% commission" },
  { id: "app-ai-clean", title: "AI Cleaning Slicer", category: "AI_MODULE", description: "Dynamic staffing assigner prioritizing high-turnover rooms during peak arrivals.", rating: 4.8, installed: false, cost: "$49/mo" },
  { id: "app-vat", title: "Regional VAT Tax Complier", category: "FINANCIAL", description: "Automated municipal tourist tax and local tax filings for 120+ jurisdictions.", rating: 4.7, installed: false, cost: "$29/mo" },
  { id: "app-loyalty", title: "Loyalty Blast Campaigner", category: "MARKETING", description: "Target guest preferences with personalized promotional packages.", rating: 4.5, installed: false, cost: "$19/mo" }
];

const VENDORS_CATALOG: PartnerVendor[] = [
  { id: "vend-laund", companyName: "Zenith Linen Services", serviceType: "Laundry & Linen", slaMetric: 99.4, status: "SUSPENDED", lastPayout: 4200 },
  { id: "vend-clean", companyName: "Apex SRE Cleaners", serviceType: "Specialized Deep Cleaning", slaMetric: 98.2, status: "SUSPENDED", lastPayout: 2150 },
  { id: "vend-food", companyName: "Noonu Catering Corp", serviceType: "Kitchen & In-room Dining Support", slaMetric: 95.1, status: "REVIEW", lastPayout: 8900 }
];

export default async function MarketplacePage() {
  // Fetch real database state
  const dbIntegrations = await prisma.integration.findMany({
    select: { id: true, appName: true, status: true } // EXCLUDE secrets like apiKey or config
  });

  const dbVendors = await prisma.vendor.findMany({
    select: { id: true, name: true, isActive: true }
  });

  // Merge DB state with Catalog metadata
  const mappedApps = APPS_CATALOG.map(app => {
    const dbIntegration = dbIntegrations.find(db => db.appName === app.id);
    return {
      ...app,
      installed: dbIntegration ? dbIntegration.status === 'ACTIVE' : false,
    };
  });

  const mappedVendors = VENDORS_CATALOG.map(vend => {
    const dbVendor = dbVendors.find(db => db.name === vend.companyName);
    return {
      ...vend,
      status: dbVendor ? (dbVendor.isActive ? 'ACTIVE' : 'SUSPENDED') : vend.status,
    };
  });

  return (
    <ClientMarketplace initialApps={mappedApps} initialVendors={mappedVendors} />
  );
}
