import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.pOSProduct.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch POS products:', error);
    return NextResponse.json({ error: 'Failed to fetch POS products' }, { status: 500 });
  }
}
