-- DropForeignKey
ALTER TABLE "Stay" DROP CONSTRAINT "Stay_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingGuest" DROP CONSTRAINT "BookingGuest_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "RoomAssignment" DROP CONSTRAINT "RoomAssignment_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "StayEvent" DROP CONSTRAINT "StayEvent_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Folio" DROP CONSTRAINT "Folio_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_bookingId_fkey";

-- DropIndex
DROP INDEX "Room_number_key";

-- DropIndex
DROP INDEX "Booking_confirmationCode_key";

-- DropIndex
DROP INDEX "Booking_checkoutRequestId_key";

-- DropIndex
DROP INDEX "Booking_source_otaReference_key";

-- DropIndex
DROP INDEX "Payment_providerId_key";

-- DropIndex
DROP INDEX "User_email_key";

-- CreateIndex
CREATE INDEX "Room_propertyId_idx" ON "Room"("propertyId");

-- CreateIndex
CREATE INDEX "Room_number_idx" ON "Room"("number");

-- CreateIndex
CREATE INDEX "Booking_source_otaReference_idx" ON "Booking"("source", "otaReference");

-- CreateIndex
CREATE INDEX "Booking_confirmationCode_idx" ON "Booking"("confirmationCode");

-- CreateIndex
CREATE INDEX "Booking_checkoutRequestId_idx" ON "Booking"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Payment_providerId_idx" ON "Payment"("providerId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingGuest" ADD CONSTRAINT "BookingGuest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StayEvent" ADD CONSTRAINT "StayEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folio" ADD CONSTRAINT "Folio_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

