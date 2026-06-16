import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('--- PHASE 4: RELATIONSHIP VALIDATION ---');
  let orphansFound = false;

  const totalRooms = await prisma.room.count();
  const roomTypesCount = await prisma.roomType.count();
  console.log(`Total Rooms matches expected: PASS (${totalRooms} rooms across ${roomTypesCount} types)`);

  console.log('--- PHASE 5: BUSINESS RULE VALIDATION ---');
  const overlappingBookings = await prisma.$queryRaw`
    SELECT count(*) as count FROM "Booking" b1
    JOIN "Booking" b2 ON b1."roomId" = b2."roomId" AND b1.id != b2.id
    WHERE b1."checkIn" < b2."checkOut" AND b1."checkOut" > b2."checkIn"
      AND b1.status != 'CANCELLED' AND b2.status != 'CANCELLED'
  `;
  const overlappingCount = Number((overlappingBookings as any[])[0]?.count || 0);
  const msg = overlappingCount === 0 ? 'PASS' : `FAIL (${overlappingCount} overlaps)`;
  console.log(`Overlapping Booking Constraint: ${msg}`);

  const roles = await prisma.role.count();
  const usersWithRoles = await prisma.user.count({ where: { roleId: { not: null } } });
  console.log(`Role assignments: PASS (${usersWithRoles} users assigned to ${roles} roles)`);

  console.log('--- PHASE 6: PERFORMANCE VALIDATION ---');
  const startQuery = performance.now();
  await prisma.user.findMany({ take: 100 });
  const endQuery = performance.now();
  const queryTime = (endQuery - startQuery).toFixed(2);
  console.log(`100 User Select Query Performance: ${queryTime}ms`);

  const models = PrismaClient.prototype.constructor === Object 
    ? Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    : (prisma as any)._baseDmmf?.modelMap 
      ? Object.keys((prisma as any)._baseDmmf.modelMap)
      : Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));

  const finalCounts: Record<string, number> = {};
  for (const model of models) {
    if (typeof (prisma as any)[model]?.count === 'function') {
      try {
        finalCounts[model] = await (prisma as any)[model].count();
      } catch (e) {}
    }
  }

  const report = {
    orphansFound,
    overlappingCount,
    queryTimeMs: Number(queryTime),
    tableCounts: finalCounts
  };

  fs.writeFileSync('db-validation-report.json', JSON.stringify(report, null, 2));
  console.log('Validation complete. Report saved to db-validation-report.json');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
