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
  console.log('--- PHASE 1: SCHEMA DISCOVERY & AUDIT ---');
  
  // Use Prisma's internal metadata to get models
  const models = PrismaClient.prototype.constructor === Object 
    ? Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    : (prisma as any)._baseDmmf?.modelMap 
      ? Object.keys((prisma as any)._baseDmmf.modelMap)
      : Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));

  console.log(`Discovered ${models.length} models.`);
  
  const report: any = {
    phase1: {
      models: models.length,
      tableCounts: {},
    }
  };

  for (const model of models) {
    if (typeof (prisma as any)[model]?.count === 'function') {
      try {
        const count = await (prisma as any)[model].count();
        report.phase1.tableCounts[model] = count;
        console.log(`Table ${model}: ${count} rows`);
      } catch (e) {
        console.log(`Table ${model}: Error getting count - ${e.message}`);
      }
    }
  }

  fs.writeFileSync('db-audit-report.json', JSON.stringify(report, null, 2));
  console.log('Phase 1 complete. Report saved to db-audit-report.json');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
