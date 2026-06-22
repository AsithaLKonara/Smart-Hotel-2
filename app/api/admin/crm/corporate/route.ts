import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.corporateAccount.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Failed to fetch corporate accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { companyName, contactName, contactEmail, contactPhone, negotiatedRate } = data;

    const account = await prisma.corporateAccount.create({
      data: {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        negotiatedRate: parseFloat(negotiatedRate)
      }
    });

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('Failed to create corporate account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
