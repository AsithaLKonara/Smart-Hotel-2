import prisma from '@/lib/db';
import { BookingStatus, RoomStatus } from '@prisma/client';
import { StayExtraService } from './stay-extra-service';

export interface ExtraSelectionItem {
  id?: string;
  code?: string;
  name?: string;
  price?: number;
  priceType?: string;
}

export interface QuoteResult {
  nights: number;
  roomBaseRate: number;
  roomSubtotal: number;
  itemizedExtras: Array<{
    code: string;
    name: string;
    amount: number;
    category: string;
  }>;
  extrasSubtotal: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CreateReservationInput {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  specialRequests?: string;
  paymentMethod?: 'pay_now' | 'pay_later' | string;
  extras?: Record<string, boolean> | string[] | ExtraSelectionItem[];
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  userId?: string;
  source?: string;
}

export class BookingService {
  /**
   * Authoritative server-side pricing calculator for reservations.
   * Resolves dynamic Stay Extra Services from database while remaining backwards-compatible
   * with legacy boolean flags.
   */
  static async calculateReservationQuote(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    extrasInput: Record<string, boolean> | string[] | ExtraSelectionItem[] = {}
  ): Promise<QuoteResult> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { roomType: true }
    });

    if (!room) throw new Error('ROOM_NOT_FOUND');

    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const roomBaseRate = Number(room.roomType.baseRate);
    const roomSubtotal = roomBaseRate * nights;

    // Fetch active extra services from database
    const dbExtras = await StayExtraService.getExtraServices({ propertyId: room.propertyId, activeOnly: true });
    const itemizedExtras: QuoteResult['itemizedExtras'] = [];

    // Parse extras input (handles legacy object format or ID array)
    if (Array.isArray(extrasInput)) {
      for (const item of extrasInput) {
        const extraIdOrCode = typeof item === 'string' ? item : (item.id || item.code);
        const matched = dbExtras.find((e: any) => e.id === extraIdOrCode || e.code.toLowerCase() === (extraIdOrCode || '').toLowerCase());
        if (matched) {
          const unitPrice = Number(matched.price);
          const amount = matched.priceType === 'PER_NIGHT' ? unitPrice * nights : unitPrice;
          itemizedExtras.push({
            code: matched.code,
            name: matched.name,
            amount,
            category: matched.code.includes('BREAKFAST') ? 'FOOD' : matched.code.includes('SHUTTLE') ? 'TRANSPORT' : 'SERVICE'
          });
        }
      }
    } else if (typeof extrasInput === 'object' && extrasInput !== null) {
      for (const [key, isSelected] of Object.entries(extrasInput)) {
        if (!isSelected) continue;

        // Match against DB extras
        const matched = dbExtras.find((e: any) => 
          e.id === key || 
          e.code.toLowerCase() === key.toLowerCase() ||
          e.code.toLowerCase().replace('_', '') === key.toLowerCase()
        );

        if (matched) {
          const unitPrice = Number(matched.price);
          const amount = matched.priceType === 'PER_NIGHT' ? unitPrice * nights : unitPrice;
          itemizedExtras.push({
            code: matched.code,
            name: matched.name,
            amount,
            category: matched.code.includes('BREAKFAST') ? 'FOOD' : matched.code.includes('SHUTTLE') ? 'TRANSPORT' : 'SERVICE'
          });
        } else {
          // Legacy hardcoded fallback if not yet synced in DB
          if (key === 'breakfast') itemizedExtras.push({ code: 'BREAKFAST', name: 'Artisan Breakfast', amount: 25 * nights, category: 'FOOD' });
          if (key === 'lateCheckout') itemizedExtras.push({ code: 'LATE_CHECKOUT', name: 'Late Checkout', amount: 50, category: 'SERVICE' });
          if (key === 'airportShuttle') itemizedExtras.push({ code: 'AIRPORT_SHUTTLE', name: 'Airport Transfer', amount: 75, category: 'TRANSPORT' });
          if (key === 'spaAccess') itemizedExtras.push({ code: 'SPA_ACCESS', name: 'Spa Access Pass', amount: 100, category: 'SERVICE' });
        }
      }
    }

    const extrasSubtotal = itemizedExtras.reduce((sum, item) => sum + item.amount, 0);
    const subtotal = roomSubtotal + extrasSubtotal;
    const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    return {
      nights,
      roomBaseRate,
      roomSubtotal,
      itemizedExtras,
      extrasSubtotal,
      subtotal,
      taxAmount,
      totalAmount
    };
  }

  /**
   * Atomic Reservation Engine.
   * Acquires row-level pessimistic locks, validates room collisions, creates or links the guest user,
   * generates confirmation code, creates booking, registers room assignment, and initializes folio.
   */
  static async createReservation(input: CreateReservationInput) {
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      specialRequests,
      paymentMethod = 'pay_later',
      extras = {},
      guestEmail,
      guestName,
      userId,
      source = 'WEBSITE'
    } = input;

    return await prisma.$transaction(async (tx: any) => {
      // 1. Acquire Row-Level Lock immediately to prevent concurrent double-booking
      await tx.$executeRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;

      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { roomType: true }
      });

      if (!room || room.status === 'MAINTENANCE' || room.status === 'OUT_OF_ORDER') {
        throw new Error('ROOM_UNAVAILABLE');
      }

      // 2. Validate booking date conflicts
      const conflict = await tx.booking.findFirst({
        where: {
          roomAssignments: { some: { roomId } },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          NOT: { status: 'CANCELLED' },
          OR: [
            { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }
          ]
        }
      });

      if (conflict) {
        throw new Error('DOUBLE_BOOKING');
      }

      // 3. User / Guest Association
      let primaryGuestId = userId;

      if (!primaryGuestId && guestEmail) {
        const existing = await tx.user.findFirst({
          where: { email: guestEmail, propertyId: room.propertyId, deletedAt: null }
        });

        if (existing) {
          primaryGuestId = existing.id;
        } else {
          const guestRole = await tx.role.findUnique({ where: { name: 'GUEST' } });
          const newUser = await tx.user.create({
            data: {
              email: guestEmail,
              name: guestName || 'Guest',
              password: '',
              roleId: guestRole?.id,
              propertyId: room.propertyId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          primaryGuestId = newUser.id;
        }
      }

      if (!primaryGuestId) {
        throw new Error('GUEST_DATA_REQUIRED');
      }

      // 4. Calculate Server-Authoritative Pricing Quote
      const quote = await BookingService.calculateReservationQuote(roomId, checkIn, checkOut, extras);

      // 5. Generate confirmation code
      const confirmationCode = 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // 6. Create Booking Record
      const booking = await tx.booking.create({
        data: {
          primaryGuestId,
          checkIn,
          checkOut,
          guests,
          totalAmount: quote.totalAmount,
          status: 'CONFIRMED',
          paymentStatus: paymentMethod === 'pay_now' ? 'pending' : 'unpaid',
          paymentMethod: paymentMethod === 'pay_now' ? 'card' : 'cash',
          paymentProvider: paymentMethod === 'pay_now' ? 'STRIPE' : 'OFFLINE',
          confirmationCode,
          propertyId: room.propertyId,
          source,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          roomAssignments: { include: { room: { include: { roomType: true } } } },
          guest: true
        }
      });

      // 7. Create Room Assignment
      await tx.roomAssignment.create({
        data: {
          bookingId: booking.id,
          roomId: room.id,
          startDate: checkIn,
          endDate: checkOut,
          status: 'ACTIVE'
        }
      });

      // 8. Create Stay Event
      await tx.stayEvent.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKED',
          notes: `Reservation created via ${source}. Special requests: ${specialRequests || 'None'}`
        }
      });

      // 9. Create Guest Folio
      const folio = await tx.folio.create({
        data: {
          bookingId: booking.id,
          propertyId: room.propertyId,
          type: 'GUEST',
          status: 'OPEN'
        }
      });

      // 10. Add Folio Line Items for Itemized Extra Services
      if (quote.itemizedExtras.length > 0) {
        await tx.folioLineItem.createMany({
          data: quote.itemizedExtras.map(item => ({
            folioId: folio.id,
            description: `${item.name} (${item.code})`,
            amount: item.amount,
            category: item.category
          }))
        });
      }

      return {
        booking,
        folioId: folio.id,
        quote
      };
    }, {
      maxWait: 10000,
      timeout: 30000,
      isolationLevel: 'Serializable'
    });
  }

  /**
   * Fetch complete Booking Dossier for the front desk / admin details view.
   */
  static async getBookingDetailsDossier(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: { select: { name: true } }
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            country: true,
            phone: true,
            email: true,
            address: true
          }
        },
        roomAssignments: {
          include: {
            room: {
              include: {
                roomType: true,
                roomImages: { take: 3 }
              }
            }
          }
        },
        folios: {
          include: {
            lineItems: { orderBy: { createdAt: 'desc' } }
          }
        },
        stayEvents: {
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Optimistic Concurrency Control (OCC) status updates with double-booking safety
   */
  static async updateBookingWithOCC(
    id: string,
    expectedVersion: number,
    data: { status?: BookingStatus; paymentStatus?: any }
  ) {
    return await prisma.$transaction(async (tx: any) => {
      const current = await tx.booking.findUnique({ where: { id } });
      if (!current) throw new Error('Booking not found');

      if (current.version !== expectedVersion) {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
      }

      if (data.status && data.status !== current.status) {
        if (data.status === 'CHECKED_IN') {
          const assignment = await tx.roomAssignment.findFirst({
            where: { bookingId: id, status: 'ACTIVE' }
          });
          const targetRoomId = assignment?.roomId || current.roomId;
          if (targetRoomId) {
            const room = await tx.room.findUnique({ where: { id: targetRoomId } });
            if (!room || room.status !== 'AVAILABLE') {
              throw new Error(`Room is currently ${room?.status}. Cannot check-in.`);
            }
            await tx.room.update({
              where: { id: targetRoomId },
              data: { status: 'OCCUPIED', version: room.version + 1 }
            });
          }
        }
      }

      return await tx.booking.update({
        where: { id },
        data: {
          ...data,
          version: expectedVersion + 1,
        },
      });
    }, {
      isolationLevel: 'Serializable'
    });
  }
}
