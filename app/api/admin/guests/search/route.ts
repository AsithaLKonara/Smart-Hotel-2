import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectivePropertyId } from '@/lib/server-rbac';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    
    if (query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const propertyId = await getEffectivePropertyId(req);
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {};

    const guests = await prisma.user.findMany({
      where: {
        ...propertyWhere,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({ data: guests });
  } catch (error) {
    console.error('Failed to search guests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
