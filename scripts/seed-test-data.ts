import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test database seed...');

  // Create an admin user for auth.setup.ts
  await prisma.user.upsert({
    where: { email: 'admin@smarthotel.local' },
    update: {
      password: '$2a$10$F.rBYi5oP1f3f.6Qtszyw.pT0DY2culd2SQH5TyPHh6MfNokifJsW',
      name: 'Test Admin',
    },
    create: {
      email: 'admin@smarthotel.local',
      name: 'Test Admin',
      // bcrypt hash for 'admin123'
      password: '$2a$10$F.rBYi5oP1f3f.6Qtszyw.pT0DY2culd2SQH5TyPHh6MfNokifJsW',
      role: {
        connectOrCreate: {
          where: { name: 'SUPER_ADMIN' },
          create: { name: 'SUPER_ADMIN', description: 'System Administrator' },
        },
      },
    },
  });

  // You can expand this file with factories later
  console.log('✅ Test database seeded successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    // Exiting cleanly without typing `process` to avoid TS issues without @types/node
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
