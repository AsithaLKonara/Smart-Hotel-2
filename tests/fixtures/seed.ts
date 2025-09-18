import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const testUsers = {
  admin: {
    id: 'test-admin-1',
    email: 'admin@smarthotel.test',
    name: 'Test Admin',
    role: 'SUPER_ADMIN',
    password: 'password123',
  },
  manager: {
    id: 'test-manager-1',
    email: 'manager@smarthotel.test',
    name: 'Test Manager',
    role: 'MANAGER',
    password: 'password123',
  },
  guest: {
    id: 'test-guest-1',
    email: 'guest@smarthotel.test',
    name: 'Test Guest',
    role: 'GUEST',
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

export const testRooms = {
  deluxe: {
    id: 'test-room-1',
    number: '101',
    type: 'DELUXE',
    price: 150.00,
    capacity: 2,
    amenities: ['WiFi', 'TV', 'Mini Bar'],
    hotelId: testHotels.main.id,
  },
  standard: {
    id: 'test-room-2',
    number: '102',
    type: 'STANDARD',
    price: 100.00,
    capacity: 2,
    amenities: ['WiFi', 'TV'],
    hotelId: testHotels.main.id,
  },
}

export const testBookings = {
  confirmed: {
    id: 'test-booking-1',
    userId: testUsers.guest.id,
    roomId: testRooms.deluxe.id,
    checkIn: new Date('2025-10-01'),
    checkOut: new Date('2025-10-03'),
    status: 'CONFIRMED',
    totalAmount: 300.00,
    paymentStatus: 'PAID',
  },
}

export const testMenuItems = {
  pizza: {
    id: 'test-menu-1',
    name: 'Margherita Pizza',
    description: 'Classic tomato and mozzarella',
    price: 15.99,
    category: 'MAIN_COURSE',
    isAvailable: true,
  },
  burger: {
    id: 'test-menu-2',
    name: 'Cheeseburger',
    description: 'Beef patty with cheese',
    price: 12.99,
    category: 'MAIN_COURSE',
    isAvailable: true,
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

  // Create test booking
  await prisma.booking.upsert({
    where: { id: testBookings.confirmed.id },
    update: testBookings.confirmed,
    create: testBookings.confirmed,
  })
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
  await prisma.user.deleteMany({
    where: { id: { startsWith: 'test-' } },
  })
}
