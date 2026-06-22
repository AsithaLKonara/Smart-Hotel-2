import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { EmployeeFactory } from './operations.factory';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class ShiftFactory {
  static async create(
    overrides?: Partial<Prisma.ShiftCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let employeeInput = overrides?.employee;
    if (!employeeInput) {
      const employee = await EmployeeFactory.create({}, client);
      employeeInput = { connect: { id: employee.id } };
    }

    const startTime = overrides?.startTime || faker.date.recent();
    const endTime = overrides?.endTime || faker.date.future({ refDate: startTime });

    return client.shift.create({
      data: {
        startTime,
        endTime,
        status: overrides?.status || 'SCHEDULED',
        employee: employeeInput,
        ...overrides,
      },
    });
  }
}

export class AttendanceFactory {
  static async create(
    overrides?: Partial<Prisma.AttendanceCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let employeeInput = overrides?.employee;
    if (!employeeInput) {
      const employee = await EmployeeFactory.create({}, client);
      employeeInput = { connect: { id: employee.id } };
    }

    return client.attendance.create({
      data: {
        date: overrides?.date || faker.date.recent(),
        clockIn: overrides?.clockIn || faker.date.recent(),
        status: overrides?.status || 'PRESENT',
        employee: employeeInput,
        ...overrides,
      },
    });
  }
}
