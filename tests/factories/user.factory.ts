import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class RoleFactory {
  static async create(
    overrides?: Partial<Prisma.RoleCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    return client.role.create({
      data: {
        name: overrides?.name || `${faker.person.jobType().toUpperCase()}_${faker.string.alphanumeric(6).toUpperCase()}`,
        description: overrides?.description || faker.lorem.sentence(),
        ...overrides,
      },
    });
  }
}

export class UserFactory {
  static async create(
    overrides?: Partial<Prisma.UserCreateInput> & { roleName?: string },
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    // Check if roleName override was provided, or if role is already passed
    let roleInput = overrides?.role;
    if (!roleInput && overrides?.roleName) {
      // Find or create role
      let role = await client.role.findUnique({ where: { name: overrides.roleName } });
      if (!role) {
        role = await RoleFactory.create({ name: overrides.roleName }, client);
      }
      roleInput = { connect: { id: role.id } };
    } else if (!roleInput) {
      const role = await RoleFactory.create({}, client);
      roleInput = { connect: { id: role.id } };
    }

    const { roleName, ...prismaOverrides } = overrides || {};

    return client.user.create({
      data: {
        email: overrides?.email || faker.internet.email().toLowerCase(),
        name: overrides?.name || faker.person.fullName(),
        password: overrides?.password || '$2b$10$xyz', // mock hash
        phone: overrides?.phone || faker.phone.number(),
        role: roleInput,
        ...prismaOverrides,
      },
    });
  }
}
