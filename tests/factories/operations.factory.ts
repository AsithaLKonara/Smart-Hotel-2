import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { UserFactory } from './user.factory';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class FoodMenuFactory {
  static async create(
    overrides?: Partial<Prisma.FoodMenuCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    return client.foodMenu.create({
      data: {
        name: overrides?.name || faker.commerce.productName(),
        description: overrides?.description || faker.commerce.productDescription(),
        category: overrides?.category || 'MAIN_COURSE',
        price: overrides?.price || faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
        preparationTime: overrides?.preparationTime || faker.number.int({ min: 10, max: 60 }),
        ...overrides,
      },
    });
  }
}

export class FoodOrderFactory {
  static async create(
    overrides?: Partial<Prisma.FoodOrderCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let guestInput = overrides?.guest;
    if (!guestInput) {
      const guest = await UserFactory.create({ roleName: 'GUEST' }, client);
      guestInput = { connect: { id: guest.id } };
    }

    return client.foodOrder.create({
      data: {
        status: overrides?.status || 'PENDING',
        totalAmount: overrides?.totalAmount || faker.number.float({ min: 10, max: 200, fractionDigits: 2 }),
        guest: guestInput,
        ...overrides,
      },
    });
  }
}

export class EmployeeFactory {
  static async create(
    overrides?: Partial<Prisma.EmployeeCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    return client.employee.create({
      data: {
        firstName: overrides?.firstName || faker.person.firstName(),
        lastName: overrides?.lastName || faker.person.lastName(),
        email: overrides?.email || faker.internet.email().toLowerCase(),
        phone: overrides?.phone || faker.phone.number(),
        department: overrides?.department || 'FRONT_DESK',
        position: overrides?.position || 'RECEPTIONIST',
        baseSalary: overrides?.baseSalary || faker.number.float({ min: 3000, max: 8000, fractionDigits: 2 }),
        hireDate: overrides?.hireDate || faker.date.past(),
        ...overrides,
      },
    });
  }
}

export class TaskFactory {
  static async create(
    overrides?: Partial<Prisma.TaskCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    return client.task.create({
      data: {
        type: overrides?.type || 'MAINTENANCE',
        title: overrides?.title || faker.lorem.words(3),
        description: overrides?.description || faker.lorem.sentence(),
        priority: overrides?.priority || 'MEDIUM',
        status: overrides?.status || 'PENDING',
        ...overrides,
      },
    });
  }
}
