import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const properties = await prisma.property.findMany()
  if (properties.length > 0) {
    const mainProp = properties[0]
    await prisma.property.update({
      where: { id: mainProp.id },
      data: {
        phone: '+1 (800) 555-HOTEL',
        email: 'info@smarthotel.com',
        description: 'Experience unparalleled luxury where timeless elegance meets modern hospitality.',
        mainImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000'
      }
    })
    console.log('Seeded primary property with marketing data')
  }
}
main()
