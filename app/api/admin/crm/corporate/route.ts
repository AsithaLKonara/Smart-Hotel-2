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

    const corporateAccounts = await prisma.corporateAccount.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { companyName: 'asc' }
    });

    return NextResponse.json({ accounts: corporateAccounts });
  } catch (error) {
    console.error('Failed to fetch corporate accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
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
        negotiatedRate: negotiatedRate ? parseFloat(negotiatedRate) : null,
      }
    });

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('Failed to create corporate account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
