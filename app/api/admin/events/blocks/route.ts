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
    const { eventId, roomTypeId, blockedCount, contractedRate } = data;

    const block = await prisma.groupBlock.create({
      data: {
        eventId,
        roomTypeId,
        blockedCount: parseInt(blockedCount),
        contractedRate: parseFloat(contractedRate)
      },
      include: { roomType: true }
    });

    return NextResponse.json({ success: true, block });
  } catch (error) {
    console.error('Failed to create group block:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
