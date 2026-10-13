import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.roleName;

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized to view payment card details' }, { status: 401 });
    }

    const { id: bookingId } = await params;

    const channelRes = await prisma.channelReservation.findUnique({
      where: { bookingId },
      include: { booking: true }
    });

    if (!channelRes) {
      return NextResponse.json({ isVcc: false, message: 'No OTA channel reservation found for this booking' });
    }

    const payload = channelRes.payload as any;
    const paymentCard = payload?.paymentCard;

    if (!paymentCard) {
      return NextResponse.json({ isVcc: false, message: 'No virtual credit card attached to this reservation' });
    }

    const rawCardNumber = String(paymentCard.cardNumber || '');
    const last4 = rawCardNumber.length >= 4 ? rawCardNumber.slice(-4) : '****';
    const maskedCardNumber = rawCardNumber.length >= 8 
      ? `•••• •••• •••• ${last4}` 
      : '•••• •••• •••• ****';

    const effectiveDateStr = paymentCard.effectiveDate;
    const now = new Date();
    const isChargeableNow = effectiveDateStr ? (now >= new Date(effectiveDateStr)) : true;

    return NextResponse.json({
      isVcc: true,
      provider: 'AGODA',
      cardCode: paymentCard.cardCode || 'VI',
      cardHolderName: paymentCard.cardHolderName || 'Agoda Virtual Card',
      maskedCardNumber,
      fullCardNumber: rawCardNumber, // Accessible only to authorized receptionist / admin
      expireDate: paymentCard.expireDate,
      secureInd: paymentCard.secureInd, // CVC
      effectiveDate: effectiveDateStr,
      isChargeableNow,
      currentBalance: paymentCard.currentBalance,
      futureBalance: paymentCard.futureBalance,
      currencyCode: paymentCard.currencyCode || 'USD',
      expirationDate: paymentCard.expirationDate,
      otaReference: channelRes.externalReservationId,
      bookingStatus: channelRes.status
    });

  } catch (error: any) {
    console.error('Error fetching VCC details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
