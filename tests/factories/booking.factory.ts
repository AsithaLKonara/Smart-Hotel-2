import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { UserFactory } from './user.factory';
import { RoomFactory } from './room.factory';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class BookingFactory {
  static async create(
    overrides?: Partial<Prisma.BookingCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let guestInput = overrides?.guest;
    if (!guestInput) {
      const guest = await UserFactory.create({ roleName: 'GUEST' }, client);
      guestInput = { connect: { id: guest.id } };
    }

    const checkIn = overrides?.checkIn || faker.date.future();
    const checkOut = overrides?.checkOut || faker.date.future({ refDate: checkIn });

    return client.booking.create({
      data: {
        confirmationCode: overrides?.confirmationCode || faker.string.alphanumeric(8).toUpperCase(),
        checkIn,
        checkOut,
        status: overrides?.status || 'CONFIRMED',
        source: overrides?.source || 'WEBSITE',
        totalAmount: overrides?.totalAmount || faker.number.float({ min: 100, max: 2000, fractionDigits: 2 }),
        paymentStatus: overrides?.paymentStatus || 'unpaid',
        guest: guestInput,
        ...overrides,
      },
    });
  }
}

export class RoomAssignmentFactory {
  static async create(
    overrides?: Partial<Prisma.RoomAssignmentCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let bookingInput = overrides?.booking;
    if (!bookingInput) {
      const booking = await BookingFactory.create({}, client);
      bookingInput = { connect: { id: booking.id } };
    }

    let roomInput = overrides?.room;
    if (!roomInput) {
      const room = await RoomFactory.create({}, client);
      roomInput = { connect: { id: room.id } };
    }

    return client.roomAssignment.create({
      data: {
        startDate: overrides?.startDate || faker.date.recent(),
        endDate: overrides?.endDate || faker.date.future(),
        status: overrides?.status || 'ACTIVE',
        booking: bookingInput,
        room: roomInput,
        ...overrides,
      },
    });
  }
}

export class StayFactory {
  static async create(
    overrides?: Partial<Prisma.StayCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let bookingInput = overrides?.booking;
    if (!bookingInput) {
      const booking = await BookingFactory.create({}, client);
      bookingInput = { connect: { id: booking.id } };
    }

    let roomInput = overrides?.room;
    if (!roomInput) {
      const room = await RoomFactory.create({}, client);
      roomInput = { connect: { id: room.id } };
    }

    return client.stay.create({
      data: {
        status: overrides?.status || 'EXPECTED',
        booking: bookingInput,
        room: roomInput,
        ...overrides,
      },
    });
  }
}
