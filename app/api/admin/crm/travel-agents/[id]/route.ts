import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const data = await req.json();
    const { agencyName, iataNumber, contactName, contactEmail, contactPhone, commissionRate, isActive } = data;

    const agent = await prisma.travelAgent.update({
      where: { id },
      data: {
        ...(agencyName && { agencyName }),
        ...(iataNumber !== undefined && { iataNumber }),
        ...(contactName && { contactName }),
        ...(contactEmail && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(commissionRate !== undefined && { commissionRate: parseFloat(commissionRate) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('Failed to update travel agent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
      await prisma.travelAgent.delete({ where: { id } });
      return NextResponse.json({ success: true, deleted: true });
    } catch (dbError: any) {
      if (dbError.code === 'P2003') { // Foreign key constraint failed
        const agent = await prisma.travelAgent.update({
          where: { id },
          data: { isActive: false }
        });
        return NextResponse.json({ success: true, deleted: false, deactivated: true, agent });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Failed to delete travel agent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
