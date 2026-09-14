const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Marketplace Integrations...');
  
  const integrations = [
    { appName: 'QuickBooks Online', provider: 'QUICKBOOKS', status: 'INACTIVE', config: JSON.stringify({ category: 'FINANCIAL', description: 'Real-time accounting sync.', cost: 'Included' }) },
    { appName: 'Stripe Payments', provider: 'STRIPE', status: 'INACTIVE', config: JSON.stringify({ category: 'FINANCIAL', description: 'Process guest payments securely.', cost: 'Per transaction' }) },
    { appName: 'Assa Abloy Keycards', provider: 'ASSA_ABLOY', status: 'INACTIVE', config: JSON.stringify({ category: 'HARDWARE', description: 'Digital and physical keycard encoding.', cost: 'Hardware dependent' }) },
    { appName: 'Global OTA Sync Engine', provider: 'CHANNEL_MANAGER', status: 'INACTIVE', config: JSON.stringify({ category: 'INTEGRATION', description: 'Real-time room availability sync with Booking.com, Expedia, and Agoda.', cost: '1.5% commission' }) },
    { appName: 'AI Cleaning Slicer', provider: 'AI_MODULE', status: 'INACTIVE', config: JSON.stringify({ category: 'AI_MODULE', description: 'Dynamic staffing assigner prioritizing high-turnover rooms during peak arrivals.', cost: '$49/mo' }) },
    { appName: 'Regional VAT Tax Complier', provider: 'FINANCIAL_COMPLIANCE', status: 'INACTIVE', config: JSON.stringify({ category: 'FINANCIAL', description: 'Automated municipal tourist tax and local tax filings for 120+ jurisdictions.', cost: '$29/mo' }) },
    { appName: 'Loyalty Blast Campaigner', provider: 'MARKETING_MODULE', status: 'INACTIVE', config: JSON.stringify({ category: 'MARKETING', description: 'Target guest preferences with personalized promotional packages.', cost: '$19/mo' }) }
  ];

  for (const intg of integrations) {
    await prisma.integration.upsert({
      where: { appName: intg.appName },
      update: { provider: intg.provider, config: JSON.parse(intg.config) },
      create: { 
        appName: intg.appName, 
        provider: intg.provider, 
        status: intg.status, 
        config: JSON.parse(intg.config) 
      }
    });
  }

  console.log('Seeding Partner Vendors...');

  const vendors = [
    { name: 'Zenith Linen Services', contactPerson: 'John Zenith', email: 'hello@zenithlinen.com', phone: '555-0100', isActive: false },
    { name: 'Apex SRE Cleaners', contactPerson: 'Sarah Apex', email: 'contact@apexclean.com', phone: '555-0101', isActive: false },
    { name: 'Noonu Catering Corp', contactPerson: 'Chef Noonu', email: 'orders@noonu.com', phone: '555-0102', isActive: true }
  ];

  for (const vend of vendors) {
    const existing = await prisma.vendor.findFirst({ where: { name: vend.name } });
    if (!existing) {
      await prisma.vendor.create({
        data: vend
      });
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
