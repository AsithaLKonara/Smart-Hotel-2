const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst();
  
  if (!property) {
    console.log("No properties found. Skipping assignment.");
    return;
  }

  const propertyId = property.id;
  console.log(`Assigning orphaned records to property: ${propertyId}`);

  const updateOps = [
    prisma.resortFacility.updateMany({ where: { propertyId: null }, data: { propertyId } }),
    prisma.pOSOutlet.updateMany({ where: { propertyId: null }, data: { propertyId } }),
    prisma.eventSpace.updateMany({ where: { propertyId: null }, data: { propertyId } }),
    prisma.banquetingEvent.updateMany({ where: { propertyId: null }, data: { propertyId } }),
    prisma.gallery.updateMany({ where: { propertyId: null }, data: { propertyId } }),
    prisma.inventory.updateMany({ where: { propertyId: null }, data: { propertyId } }),
  ];

  await Promise.all(updateOps);
  console.log("Successfully migrated all existing records to the default property.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
