import React from 'react';
import prisma from '@/lib/prisma';
import ClientMarketplace, { MarketplaceApp, PartnerVendor } from './ClientMarketplace';

export default async function MarketplacePage() {
  // Fetch real database state
  const dbIntegrations = await prisma.integration.findMany({
    select: { id: true, appName: true, status: true, config: true } 
  });

  const dbVendors = await prisma.vendor.findMany({
    select: { id: true, name: true, isActive: true }
  });

  // Map DB state to UI props
  const mappedApps: MarketplaceApp[] = dbIntegrations.map(intg => {
    const config = intg.config as any || {};
    return {
      id: intg.appName, // We use appName as the ID for the UI
      title: intg.appName,
      category: config.category || 'INTEGRATION',
      description: config.description || '',
      rating: 4.8, // Static rating for now
      installed: intg.status === 'ACTIVE',
      cost: config.cost || 'Free'
    };
  });

  const mappedVendors: PartnerVendor[] = dbVendors.map(vend => {
    return {
      id: vend.id,
      companyName: vend.name,
      serviceType: 'Service Partner',
      slaMetric: 99.0, // Static for now
      status: vend.isActive ? 'ACTIVE' : 'SUSPENDED',
      lastPayout: 0
    };
  });

  return (
    <ClientMarketplace initialApps={mappedApps} initialVendors={mappedVendors} />
  );
}
