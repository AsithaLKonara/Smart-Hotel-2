import { StayService } from '../../../../lib/services/StayService';
import { prisma } from '../../../../lib/prisma';

// Mock Prisma
jest.mock('../../../../lib/prisma', () => {
  return {
    __esModule: true,
    prisma: {
      $transaction: jest.fn(async (callback) => {
        return callback(prisma);
      }),
      booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      room: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stay: {
        create: jest.fn(),
      },
      roomAssignment: {
        updateMany: jest.fn(),
      }
    }
  };
});

describe('StayService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should create stay, update statuses, and sync room assignment', async () => {
      const mockBookingId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const mockRoomId = 'c90c749a-0e6d-47fb-9fc5-2c81358c2f1e';
      
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: mockBookingId,
        status: 'CONFIRMED',
        stay: null,
      });

      (prisma.room.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoomId,
        status: 'AVAILABLE',
      });

      (prisma.stay.create as jest.Mock).mockResolvedValue({
        id: 'stay-123',
        bookingId: mockBookingId,
        roomId: mockRoomId,
        status: 'CHECKED_IN',
      });

      const result = await StayService.checkIn({
        bookingId: mockBookingId,
        roomId: mockRoomId,
      });

      expect(result.id).toBe('stay-123');
      
      // Verify RoomAssignment sync
      expect(prisma.roomAssignment.updateMany).toHaveBeenCalledWith({
        where: {
          bookingId: mockBookingId,
          status: 'ACTIVE'
        },
        data: {
          roomId: mockRoomId
        }
      });

      // Verify Status updates
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: mockBookingId },
        data: { status: 'CHECKED_IN' }
      });

      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: mockRoomId },
        data: { status: 'OCCUPIED' }
      });
    });
  });
});
