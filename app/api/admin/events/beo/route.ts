import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { handleZodError } from '@/lib/api-utils';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

    const beo = await prisma.bEO.findUnique({
      where: { eventId },
      include: { package: true }
    });

    return NextResponse.json({ data: beo });
  } catch (error) {
    console.error('Failed to fetch BEO:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const updateBEOSchema = z.object({
  eventId: z.string().uuid(),
  packageId: z.string().uuid().optional().nullable(),
  guaranteedPax: z.number().int().min(0),
  agreedPricePerPax: z.number().min(0),
  agreedHallFee: z.number().min(0),
  status: z.enum(['DRAFT', 'SIGNED', 'COMPLETED']).default('DRAFT')
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = updateBEOSchema.safeParse(json);
    if (!result.success) return handleZodError(result.error);

    const { eventId, packageId, guaranteedPax, agreedPricePerPax, agreedHallFee, status } = result.data;
    const totalAmount = (guaranteedPax * agreedPricePerPax) + agreedHallFee;

    const beo = await prisma.bEO.upsert({
      where: { eventId },
      create: {
        eventId,
        packageId,
        guaranteedPax,
        agreedPricePerPax,
        agreedHallFee,
        totalAmount,
        status
      },
      update: {
        packageId,
        guaranteedPax,
        agreedPricePerPax,
        agreedHallFee,
        totalAmount,
        status
      },
      include: { package: true }
    });

    return NextResponse.json({ success: true, data: beo });
  } catch (error) {
    console.error('Failed to upsert BEO:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
