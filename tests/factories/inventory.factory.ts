import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

type PrismaClientType = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class VendorFactory {
  static async create(
    overrides?: Partial<Prisma.VendorCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;
    return client.vendor.create({
      data: {
        name: overrides?.name || faker.company.name(),
        contactPerson: overrides?.contactPerson || faker.person.fullName(),
        email: overrides?.email || faker.internet.email(),
        phone: overrides?.phone || faker.phone.number(),
        address: overrides?.address || faker.location.streetAddress(),
        ...overrides,
      },
    });
  }
}

export class InventoryItemFactory {
  static async create(
    overrides?: Partial<Prisma.InventoryItemCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let vendorInput = overrides?.vendor;
    if (!vendorInput && overrides?.vendor !== null) {
      const vendor = await VendorFactory.create({}, client);
      vendorInput = { connect: { id: vendor.id } };
    }

    return client.inventoryItem.create({
      data: {
        name: overrides?.name || faker.commerce.productName(),
        sku: overrides?.sku || faker.string.alphanumeric(10).toUpperCase(),
        category: overrides?.category || 'MAINTENANCE',
        unit: overrides?.unit || 'PIECE',
        unitPrice: overrides?.unitPrice || faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
        parLevel: overrides?.parLevel || faker.number.int({ min: 5, max: 50 }),
        vendor: vendorInput,
        ...overrides,
      },
    });
  }
}

export class PurchaseOrderFactory {
  static async create(
    overrides?: Partial<Prisma.PurchaseOrderCreateInput>,
    tx?: PrismaClientType
  ) {
    const client = tx || prisma;

    let vendorInput = overrides?.vendor;
    if (!vendorInput) {
      const vendor = await VendorFactory.create({}, client);
      vendorInput = { connect: { id: vendor.id } };
    }

    return client.purchaseOrder.create({
      data: {
        orderNumber: overrides?.orderNumber || 'PO-' + faker.string.alphanumeric(8).toUpperCase(),
        status: overrides?.status || 'DRAFT',
        vendor: vendorInput,
        totalAmount: overrides?.totalAmount || faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
        ...overrides,
      },
    });
  }
}
