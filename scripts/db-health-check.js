const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDatabaseHealthCheck() {
  console.log('🔍 INITIATING DB & REPLICA-SET HEALTH INSPECTION...\n');
  let dbOk = false;

  // Audit Primary Database Connection (MongoDB via Prisma)
  try {
    const startTime = Date.now();
    
    // Execute lookup to ensure connectivity
    await prisma.user.findFirst();
    const duration = Date.now() - startTime;
    
    console.log(`✅ MongoDB Connection: ACTIVE`);
    console.log(`   Response Latency: ${duration}ms`);

    // Check transaction capability
    const txSuccess = await prisma.$transaction(async (tx) => {
      return true;
    }).then(() => true).catch(() => false);

    console.log(`✅ MongoDB Clustered Replica Capability: ${txSuccess ? 'SUPPORTED' : 'NOT SUPPORTED (Single-Node)'}`);
    dbOk = true;
  } catch (err) {
    console.error('❌ MongoDB Connection: FAILED');
    console.error('   Details:', err.message);
  }

  // Audit Upstash Redis environment variables
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  if (redisUrl) {
    console.log(`✅ Cache Storage Configuration (Redis URL): FOUND`);
  } else {
    console.log(`⚪ Cache Storage Configuration (Redis URL): NOT SET (Using defaults)`);
  }

  console.log('\n' + '='.repeat(60));
  if (dbOk) {
    console.log('🎉 DATABASE HEALTH VERIFICATION: PASSED');
    process.exit(0);
  } else {
    console.error('🚨 DATABASE HEALTH VERIFICATION: FAILED');
    process.exit(1);
  }
}

runDatabaseHealthCheck().catch(err => {
  console.error('CRITICAL: Unexpected check exception', err);
  process.exit(1);
});
