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

    const { providerCode, propertyId, clientId, clientSecret } = await req.json();

    if (!providerCode || !propertyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get or Create the Provider
    const providerNames: Record<string, string> = {
      'BOOKING_COM': 'Booking.com',
      'EXPEDIA': 'Expedia',
      'AIRBNB': 'Airbnb'
    };

    let provider = await prisma.channelProvider.findUnique({
      where: { code: providerCode }
    });

    if (!provider) {
      provider = await prisma.channelProvider.create({
        data: {
          code: providerCode,
          name: providerNames[providerCode] || providerCode
        }
      });
    }

    // 2. Create the Connection
    const connection = await prisma.channelConnection.create({
      data: {
        providerId: provider.id,
        propertyId,
        clientId,
        clientSecretEncrypted: clientSecret, // In reality, this would be encrypted
        status: 'HEALTHY',
        environment: 'PRODUCTION'
      }
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error: any) {
    console.error('Channel Manager Connection Error:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}
