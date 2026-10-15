import prisma from '../lib/db'
import { StayExtraService } from '../lib/services/stay-extra-service'
import { BookingService } from '../lib/services/BookingService'
import { CmsService } from '../lib/services/cms-service'
import { retrieveDatabaseFacts } from '../lib/chatbot/db-retriever'
import { getHotelContactInfo } from '../lib/settings'

async function runFullVerification() {
  console.log('====================================================')
  console.log('🚀 RUNNING COMPREHENSIVE SMART-HOTEL OS E2E VERIFICATION')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${testName}: ${detail || 'Assertion failed'}`)
      failed++
    }
  }

  try {
    // 1. Verify Property Entity & Multi-property Support
    console.log('--- 1. Testing Properties & Multi-property Architecture ---')
    const properties = await prisma.property.findMany({ take: 5 })
    assert(properties.length > 0, 'Properties exist in database', `Found ${properties.length} properties`)
    const firstProperty = properties[0]

    // 2. Verify 24 Core CRUD Entities in Database
    console.log('\n--- 2. Testing 24 Core Domain Entities (Read & Relational Integrity) ---')
    const entities = [
      { name: 'Room', count: await prisma.room.count() },
      { name: 'RoomType', count: await prisma.roomType.count() },
      { name: 'Property', count: await prisma.property.count() },
      { name: 'ExtraService', count: await prisma.extraService.count() },
      { name: 'HeroSlide', count: await prisma.heroSlide.count() },
      { name: 'Gallery', count: await prisma.gallery.count() },
      { name: 'Experience', count: await prisma.experience.count() },
      { name: 'ResortFacility', count: await prisma.resortFacility.count() },
      { name: 'FoodMenu', count: await prisma.foodMenu.count() },
      { name: 'Inventory', count: await prisma.inventory.count() },
      { name: 'Task', count: await prisma.task.count() },
      { name: 'MaintenanceWorkOrder', count: await prisma.maintenanceWorkOrder.count() },
      { name: 'Booking', count: await prisma.booking.count() },
      { name: 'Folio', count: await prisma.folio.count() },
      { name: 'Payment', count: await prisma.payment.count() },
      { name: 'Feedback', count: await prisma.feedback.count() },
      { name: 'FAQ', count: await prisma.fAQ.count() },
      { name: 'NavigationLink', count: await prisma.navigationLink.count() },
      { name: 'FooterLink', count: await prisma.footerLink.count() },
      { name: 'SocialLink', count: await prisma.socialLink.count() },
      { name: 'Role', count: await prisma.role.count() },
      { name: 'User', count: await prisma.user.count() },
      { name: 'EventSpace', count: await prisma.eventSpace.count() },
      { name: 'Setting', count: await prisma.setting.count() },
    ]

    for (const ent of entities) {
      assert(ent.count >= 0, `Entity [${ent.name}] queryable via Prisma (Count: ${ent.count})`)
    }

    // 3. Test StayExtraService CRUD Cycle
    console.log('\n--- 3. Testing StayExtraService CRUD Lifecycle ---')
    const testCode = 'TEST_E2E_' + Date.now()
    const createdExtra = await StayExtraService.createExtraService({
      name: 'E2E Royal Champagne & Caviar',
      code: testCode,
      description: 'Exclusive verification amenity',
      price: 150,
      priceType: 'PER_STAY',
      propertyId: firstProperty ? firstProperty.id : null,
      icon: '🍾',
      imageUrl: '/images/amenities/champagne.jpg',
      active: true,
      order: 99
    })
    assert(!!createdExtra && createdExtra.code === testCode, 'Create Extra Service', `Created ID: ${createdExtra.id}`)

    const readExtra = await StayExtraService.getExtraServiceById(createdExtra.id)
    assert(readExtra?.name === 'E2E Royal Champagne & Caviar', 'Read Extra Service by ID')

    const updatedExtra = await StayExtraService.updateExtraService(createdExtra.id, {
      price: 180,
      description: 'Updated Royal Champagne & Caviar service'
    })
    assert(Number(updatedExtra.price) === 180, 'Update Extra Service price', `New Price: ${updatedExtra.price}`)

    const deletedExtra = await StayExtraService.deleteExtraService(createdExtra.id)
    assert(deletedExtra.id === createdExtra.id, 'Delete Extra Service', `Deleted ID: ${deletedExtra.id}`)

    // 4. Test BookingService Quote & Reservation Calculations
    console.log('\n--- 4. Testing BookingService Dynamic Quote Calculation ---')
    const sampleRoom = await prisma.room.findFirst({
      include: { roomType: true }
    })
    if (sampleRoom) {
      const checkInDate = new Date(Date.now() + 86400000)
      const checkOutDate = new Date(Date.now() + 86400000 * 3) // 2 nights
      const quote = await BookingService.calculateReservationQuote(
        sampleRoom.id,
        checkInDate,
        checkOutDate,
        ['AIRPORT_TRANSFER']
      )
      assert(quote.nights === 2, 'Quote calculates exact night duration', `Nights: ${quote.nights}`)
      assert(quote.totalAmount > quote.roomSubtotal, 'Quote includes room subtotal and taxes/extras', `Total: $${quote.totalAmount}`)
      assert(quote.taxAmount > 0, 'Quote calculates taxes accurately', `Tax: $${quote.taxAmount}`)
    } else {
      console.log('⚠️ Skipping room quote calculation test: No rooms seeded.')
    }

    // 5. Test CmsService Dynamic Hero Slides & Story Image
    console.log('\n--- 5. Testing CmsService Dynamic Slides & CMS Story ---')
    const heroSlides = await CmsService.getHeroSlides()
    assert(heroSlides.length > 0, 'CMS Hero Slides fetched and auto-seeded', `Slide count: ${heroSlides.length}`)

    const storyImage = await CmsService.getStoryImage()
    assert(typeof storyImage === 'string' && storyImage.length > 0, 'CMS Story Image available', `Image: ${storyImage}`)

    // 6. Test Chatbot RAG Database Grounding Retriever
    console.log('\n--- 6. Testing Chatbot RAG Database Grounding ---')
    const ragFacts = await retrieveDatabaseFacts('What room types and dining options are available?')
    assert(ragFacts.length > 0, 'Chatbot retrieves live database facts', `Retrieved ${ragFacts.length} context facts`)
    const categories = new Set(ragFacts.map(f => f.category))
    assert(categories.size >= 2, 'RAG retrieves multiple domain categories', `Categories: ${Array.from(categories).join(', ')}`)

    // 7. Test Contact Settings & Real World Map URL
    console.log('\n--- 7. Testing Contact Settings & Interactive Map URL ---')
    const contactSettings = await getHotelContactInfo()
    assert(!!contactSettings.address, 'Contact address configured', `Address: ${contactSettings.address}`)
    assert(contactSettings.mapUrl !== undefined, 'Contact map URL configured', `Map URL: ${contactSettings.mapUrl || 'Auto Pinpoint'}`)

    console.log('\n====================================================')
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('====================================================')

    if (failed > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  } catch (error) {
    console.error('Unhandled verification error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runFullVerification()
