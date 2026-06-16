import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { outletId, name, category, price } = data;

    const product = await prisma.pOSProduct.create({
      data: {
        outletId,
        name,
        category,
        price: parseFloat(price)
      }
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Failed to create POS Product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
