import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const testUsers = {
  admin: {
    id: 'test-admin-1',
    email: 'admin@smarthotel.test',
    name: 'Test Admin',
    role: 'SUPER_ADMIN' as const,
    password: 'password123',
  },
  manager: {
    id: 'test-manager-1',
    email: 'manager@smarthotel.test',
    name: 'Test Manager',
    role: 'MANAGER' as const,
    password: 'password123',
  },
  guest: {
    id: 'test-guest-1',
    email: 'guest@smarthotel.test',
    name: 'Test Guest',
    role: 'GUEST' as const,
    password: 'password123',
  },
}

export const testHotels = {
  main: {
    id: 'test-hotel-1',
    name: 'Test SmartHotel',
    address: '123 Test Street, Test City',
    contactEmail: 'info@smarthotel.test',
    contactPhone: '+1234567890',
  },
}

export const testRoomTypes = {
  deluxe: {
    id: 'test-rt-1',
    name: 'DELUXE',
    description: 'Luxury suite with premium views',
    baseRate: 150.00,
    capacity: 2,
    amenities: ['WiFi', 'TV', 'Mini Bar'],
    images: ['/images/hotel/room-deluxe.jpg']
  },
  standard: {
    id: 'test-rt-2',
    name: 'STANDARD',
    description: 'Comfortable room for two',
    baseRate: 100.00,
    capacity: 2,
    amenities: ['WiFi', 'TV'],
    images: ['/images/hotel/room-standard.jpg']
  }
}

export const testRooms = {
  deluxe: {
    id: 'test-room-1',
    number: '101',
    roomTypeId: testRoomTypes.deluxe.id,
    floor: 1,
    capacity: 2,
    size: 35
  },
  standard: {
    id: 'test-room-2',
    number: '102',
    roomTypeId: testRoomTypes.standard.id,
    floor: 1,
    capacity: 2,
    size: 25
  },
}

export const testBookings = {
  confirmed: {
    id: 'test-booking-1',
    primaryGuestId: testUsers.guest.id,
    roomId: testRooms.deluxe.id,
    checkIn: new Date('2025-10-01'),
    checkOut: new Date('2025-10-03'),
    guests: 2,
    status: 'CONFIRMED' as const,
    totalAmount: 300.00,
    paymentStatus: 'completed' as const,
    confirmationCode: 'TEST-CONF-1'
  },
}

export const testMenuItems = {
  pizza: {
    id: 'test-menu-1',
    name: 'Margherita Pizza',
    description: 'Classic tomato and mozzarella',
    price: 15.99,
    category: 'MAIN_COURSE' as const,
    available: true,
    preparationTime: 15,
  },
  burger: {
    id: 'test-menu-2',
    name: 'Cheeseburger',
    description: 'Beef patty with cheese',
    price: 12.99,
    category: 'MAIN_COURSE' as const,
    available: true,
    preparationTime: 10,
  },
}

export async function seedTestData() {
  // Create test users
  for (const user of Object.values(testUsers)) {
    const hashedPassword = await bcrypt.hash(user.password, 12)
    await prisma.user.upsert({
      where: { id: user.id },
      update: { ...user, password: hashedPassword },
      create: { ...user, password: hashedPassword },
    })
  }

  // Create test room types
  for (const rt of Object.values(testRoomTypes)) {
    await prisma.roomType.upsert({
      where: { id: rt.id },
      update: rt,
      create: rt,
    })
  }

  // Create test rooms
  for (const room of Object.values(testRooms)) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: room,
      create: room,
    })
  }

  // Create test menu items
  for (const item of Object.values(testMenuItems)) {
    await prisma.foodMenu.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }

}

export async function cleanupTestData() {
  // Clean up in reverse order of dependencies
  await prisma.booking.deleteMany({
    where: { id: { startsWith: 'test-' } },
  })
  await prisma.foodMenu.deleteMany({
    where: { id: { startsWith: 'test-' } },
  })
  await prisma.room.deleteMany({
    where: { id: { startsWith: 'test-' } },
  })
  await prisma.roomType.deleteMany({
    where: { id: { startsWith: 'test-' } },
  })
  await prisma.user.deleteMany({
    where: { id: { startsWith: 'test-' } },
  })
}
