import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get first property
  const property = await prisma.property.findFirst()
  if (!property) {
    console.log("No properties found. Please create a property first.")
    return
  }
  
  console.log(`Migrating data to Property: ${property.name} (${property.id})`)
  
  // 1. Room Types
  const roomTypesResult = await prisma.roomType.updateMany({
    where: { propertyId: undefined },
    data: { propertyId: property.id }
  })
  console.log(`Updated ${roomTypesResult.count} RoomTypes`)
  
  // 2. Rate Plans
  const ratePlansResult = await prisma.ratePlan.updateMany({
    where: { propertyId: undefined },
    data: { propertyId: property.id }
  })
  console.log(`Updated ${ratePlansResult.count} RatePlans`)
  
  // 3. Yield Rules
  const yieldRulesResult = await prisma.yieldRule.updateMany({
    where: { propertyId: undefined },
    data: { propertyId: property.id }
  })
  console.log(`Updated ${yieldRulesResult.count} YieldRules`)

  console.log("Data migration complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
