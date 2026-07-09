import { prisma } from './lib/db';

async function main() {
  try {
    const room = await prisma.room.findFirst();
    if (!room) {
      console.log('No rooms');
      return;
    }
    const updatedRoom = await prisma.room.update({
      where: { 
        id: room.id, 
        version: room.version,
        OR: [
          { lockExpiresAt: { lt: new Date() } },
          { lockExpiresAt: null }
        ]
      } as any,
      data: { 
        lockId: 'test'
      }
    });
    console.log('Success');
  } catch (e) {
    console.error(e.message);
  }
}

main();
