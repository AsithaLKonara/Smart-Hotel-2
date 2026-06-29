import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class PropertyFactory {
  static async create(
    overrides?: Partial<Prisma.PropertyCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    return client.property.create({
      data: {
        name: overrides?.name || faker.company.name() + ' Hotel',
        code: overrides?.code || faker.string.alphanumeric(6).toUpperCase(),
        address: overrides?.address || faker.location.streetAddress(),
        city: overrides?.city || faker.location.city(),
        country: overrides?.country || faker.location.country(),
        ...overrides,
      },
    });
  }
}

export class RoomTypeFactory {
  static async create(
    overrides?: Partial<Prisma.RoomTypeCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    return client.roomType.create({
      data: {
        name: overrides?.name || `${faker.commerce.productName()} ${faker.string.alphanumeric(4)} Suite`,
        description: overrides?.description || faker.lorem.paragraph(),
        baseRate: overrides?.baseRate || faker.number.float({ min: 100, max: 1000, fractionDigits: 2 }),
        capacity: overrides?.capacity || faker.number.int({ min: 1, max: 6 }),
        amenities: overrides?.amenities || [faker.commerce.productMaterial(), faker.commerce.productAdjective()],
        ...overrides,
      },
    });
  }
}

export class RoomFactory {
  static async create(
    overrides?: Partial<Prisma.RoomCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    
    let roomTypeInput = overrides?.roomType;
    if (!roomTypeInput) {
      const roomType = await RoomTypeFactory.create({}, client);
      roomTypeInput = { connect: { id: roomType.id } };
    }

    return client.room.create({
      data: {
        number: overrides?.number || faker.number.int({ min: 100, max: 9999 }).toString() + faker.string.alphanumeric(2).toUpperCase(),
        floor: overrides?.floor || faker.number.int({ min: 1, max: 10 }),
        size: overrides?.size || faker.number.int({ min: 20, max: 100 }),
        capacity: overrides?.capacity || 2,
        status: overrides?.status || 'AVAILABLE',
        roomType: roomTypeInput,
        ...overrides,
      },
    });
  }
}
