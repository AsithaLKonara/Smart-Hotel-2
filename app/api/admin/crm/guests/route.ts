import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const vipOnly = searchParams.get('vipOnly') === 'true';

    const guests = await prisma.user.findMany({
      where: {
        role: 'GUEST',
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
        ...(vipOnly ? {
          vipStatus: { not: 'STANDARD' }
        } : {})
      },
      include: {
        guestPreferences: true,
        guestHistory: true,
        corporateAccount: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ guests });
  } catch (error) {
    console.error('Failed to fetch guests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
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
