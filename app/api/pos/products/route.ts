import { NextResponse } from 'next/server'
import prisma from '@/lib/db' // Make sure it uses @/lib/db which seems to be the standard

export async function GET() {
  try {
    const products = await prisma.pOSProduct.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
      include: {
        outlet: true
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch POS products:', error);
    return NextResponse.json({ error: 'Failed to fetch POS products' }, { status: 500 });
  }
}
