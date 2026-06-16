import { prisma } from '@/lib/db';
import { DomainEvent, CheckOutCompletedPayload } from '@/lib/messaging/domain-events';

export async function processGuestHistoryProjection(event: DomainEvent<CheckOutCompletedPayload>) {
  const { bookingId } = event.payload;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        folios: {
          include: {
            lineItems: true
          }
        }
      }
    });

    if (!booking) {
      console.warn(`[GuestHistoryProjection] Booking ${bookingId} not found`);
      return;
    }

    const guestId = booking.primaryGuestId;

    // Calculate total spend from folios
    let totalSpend = 0;
    booking.folios.forEach((folio: any) => {
      folio.lineItems.forEach((item: any) => {
        totalSpend += Number(item.amount) || 0;
      });
    });
    
    // If no folios (legacy fallback), use booking totalAmount
    if (totalSpend === 0) {
      totalSpend = booking.totalAmount;
    }

    // Upsert Guest Profile
    const guestProfile = await prisma.guestProfile.upsert({
      where: { userAccountId: guestId },
      update: {},
      create: {
        userAccountId: guestId,
        preferences: {
          totalStays: 0,
          totalSpend: 0,
          lastStayDates: []
        }
      }
    });

    // Parse existing preferences
    const prefs = (guestProfile.preferences as any) || { totalStays: 0, totalSpend: 0, lastStayDates: [] };
    
    prefs.totalStays = (prefs.totalStays || 0) + 1;
    prefs.totalSpend = (prefs.totalSpend || 0) + totalSpend;
    
    if (!prefs.lastStayDates) prefs.lastStayDates = [];
    prefs.lastStayDates.push({
      bookingId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut
    });

    // Save updated preferences
    await prisma.guestProfile.update({
      where: { id: guestProfile.id },
      data: {
        preferences: prefs
      }
    });

    console.log(`[GuestHistoryProjection] Updated profile for Guest ${guestId}`);
  } catch (error) {
    console.error(`[GuestHistoryProjection] Error projecting history for booking ${bookingId}:`, error);
  }
}
