import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { BookingFactory } from './booking.factory';
import { UserFactory } from './user.factory';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class FolioFactory {
  static async create(
    overrides?: Partial<Prisma.FolioCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    
    return client.folio.create({
      data: {
        type: overrides?.type || 'GUEST',
        status: overrides?.status || 'OPEN',
        ...overrides,
      },
    });
  }
}

export class FolioLineItemFactory {
  static async create(
    overrides?: Partial<Prisma.FolioLineItemCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let folioInput = overrides?.folio;
    if (!folioInput) {
      const folio = await FolioFactory.create({}, client);
      folioInput = { connect: { id: folio.id } };
    }

    return client.folioLineItem.create({
      data: {
        description: overrides?.description || faker.commerce.productName(),
        amount: overrides?.amount || faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
        category: overrides?.category || 'ROOM_CHARGE',
        folio: folioInput,
        ...overrides,
      },
    });
  }
}

export class PaymentFactory {
  static async create(
    overrides?: Partial<Prisma.PaymentCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    return client.payment.create({
      data: {
        amount: overrides?.amount || faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
        currency: overrides?.currency || 'LKR',
        paymentMethod: overrides?.paymentMethod || 'card',
        status: overrides?.status || 'completed',
        ...overrides,
      },
    });
  }
}
