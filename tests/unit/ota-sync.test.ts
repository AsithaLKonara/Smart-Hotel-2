import { pushAvailabilityToOTA } from '../../lib/ota/ota-service';
import { prisma } from '../../lib/db';

// Mock prisma and logger
jest.mock('../../lib/db', () => ({
  prisma: {
    roomMapping: {
      findFirst: jest.fn(),
    },
    channelConfig: {
      findFirst: jest.fn(),
    },
    syncLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../lib/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('OTA Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should push availability successfully when config and mapping exist', async () => {
    const mockMapping = { otaRoomTypeId: 'ota-room-123', localRoomTypeId: 'local-1' };
    const mockConfig = { apiKey: 'key-123', propertyId: 'prop-1', provider: 'CHANNEX', isEnabled: true };
    
    (prisma.roomMapping.findFirst as jest.Mock).mockResolvedValue(mockMapping);
    (prisma.channelConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const update = {
      roomTypeId: 'local-1',
      date: '2026-05-12',
      availability: 5,
    };

    await pushAvailabilityToOTA(update);

    // Verify fetch call
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.channex.io/v1/availability',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'user-api-key': 'key-123',
        }),
        body: JSON.stringify({
          values: [{
            property_id: 'prop-1',
            room_type_id: 'ota-room-123',
            date: '2026-05-12',
            availability: 4,
          }]
        }),
      })
    );

    // Verify sync log creation
    expect(prisma.syncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          direction: 'PUSH',
          status: 'SUCCESS',
        }),
      })
    );
  });

  it('should log failure when OTA API returns error', async () => {
    const mockMapping = { otaRoomTypeId: 'ota-room-123', localRoomTypeId: 'local-1' };
    const mockConfig = { apiKey: 'key-123', propertyId: 'prop-1', provider: 'CHANNEX', isEnabled: true };
    
    (prisma.roomMapping.findFirst as jest.Mock).mockResolvedValue(mockMapping);
    (prisma.channelConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Invalid API Key' }),
    });

    const update = {
      roomTypeId: 'local-1',
      date: '2026-05-12',
      availability: 5,
    };

    await expect(pushAvailabilityToOTA(update)).rejects.toThrow();

    // Verify sync log creation with FAILED status
    expect(prisma.syncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          direction: 'PUSH',
          status: 'FAILED',
        }),
      })
    );
  });
});
