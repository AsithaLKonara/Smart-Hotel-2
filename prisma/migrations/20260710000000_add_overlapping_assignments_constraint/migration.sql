-- Add btree_gist extension required for GIST exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent double-bookings on the same physical room for overlapping dates
ALTER TABLE "RoomAssignment"
ADD CONSTRAINT "RoomAssignment_no_overlap_excl" EXCLUDE USING gist (
  "roomId" WITH =,
  daterange("startDate", "endDate", '[)') WITH &&
)
WHERE (status = 'ACTIVE');
