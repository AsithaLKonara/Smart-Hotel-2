import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { UserFactory } from './user.factory';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class CorporateAccountFactory {
  static async create(
    overrides?: Partial<Prisma.CorporateAccountCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    return client.corporateAccount.create({
      data: {
        companyName: overrides?.companyName || `${faker.company.name()} ${faker.string.alphanumeric(6)}`,
        contactName: overrides?.contactName || faker.person.fullName(),
        contactEmail: overrides?.contactEmail || faker.internet.email().toLowerCase(),
        contactPhone: overrides?.contactPhone || faker.phone.number(),
        negotiatedRate: overrides?.negotiatedRate || faker.number.float({ min: 50, max: 200, fractionDigits: 2 }),
        ...overrides,
      },
    });
  }
}

export class LoyaltyPointFactory {
  static async create(
    overrides?: Partial<Prisma.LoyaltyPointCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let userInput = overrides?.user;
    if (!userInput) {
      const user = await UserFactory.create({ roleName: 'GUEST' }, client);
      userInput = { connect: { id: user.id } };
    }

    return client.loyaltyPoint.create({
      data: {
        points: overrides?.points || faker.number.int({ min: 0, max: 10000 }),
        tier: overrides?.tier || 'SILVER',
        user: userInput,
        ...overrides,
      },
    });
  }
}
