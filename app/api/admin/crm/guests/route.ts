import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const vipOnly = searchParams.get('vipOnly') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const skip = (page - 1) * limit;

    const whereClause = {
      role: { name: 'GUEST' },
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(vipOnly ? {
        vipStatus: { not: 'STANDARD' }
      } : {})
    };

    const [guests, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          guestPreferences: true,
          guestHistory: true,
          corporateAccount: true,
        },
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return NextResponse.json({ 
      guests, 
      pagination: { 
        page, 
        limit, 
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      } 
    });
  } catch (error) {
    console.error('Failed to fetch guests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { id, vipStatus, blacklistStatus, blacklistReason } = data;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(vipStatus !== undefined && { vipStatus }),
        ...(blacklistStatus !== undefined && { blacklistStatus }),
        ...(blacklistReason !== undefined && { blacklistReason }),
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Failed to update guest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
