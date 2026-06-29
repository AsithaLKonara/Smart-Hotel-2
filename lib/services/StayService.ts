import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const CheckInSchema = z.object({
  bookingId: z.string().uuid(),
  roomId: z.string().uuid(),
  userId: z.string().uuid().optional(),
});

export type CheckInDTO = z.infer<typeof CheckInSchema>;

export class StayService {
  /**
   * Completes a check-in by assigning a physical room, creating a Stay record,
   * and updating the booking and room statuses in a single transaction.
   */
  static async checkIn(data: CheckInDTO) {
    const validatedData = CheckInSchema.parse(data);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Verify Booking exists and is ready for check-in
      const booking = await tx.booking.findUnique({
        where: { id: validatedData.bookingId },
        include: { stay: true },
      });

      if (!booking) throw new Error("Booking not found");
      if (booking.status !== "CONFIRMED") throw new Error(`Booking is ${booking.status}, cannot check in.`);
      if (booking.stay) throw new Error("Stay already exists for this booking.");

      // 2. Verify Room is available and clean
      const room = await tx.room.findUnique({
        where: { id: validatedData.roomId },
      });

      if (!room) throw new Error("Room not found");
      if (room.status !== "AVAILABLE") {
         throw new Error("Room is not available for check-in.");
      }

      // 3. Create Stay record
      const stay = await tx.stay.create({
        data: {
          bookingId: booking.id,
          roomId: room.id,
          status: "CHECKED_IN",
          checkInTime: new Date(),
        },
      });

      // 4. Update Booking Status
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CHECKED_IN" },
      });

      // 5. Update Room Status
      await tx.room.update({
        where: { id: room.id },
        data: { status: "OCCUPIED" },
      });

      return stay;
    });
  }
}
