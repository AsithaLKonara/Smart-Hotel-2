import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const outlets = await prisma.pOSOutlet.findMany({
      include: {
        products: {
            where: { isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ outlets });
  } catch (error) {
    console.error('Failed to fetch POS Outlets:', error);
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
    const { name, type, description } = data;

    const outlet = await prisma.pOSOutlet.create({
      data: { name, type, description }
    });

    return NextResponse.json({ success: true, outlet });
  } catch (error) {
    console.error('Failed to create POS Outlet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
