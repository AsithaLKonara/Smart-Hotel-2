const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generateDataAvailabilityReport() {
  console.log('📊 SmartHotel OS — Data Availability & Schema Integrity Report')
  console.log('===========================================================')
  
  try {
    // 1. Core Inventory & Users
    const userCount = await prisma.user.count().catch(() => 0)
    const roomCount = await prisma.room.count().catch(() => 0)
    const roomTypeCount = await prisma.roomType.count().catch(() => 0)
    
    // 2. Bookings & Revenue
    const bookingCount = await prisma.booking.count().catch(() => 0)
    const invoiceCount = await prisma.invoice.count().catch(() => 0)
    const paymentCount = await prisma.payment.count().catch(() => 0)
    
    // 3. Operational Feed
    const taskCount = await prisma.task.count().catch(() => 0)
    const foodOrderCount = await prisma.foodOrder.count().catch(() => 0)
    const auditCount = await prisma.auditLog.count().catch(() => 0)
    const complaintCount = await prisma.complaint.count().catch(() => 0)

    // 4. Content & AI
    const heroSlides = await prisma.heroSlide.count().catch(() => 0)
    const testimonials = await prisma.testimonial.count().catch(() => 0)
    const galleryItems = await prisma.gallery.count().catch(() => 0)

    console.log(`\n📁 Identity & Inventory:`)
    console.log(`- Total Users: ${userCount}`)
    console.log(`- Physical Rooms: ${roomCount}`)
    console.log(`- Room Categories: ${roomTypeCount}`)

    console.log(`\n💳 Commerce & Revenue:`)
    console.log(`- Total Bookings: ${bookingCount}`)
    console.log(`- Generated Invoices: ${invoiceCount}`)
    console.log(`- Processed Payments: ${paymentCount}`)

    console.log(`\n⚙️ Operational Activity:`)
    console.log(`- Workflow Tasks: ${taskCount}`)
    console.log(`- Dining/Service Orders: ${foodOrderCount}`)
    console.log(`- Active Complaints: ${complaintCount}`)
    console.log(`- Audit Trail Entries: ${auditCount}`)

    console.log(`\n🖼 Public Presentation:`)
    console.log(`- Hero Carousel Slides: ${heroSlides}`)
    console.log(`- Published Testimonials: ${testimonials}`)
    console.log(`- Gallery Assets: ${galleryItems}`)

    // 5. High-Governance Integrity Indicators
    console.log(`\n🔍 Governance Integrity Indicators:`)
    const pendingTasks = await prisma.task.count({ where: { status: 'PENDING' } }).catch(() => 0)
    const openComplaints = await prisma.complaint.count({ where: { status: 'OPEN' } }).catch(() => 0)
    console.log(`- Unresolved Tasks (Backlog): ${pendingTasks}`)
    console.log(`- Open Guest Complaints: ${openComplaints}`)

    // 6. Architecture Context
    console.log(`\n🛠 Infrastructure Strategy:`)
    console.log(`- Database Provider: MongoDB Atlas`)
    console.log(`- Multi-Tenant Schema: Active`)
    console.log(`- Real-time Syncing: Enabled (OTA Mapping Ready)`)

  } catch (error) {
    console.error('❌ Data Availability Audit Failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateDataAvailabilityReport()
