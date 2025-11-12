import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function assertDataset() {
  const [
    userCount,
    staffCount,
    roomCount,
    bookingCount,
    invoiceCount,
    taskCount,
    menuCount,
    foodOrderCount,
    orderItemCount,
    reviewCount,
    notificationCount,
    wishlistCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.staff.count(),
    prisma.room.count(),
    prisma.booking.count(),
    prisma.invoice.count(),
    prisma.task.count(),
    prisma.foodMenu.count(),
    prisma.foodOrder.count(),
    prisma.orderItem.count(),
    prisma.guestReview.count(),
    prisma.notification.count(),
    prisma.wishlist.count(),
  ])

  console.log('=== Collection Counts ===')
  console.log(`Users:          ${userCount.toLocaleString()}`)
  console.log(`Staff:          ${staffCount.toLocaleString()}`)
  console.log(`Rooms:          ${roomCount.toLocaleString()}`)
  console.log(`Bookings:       ${bookingCount.toLocaleString()}`)
  console.log(`Invoices:       ${invoiceCount.toLocaleString()}`)
  console.log(`Tasks:          ${taskCount.toLocaleString()}`)
  console.log(`Menu Items:     ${menuCount.toLocaleString()}`)
  console.log(`Food Orders:    ${foodOrderCount.toLocaleString()}`)
  console.log(`Order Items:    ${orderItemCount.toLocaleString()}`)
  console.log(`Guest Reviews:  ${reviewCount.toLocaleString()}`)
  console.log(`Notifications:  ${notificationCount.toLocaleString()}`)
  console.log(`Wishlists:      ${wishlistCount.toLocaleString()}`)
  console.log()

  const booking = await prisma.booking.findFirst({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      room: { select: { id: true, number: true, type: true, hotelId: true } },
      invoice: { select: { id: true, total: true, status: true } },
      tasks: {
        take: 2,
        include: { staff: { select: { id: true, name: true, department: true } } },
      },
    },
  })

  if (booking) {
    console.log('=== Sample Booking ===')
    console.log({
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      guest: booking.user,
      room: booking.room,
      invoice: booking.invoice,
      sampleTasks: booking.tasks,
    })
    console.log()
  } else {
    console.warn('No booking found to inspect.')
  }

  const order = await prisma.foodOrder.findFirst({
    include: {
      items: {
        include: {
          menu: { select: { id: true, name: true, price: true, category: true } },
        },
      },
    },
  })

  if (order) {
    const bookingSummary = order.bookingId
      ? await prisma.booking.findUnique({
          where: { id: order.bookingId },
          select: {
            id: true,
            confirmationCode: true,
            room: { select: { number: true, type: true } },
            user: { select: { id: true, name: true } },
          },
        })
      : null

    console.log('=== Sample Food Order ===')
    console.log({
      orderId: order.id,
      booking: bookingSummary,
      roomNumber: order.roomNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      itemSummary: order.items.map(item => ({
        itemId: item.id,
        menu: item.menu,
        quantity: item.quantity,
        lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
      })),
    })
    console.log()
  } else {
    console.warn('No food order found to inspect.')
  }

  const review = await prisma.guestReview.findFirst({
    include: {
      user: { select: { id: true, name: true, email: true } },
      booking: { select: { id: true, confirmationCode: true } },
      room: { select: { id: true, number: true, type: true } },
    },
  })

  if (review) {
    console.log('=== Sample Guest Review ===')
    console.log({
      reviewId: review.id,
      rating: review.rating,
      title: review.title,
      user: review.user,
      room: review.room,
      booking: review.booking,
    })
    console.log()
  } else {
    console.warn('No guest review found to inspect.')
  }

  const notification = await prisma.notification.findFirst({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  if (notification) {
    console.log('=== Sample Notification ===')
    console.log({
      notificationId: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      user: notification.user,
      data: notification.data,
    })
    console.log()
  } else {
    console.warn('No notification found to inspect.')
  }
}

async function main() {
  try {
    await assertDataset()
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error('Dataset verification failed:', error)
  process.exit(1)
})

