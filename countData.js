const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof prisma[k].count === 'function');
  const results = [];
  for (const model of models) {
    try {
      const count = await prisma[model].count();
      if (count > 0) {
        results.push({ model, count });
      }
    } catch (e) {
      // ignore
    }
  }
  console.log('--- DATABASE DATA SUMMARY ---');
  results.sort((a,b) => b.count - a.count).forEach(r => {
    console.log(`- ${r.model}: ${r.count} records`);
  });
}
main().finally(() => prisma.$disconnect());
