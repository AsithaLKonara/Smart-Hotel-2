import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class PermissionFactory {
  static async create(
    overrides?: Partial<Prisma.PermissionCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    return client.permission.create({
      data: {
        action: overrides?.action || `${faker.word.verb()}:${faker.word.noun()}:${faker.string.alphanumeric(4)}`,
        description: overrides?.description || faker.lorem.sentence(),
        ...overrides,
      },
    });
  }
}
