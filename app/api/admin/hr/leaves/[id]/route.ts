import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be APPROVED or REJECTED.' }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status },
      include: { employee: true }
    });

    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.leaveRequest.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete leave request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
