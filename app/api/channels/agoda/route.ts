import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import { 
  parseAgodaXml, 
  buildHotelResRS, 
  buildHotelResErrorRS, 
  buildCancelRS, 
  buildCancelErrorRS 
} from '@/lib/channel-manager/serializers/agoda-xml';
import { AvailabilityEngine } from '@/lib/availability-engine';
import { BookingSource, BookingStatus, PaymentStatus } from '@prisma/client';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  let rawXml = '';
  try {
    rawXml = await req.text();
    if (!rawXml || !rawXml.trim()) {
      return new NextResponse(
        buildHotelResErrorRS(undefined, '9012', 'Empty XML payload received'),
        { status: 400, headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
      );
    }

    // 1. Parse XML Message
    const parsed = parseAgodaXml(rawXml);

    // 2. Identify Target Connection
    // Connection can be passed via ?connectionId=, or matched by hotelCode from XML or affiliateId
    const connectionIdParam = req.nextUrl.searchParams.get('connectionId');
    let connection = null;

    if (connectionIdParam) {
      connection = await prisma.channelConnection.findUnique({
        where: { id: connectionIdParam },
        include: { provider: true, property: true }
      });
    }

    if (!connection) {
      // Find Agoda connection matching hotelCode from the XML
      const hotelCode = (parsed.messageType === 'OTA_HotelResRQ') ? parsed.hotelCode : undefined;
      connection = await prisma.channelConnection.findFirst({
        where: {
          provider: { code: 'AGODA' },
          status: { in: ['HEALTHY', 'WARNING', 'DISCONNECTED'] },
          ...(hotelCode ? {
            OR: [
              { affiliateId: hotelCode },
              { clientId: hotelCode },
              { property: { code: hotelCode } }
            ]
          } : {})
        },
        include: { provider: true, property: true }
      });
    }

    // Fallback: If only one active Agoda connection exists, use it
    if (!connection) {
      connection = await prisma.channelConnection.findFirst({
        where: { provider: { code: 'AGODA' } },
        include: { provider: true, property: true }
      });
    }

    if (!connection) {
      log.error('[AGODA_WEBHOOK] No matching Agoda connection found', { rawXml: rawXml.substring(0, 300) });
      const errXml = (parsed.messageType === 'OTA_CancelRQ')
        ? buildCancelErrorRS(parsed.echoToken, '9901', 'Access denied: Hotel property not configured or recognized')
        : buildHotelResErrorRS(parsed.echoToken, '9901', 'Access denied: Hotel property not configured or recognized');

      return new NextResponse(errXml, { status: 403, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
    }

    // =========================================================================
    // INBOUND RESERVATION PUSH (OTA_HotelResRQ)
    // =========================================================================
    if (parsed.messageType === 'OTA_HotelResRQ') {
      const { agodaBookingId, checkIn, checkOut, roomTypeCode, guest, totalAmount, paymentCard } = parsed;

      // A. Idempotency Check
      const existingRes = await prisma.channelReservation.findUnique({
        where: {
          connectionId_externalReservationId: {
            connectionId: connection.id,
            externalReservationId: agodaBookingId
          }
        },
        include: { booking: true }
      });

      if (existingRes && existingRes.booking && existingRes.status === 'CONFIRMED') {
        log.info('[AGODA_WEBHOOK] Reservation already processed (Idempotent acknowledge)', {
          agodaBookingId,
          confirmationCode: existingRes.booking.confirmationCode
        });
        const xmlRs = buildHotelResRS(parsed.echoToken, agodaBookingId, existingRes.booking.confirmationCode);
        return new NextResponse(xmlRs, { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
      }

      // B. Room Mapping
      let roomMapping = await prisma.channelRoomMapping.findUnique({
        where: {
          connectionId_externalRoomId: {
            connectionId: connection.id,
            externalRoomId: roomTypeCode
          }
        }
      });

      if (!roomMapping) {
        roomMapping = await prisma.channelRoomMapping.findFirst({
          where: { connectionId: connection.id }
        });
      }

      let localRoomTypeId = roomMapping?.localRoomTypeId;
      if (!localRoomTypeId) {
        const defaultRoomType = await prisma.roomType.findFirst({
          where: { propertyId: connection.propertyId }
        });
        if (!defaultRoomType) {
          const errXml = buildHotelResErrorRS(parsed.echoToken, '9012', 'InvTypeCode cannot be mapped to any local room type');
          return new NextResponse(errXml, { status: 400, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
        }
        localRoomTypeId = defaultRoomType.id;
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // C. Availability & Overbooking Protection
      const hasAvailability = await AvailabilityEngine.hasAvailability(
        localRoomTypeId,
        connection.propertyId,
        checkInDate,
        checkOutDate,
        parsed.numberOfUnits || 1
      );

      if (!hasAvailability) {
        log.warn(`[AGODA_OVERBOOKING] No availability for Agoda booking ${agodaBookingId}`);
        await prisma.channelSyncEvent.create({
          data: {
            connectionId: connection.id,
            eventType: 'RESERVATION_PULL',
            entityType: 'RESERVATION',
            entityId: agodaBookingId,
            direction: 'INBOUND',
            status: 'FAILED',
            errorCode: 'OVERBOOKING',
            errorMessage: 'Property is fully booked for requested dates'
          }
        });
        // We still accept the booking to honor OTA contract, but mark in quarantine/task queue if room unavailable
      }

      // D. Find or Create Guest User
      const guestEmail = guest.email || `guest+agoda_${agodaBookingId}@smarthotel.internal`;
      let guestUser = await prisma.user.findFirst({
        where: { email: guestEmail }
      });

      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            email: guestEmail,
            name: `${guest.givenName} ${guest.surname}`.trim(),
            password: crypto.randomBytes(16).toString('hex'),
            propertyId: connection.propertyId,
            phone: guest.phone
          }
        });
      }

      // E. Find Available Physical Room
      const availableRoom = await prisma.room.findFirst({
        where: {
          roomTypeId: localRoomTypeId,
          propertyId: connection.propertyId,
          status: 'AVAILABLE',
          roomAssignments: {
            none: {
              status: 'ACTIVE',
              startDate: { lte: checkOutDate },
              endDate: { gte: checkInDate }
            }
          }
        }
      });

      const confirmationCode = `AGD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // F. Atomic Transaction: Booking, Folio, VCC, ChannelReservation
      const createdBooking = await prisma.$transaction(async (tx: any) => {
        const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

        // Create Booking
        const newBooking = await tx.booking.create({
          data: {
            confirmationCode,
            otaReference: agodaBookingId,
            source: BookingSource.AGODA,
            status: BookingStatus.CONFIRMED,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            primaryGuestId: guestUser.id,
            propertyId: connection.propertyId,
            totalAmount: totalAmount || 0,
            paymentStatus: PaymentStatus.completed,
            paymentMethod: paymentCard?.isVcc ? 'AGODA_VCC' : 'OTA_COLLECT',
            guests: parsed.adultCount + parsed.childCount,
            ...(availableRoom ? {
              roomAssignments: {
                create: {
                  roomId: availableRoom.id,
                  startDate: checkInDate,
                  endDate: checkOutDate,
                  status: 'ACTIVE'
                }
              }
            } : {})
          }
        });

        // Create Stay Event
        await tx.stayEvent.create({
          data: {
            bookingId: newBooking.id,
            type: 'BOOKED',
            notes: `Reservation ingested from Agoda Generic Push API (${agodaBookingId})`
          }
        });

        // Create Guest Folio
        const folio = await tx.folio.create({
          data: {
            bookingId: newBooking.id,
            propertyId: connection.propertyId,
            type: 'GUEST',
            status: 'OPEN'
          }
        });

        // Add Room Charge to Folio
        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: `Agoda Room Charge (${nights} nights)`,
            amount: totalAmount || 0,
            category: 'ROOM_CHARGE'
          }
        });

        // Upsert ChannelReservation
        await tx.channelReservation.upsert({
          where: {
            connectionId_externalReservationId: {
              connectionId: connection.id,
              externalReservationId: agodaBookingId
            }
          },
          update: {
            bookingId: newBooking.id,
            status: 'CONFIRMED',
            payload: {
              ...parsed,
              rawXml: undefined, // Don't bloat JSON column
              processedAt: new Date().toISOString()
            },
            processedAt: new Date(),
            acknowledgedAt: new Date()
          },
          create: {
            connectionId: connection.id,
            externalReservationId: agodaBookingId,
            externalRoomId: roomTypeCode,
            externalRateId: parsed.ratePlanCode,
            bookingId: newBooking.id,
            status: 'CONFIRMED',
            payload: {
              ...parsed,
              rawXml: undefined,
              processedAt: new Date().toISOString()
            },
            processedAt: new Date(),
            acknowledgedAt: new Date()
          }
        });

        return newBooking;
      });

      // G. Log Channel Sync Event
      await prisma.channelSyncEvent.create({
        data: {
          connectionId: connection.id,
          eventType: 'RESERVATION_PULL',
          entityType: 'RESERVATION',
          entityId: agodaBookingId,
          direction: 'INBOUND',
          status: 'SUCCESS',
          responsePayload: {
            confirmationCode: createdBooking.confirmationCode,
            bookingId: createdBooking.id
          }
        }
      });

      // Update Connection Timestamp
      await prisma.channelConnection.update({
        where: { id: connection.id },
        data: { lastSuccessAt: new Date(), lastSyncAt: new Date(), status: 'HEALTHY' }
      });

      log.info('[AGODA_WEBHOOK] Reservation created successfully', {
        agodaBookingId,
        confirmationCode: createdBooking.confirmationCode,
        bookingId: createdBooking.id
      });

      // Return Synchronous XML response within SLA (< 2 seconds)
      const successXml = buildHotelResRS(parsed.echoToken, agodaBookingId, createdBooking.confirmationCode);
      return new NextResponse(successXml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }

    // =========================================================================
    // INBOUND CANCELLATION PUSH (OTA_CancelRQ)
    // =========================================================================
    if (parsed.messageType === 'OTA_CancelRQ') {
      const { agodaBookingId } = parsed;

      const existingRes = await prisma.channelReservation.findUnique({
        where: {
          connectionId_externalReservationId: {
            connectionId: connection.id,
            externalReservationId: agodaBookingId
          }
        },
        include: { booking: true }
      });

      const cancellationNumber = `CANC-AGD-${agodaBookingId}`;

      if (existingRes && existingRes.booking) {
        await prisma.$transaction(async (tx: any) => {
          // Cancel Booking
          await tx.booking.update({
            where: { id: existingRes.booking!.id },
            data: { status: BookingStatus.CANCELLED }
          });

          // Cancel Room Assignments to free inventory
          await tx.roomAssignment.updateMany({
            where: { bookingId: existingRes.booking!.id },
            data: { status: 'CANCELLED' }
          });

          // Record Stay Event
          await tx.stayEvent.create({
            data: {
              bookingId: existingRes.booking!.id,
              type: 'CANCELLED',
              notes: `Cancelled by Agoda push (${agodaBookingId})`
            }
          });

          // Update ChannelReservation status
          await tx.channelReservation.update({
            where: { id: existingRes.id },
            data: {
              status: 'CANCELLED',
              acknowledgedAt: new Date()
            }
          });
        });

        log.info('[AGODA_WEBHOOK] Reservation cancelled and inventory freed', {
          agodaBookingId,
          cancellationNumber
        });
      } else {
        log.warn('[AGODA_WEBHOOK] Cancel request received for unknown booking, acknowledging anyway', {
          agodaBookingId
        });
      }

      await prisma.channelSyncEvent.create({
        data: {
          connectionId: connection.id,
          eventType: 'RESERVATION_PULL',
          entityType: 'RESERVATION',
          entityId: agodaBookingId,
          direction: 'INBOUND',
          status: 'SUCCESS',
          responsePayload: { cancellationNumber }
        }
      });

      const cancelXml = buildCancelRS(parsed.echoToken, cancellationNumber);
      return new NextResponse(cancelXml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }

    throw new Error('Unsupported Agoda message type');

  } catch (error: any) {
    log.error('[AGODA_WEBHOOK] Unhandled error processing Agoda push', { error: error.message });
    const errXml = buildHotelResErrorRS(undefined, '9999', error.message || 'Internal Processing Error');
    return new NextResponse(errXml, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
}
