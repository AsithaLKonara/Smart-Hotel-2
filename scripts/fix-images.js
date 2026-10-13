const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const S3_PREFIX = 'https://versatile-canister-ttmo2x.t3.storageapi.dev';
  
  const roomImages = await prisma.roomImage.findMany();
  for (const ri of roomImages) {
    if (ri.imageUrl.startsWith(S3_PREFIX)) {
      const newUrl = ri.imageUrl.replace(S3_PREFIX, '/api/images');
      await prisma.roomImage.update({
        where: { id: ri.id },
        data: { imageUrl: newUrl }
      });
      console.log('Updated RoomImage:', newUrl);
    }
  }

  const roomTypes = await prisma.roomType.findMany();
  for (const rt of roomTypes) {
    let updated = false;
    const newImages = rt.images.map(img => {
      if (img.startsWith(S3_PREFIX)) {
        updated = true;
        return img.replace(S3_PREFIX, '/api/images');
      }
      return img;
    });
    if (updated) {
      await prisma.roomType.update({
        where: { id: rt.id },
        data: { images: newImages }
      });
      console.log('Updated RoomType images:', newImages);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
