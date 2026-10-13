import { AgodaClient } from '@/lib/channel-manager/clients/agoda-client';
import { AgodaAdapter } from '@/lib/channel-manager/adapters/agoda';
import { 
  parseAgodaXml, 
  buildHotelResRS, 
  buildCancelRS, 
  buildAvailNotifRQ, 
  buildRateAmountNotifRQ 
} from '@/lib/channel-manager/serializers/agoda-xml';
import { POST as agodaWebhookPost } from '@/app/api/channels/agoda/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { BookingSource, BookingStatus } from '@prisma/client';

describe('Agoda Direct Supply Channel Manager Integration', () => {
  const mockClientId = 'agoda_test_client_id';
  const mockClientSecret = 'agoda_test_client_secret';
  const mockHotelCode = '61027';

  let testProperty: any;
  let testRoomType: any;
  let testConnection: any;
  let testRoomMapping: any;

  beforeAll(async () => {
    // 1. Setup test property
    testProperty = await prisma.property.findFirst();
    if (!testProperty) {
      testProperty = await prisma.property.create({
        data: {
          name: 'Agoda Direct Supply Test Resort',
          code: `AGD-${Date.now().toString().slice(-4)}`,
          address: 'Galle Road',
          city: 'Colombo',
          country: 'LK',
        }
      });
    }

    // 2. Setup test room type
    testRoomType = await prisma.roomType.findFirst({
      where: { propertyId: testProperty.id }
    });
    if (!testRoomType) {
      testRoomType = await prisma.roomType.create({
        data: {
          name: 'Agoda Grand Deluxe',
          code: `AGD-DLX-${Date.now().toString().slice(-4)}`,
          baseRate: 180.00,
          totalRooms: 10,
          propertyId: testProperty.id
        }
      });
    }

    // 3. Ensure Agoda Provider exists
    let agodaProvider = await prisma.channelProvider.findUnique({
      where: { code: 'AGODA' }
    });
    if (!agodaProvider) {
      agodaProvider = await prisma.channelProvider.create({
        data: { code: 'AGODA', name: 'Agoda' }
      });
    }

    // 4. Setup test connection
    testConnection = await prisma.channelConnection.create({
      data: {
        providerId: agodaProvider.id,
        propertyId: testProperty.id,
        clientId: mockClientId,
        clientSecretEncrypted: mockClientSecret,
        affiliateId: mockHotelCode,
        status: 'HEALTHY',
        environment: 'TEST'
      }
    });

    // 5. Setup test room mapping
    testRoomMapping = await prisma.channelRoomMapping.create({
      data: {
        connectionId: testConnection.id,
        localRoomTypeId: testRoomType.id,
        externalRoomId: 'EXT_AGD_DLX',
        syncAvailability: true
      }
    });
  });

  afterAll(async () => {
    // Clean up created test data
    if (testRoomMapping) {
      await prisma.channelRoomMapping.delete({ where: { id: testRoomMapping.id } }).catch(() => {});
    }
    if (testConnection) {
      await prisma.channelReservation.deleteMany({ where: { connectionId: testConnection.id } }).catch(() => {});
      await prisma.channelSyncEvent.deleteMany({ where: { connectionId: testConnection.id } }).catch(() => {});
      await prisma.channelConnection.delete({ where: { id: testConnection.id } }).catch(() => {});
    }
  });

  // =========================================================================
  // 1. OAUTH 2.0 CLIENT & TOKEN LIFECYCLE TESTS
  // =========================================================================
  describe('AgodaClient OAuth 2.0 & Token Caching', () => {
    it('should exchange credentials and cache token to protect hourly rate limit', async () => {
      const originalFetch = global.fetch;
      let fetchCallCount = 0;

      // Mock Agoda token exchange endpoint
      global.fetch = jest.fn(async (url: any, init: any) => {
        if (String(url).includes('/token-based-authentication/exchange')) {
          fetchCallCount++;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              accessToken: 'mock_jwt_agoda_oauth_token_2025',
              expiresIn: 3600,
              tokenType: 'Bearer'
            })
          } as any;
        }
        return originalFetch(url, init);
      });

      try {
        const client = new AgodaClient({
          clientId: mockClientId,
          clientSecret: mockClientSecret,
          hotelCode: mockHotelCode,
          connectionId: testConnection.id
        });

        // 1st call: Should execute network exchange
        const token1 = await client.getAccessToken();
        expect(token1).toBe('mock_jwt_agoda_oauth_token_2025');
        expect(fetchCallCount).toBe(1);

        // 2nd call: Should return cached token without network request
        const token2 = await client.getAccessToken();
        expect(token2).toBe('mock_jwt_agoda_oauth_token_2025');
        expect(fetchCallCount).toBe(1);

        // Ping check
        const ping = await client.ping();
        expect(ping.healthy).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 2. OPENTRAVEL XML SERIALIZER & PARSER TESTS
  // =========================================================================
  describe('Agoda XML Engine (Serializer & Parser)', () => {
    it('should accurately parse incoming OTA_HotelResRQ with VCC and guest details', () => {
      const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResRQ xmlns="http://www.opentravel.org/OTA/2003/05" EchoToken="test_token_123" ResStatus="Commit" Version="1.006">
    <POS>
        <Source>
            <RequestorID ID="96637800" ID_Context="IATA" Type="18" URL="Agoda.com" />
        </Source>
    </POS>
    <UniqueID ID="987654321" Type="14" ID_Context="Agoda" />
    <HotelReservations>
        <HotelReservation>
            <RoomStays>
                <RoomStay>
                    <RatePlans>
                        <RatePlan RatePlanCode="BB" />
                    </RatePlans>
                    <RoomTypes>
                        <RoomType NumberOfUnits="1" RoomTypeCode="EXT_AGD_DLX" />
                    </RoomTypes>
                    <TimeSpan Start="2026-11-10" End="2026-11-13" />
                    <Total AmountAfterTax="360.00" AmountBeforeTax="300.00" CurrencyCode="USD" />
                    <BasicPropertyInfo HotelCode="61027" />
                    <GuestCounts>
                        <GuestCount AgeQualifyingCode="10" Count="2" />
                    </GuestCounts>
                </RoomStay>
            </RoomStays>
            <ResGuests>
                <ResGuest>
                    <Profiles>
                        <ProfileInfo>
                            <Profile>
                                <Customer>
                                    <PersonName>
                                        <GivenName>James</GivenName>
                                        <Surname>Bond</Surname>
                                    </PersonName>
                                    <Telephone PhoneNumber="+447911123456" />
                                    <Email>james.bond@mi6.gov.uk</Email>
                                </Customer>
                            </Profile>
                        </ProfileInfo>
                    </Profiles>
                </ResGuest>
            </ResGuests>
            <Guarantee>
                <PaymentCard CardCode="VI" EffectiveDate="2026-11-10">
                    <CardHolderName>Agoda Virtual Card</CardHolderName>
                    <CardNumber ExpireDate="11/2026" SecureInd="007">4111111111110007</CardNumber>
                    <TPA_Extensions>
                        <VirtualCreditCard CurrentBalance="360.00" FutureBalance="360.00" CurrencyCode="USD" ExpirationDate="2026-12-10" IsVCC="true" />
                    </TPA_Extensions>
                </PaymentCard>
            </Guarantee>
        </HotelReservation>
    </HotelReservations>
</OTA_HotelResRQ>`;

      const parsed = parseAgodaXml(sampleXml);
      expect(parsed.messageType).toBe('OTA_HotelResRQ');
      if (parsed.messageType === 'OTA_HotelResRQ') {
        expect(parsed.agodaBookingId).toBe('987654321');
        expect(parsed.hotelCode).toBe('61027');
        expect(parsed.checkIn).toBe('2026-11-10');
        expect(parsed.checkOut).toBe('2026-11-13');
        expect(parsed.roomTypeCode).toBe('EXT_AGD_DLX');
        expect(parsed.ratePlanCode).toBe('BB');
        expect(parsed.guest.givenName).toBe('James');
        expect(parsed.guest.surname).toBe('Bond');
        expect(parsed.totalAmount).toBe(360.00);
        expect(parsed.paymentCard).toBeDefined();
        expect(parsed.paymentCard?.isVcc).toBe(true);
        expect(parsed.paymentCard?.cardNumber).toBe('4111111111110007');
        expect(parsed.paymentCard?.secureInd).toBe('007');
      }
    });

    it('should accurately parse OTA_CancelRQ', () => {
      const cancelXml = `<OTA_CancelRQ Version="0.2" TimeStamp="2026-10-14T03:38:57+07:00" xmlns="http://www.opentravel.org/OTA/2003/05">
    <POS>
        <Source>
            <RequestorID ID="96637800" ID_Context="IATA" Type="18" URL="Agoda.com"/>
        </Source>
    </POS>
    <UniqueID ID="987654321" Type="4" ID_Context="Agoda"/>
    <UniqueID ID="AGD-CONFIRM-12" Type="5" ID_Context="DHIL"/>
</OTA_CancelRQ>`;

      const parsed = parseAgodaXml(cancelXml);
      expect(parsed.messageType).toBe('OTA_CancelRQ');
      if (parsed.messageType === 'OTA_CancelRQ') {
        expect(parsed.agodaBookingId).toBe('987654321');
        expect(parsed.supplierBookingId).toBe('AGD-CONFIRM-12');
      }
    });

    it('should build valid OTA_HotelResRS with HotelReservationID', () => {
      const responseXml = buildHotelResRS('echo_123', '987654321', 'AGD-CONF-888');
      expect(responseXml).toContain('<OTA_HotelResRS');
      expect(responseXml).toContain('<Success');
      expect(responseXml).toContain('ResID_Value="AGD-CONF-888"');
      expect(responseXml).toContain('ID="987654321"');
    });

    it('should build valid OTA_CancelRS', () => {
      const cancelRsXml = buildCancelRS('echo_123', 'CANC-987654321');
      expect(cancelRsXml).toContain('<OTA_CancelRS');
      expect(cancelRsXml).toContain('Status="Confirmed"');
      expect(cancelRsXml).toContain('ID="CANC-987654321"');
    });

    it('should build valid OTA_HotelAvailNotifRQ for outbound availability', () => {
      const availXml = buildAvailNotifRQ('61027', [
        { startDate: '2026-11-01', endDate: '2026-11-05', invTypeCode: 'EXT_AGD_DLX', bookingLimit: 7 },
        { startDate: '2026-11-06', endDate: '2026-11-07', invTypeCode: 'EXT_AGD_DLX', isClosed: true, cta: true, minLos: 2 }
      ]);

      expect(availXml).toContain('<OTA_HotelAvailNotifRQ');
      expect(availXml).toContain('HotelCode="61027"');
      expect(availXml).toContain('BookingLimit="7"');
      expect(availXml).toContain('RestrictionStatus Status="Close" Restriction="Master"');
      expect(availXml).toContain('Restriction="Arrival"');
      expect(availXml).toContain('MinMaxMessageType="SetMinLOS" Time="2"');
    });

    it('should build valid OTA_HotelRateAmountNotifRQ for outbound pricing', () => {
      const rateXml = buildRateAmountNotifRQ('61027', [
        {
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          invTypeCode: 'EXT_AGD_DLX',
          ratePlanCode: 'BB',
          currencyCode: 'USD',
          amountAfterTax: 150.00,
          amountBeforeTax: 130.00,
          extraAdultAmount: 30.00,
          mealPlanCode: 3
        }
      ]);

      expect(rateXml).toContain('<OTA_HotelRateAmountNotifRQ');
      expect(rateXml).toContain('AmountAfterTax="150.00"');
      expect(rateXml).toContain('AgeQualifyingCode="10" Amount="30.00"');
      expect(rateXml).toContain('MealPlanCodes="3"');
    });
  });

  // =========================================================================
  // 3. INBOUND PUSH WEBHOOK END-TO-END FLOW (POST /api/channels/agoda)
  // =========================================================================
  describe('Inbound Generic Push Webhook (/api/channels/agoda)', () => {
    const uniqueAgodaBookingId = `AGODA_${Date.now()}`;

    it('should ingest OTA_HotelResRQ, create Booking and Folio, save VCC, and return 200 XML', async () => {
      const reqXml = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResRQ xmlns="http://www.opentravel.org/OTA/2003/05" EchoToken="test_echo_e2e" ResStatus="Commit" Version="1.006">
    <POS>
        <Source>
            <RequestorID ID="96637800" ID_Context="IATA" Type="18" URL="Agoda.com" />
        </Source>
    </POS>
    <UniqueID ID="${uniqueAgodaBookingId}" Type="14" ID_Context="Agoda" />
    <HotelReservations>
        <HotelReservation>
            <RoomStays>
                <RoomStay>
                    <RatePlans>
                        <RatePlan RatePlanCode="BB" />
                    </RatePlans>
                    <RoomTypes>
                        <RoomType NumberOfUnits="1" RoomTypeCode="EXT_AGD_DLX" />
                    </RoomTypes>
                    <TimeSpan Start="2026-12-01" End="2026-12-04" />
                    <Total AmountAfterTax="450.00" CurrencyCode="USD" />
                    <BasicPropertyInfo HotelCode="${mockHotelCode}" />
                    <GuestCounts>
                        <GuestCount AgeQualifyingCode="10" Count="2" />
                    </GuestCounts>
                </RoomStay>
            </RoomStays>
            <ResGuests>
                <ResGuest>
                    <Profiles>
                        <ProfileInfo>
                            <Profile>
                                <Customer>
                                    <PersonName>
                                        <GivenName>Sherlock</GivenName>
                                        <Surname>Holmes</Surname>
                                    </PersonName>
                                    <Telephone PhoneNumber="+442079460912" />
                                    <Email>sherlock.holmes@bakerstreet.co.uk</Email>
                                </Customer>
                            </Profile>
                        </ProfileInfo>
                    </Profiles>
                </ResGuest>
            </ResGuests>
            <Guarantee>
                <PaymentCard CardCode="VI" EffectiveDate="2026-12-01">
                    <CardHolderName>Agoda Virtual Card</CardHolderName>
                    <CardNumber ExpireDate="12/2026" SecureInd="221">4111222233334444</CardNumber>
                    <TPA_Extensions>
                        <VirtualCreditCard CurrentBalance="450.00" FutureBalance="450.00" CurrencyCode="USD" ExpirationDate="2027-01-01" IsVCC="true" />
                    </TPA_Extensions>
                </PaymentCard>
            </Guarantee>
        </HotelReservation>
    </HotelReservations>
</OTA_HotelResRQ>`;

      const req = new NextRequest(`http://localhost:3000/api/channels/agoda?connectionId=${testConnection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: reqXml
      });

      const res = await agodaWebhookPost(req);
      expect(res.status).toBe(200);

      const xmlText = await res.text();
      expect(xmlText).toContain('<OTA_HotelResRS');
      expect(xmlText).toContain('<Success');
      expect(xmlText).toContain(`ID="${uniqueAgodaBookingId}"`);

      // Verify Database state
      const channelRes = await prisma.channelReservation.findUnique({
        where: {
          connectionId_externalReservationId: {
            connectionId: testConnection.id,
            externalReservationId: uniqueAgodaBookingId
          }
        },
        include: { booking: { include: { folios: true } } }
      });

      expect(channelRes).toBeDefined();
      expect(channelRes?.status).toBe('CONFIRMED');
      expect(channelRes?.booking).toBeDefined();
      expect(channelRes?.booking?.source).toBe(BookingSource.AGODA);
      expect(Number(channelRes?.booking?.totalAmount)).toBe(450.00);
      expect(channelRes?.booking?.paymentMethod).toBe('AGODA_VCC');
      expect(channelRes?.booking?.folios.length).toBeGreaterThan(0);

      // Verify VCC was captured in ChannelReservation payload
      const payload = channelRes?.payload as any;
      expect(payload.paymentCard).toBeDefined();
      expect(payload.paymentCard.isVcc).toBe(true);
      expect(payload.paymentCard.cardNumber).toBe('4111222233334444');
      expect(payload.paymentCard.secureInd).toBe('221');
    });

    it('should be strictly idempotent: Re-sending duplicate reservation returns existing confirmation without duplicate records', async () => {
      const duplicateXml = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResRQ xmlns="http://www.opentravel.org/OTA/2003/05" EchoToken="test_echo_duplicate" ResStatus="Commit" Version="1.006">
    <UniqueID ID="${uniqueAgodaBookingId}" Type="14" ID_Context="Agoda" />
</OTA_HotelResRQ>`;

      const req = new NextRequest(`http://localhost:3000/api/channels/agoda?connectionId=${testConnection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: duplicateXml
      });

      const res = await agodaWebhookPost(req);
      expect(res.status).toBe(200);

      const xmlText = await res.text();
      expect(xmlText).toContain('<OTA_HotelResRS');
      expect(xmlText).toContain('<Success');

      // Verify no duplicate bookings were created
      const count = await prisma.channelReservation.count({
        where: {
          connectionId: testConnection.id,
          externalReservationId: uniqueAgodaBookingId
        }
      });
      expect(count).toBe(1);
    });

    it('should handle OTA_CancelRQ: cancels internal booking and releases room assignments', async () => {
      const cancelXml = `<OTA_CancelRQ Version="0.2" TimeStamp="2026-10-14T03:38:57+07:00" xmlns="http://www.opentravel.org/OTA/2003/05">
    <POS>
        <Source>
            <RequestorID ID="96637800" ID_Context="IATA" Type="18" URL="Agoda.com"/>
        </Source>
    </POS>
    <UniqueID ID="${uniqueAgodaBookingId}" Type="4" ID_Context="Agoda"/>
</OTA_CancelRQ>`;

      const req = new NextRequest(`http://localhost:3000/api/channels/agoda?connectionId=${testConnection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: cancelXml
      });

      const res = await agodaWebhookPost(req);
      expect(res.status).toBe(200);

      const xmlText = await res.text();
      expect(xmlText).toContain('<OTA_CancelRS');
      expect(xmlText).toContain('Status="Confirmed"');
      expect(xmlText).toContain(`ID="CANC-AGD-${uniqueAgodaBookingId}"`);

      // Verify Booking status is CANCELLED in DB
      const updatedChannelRes = await prisma.channelReservation.findUnique({
        where: {
          connectionId_externalReservationId: {
            connectionId: testConnection.id,
            externalReservationId: uniqueAgodaBookingId
          }
        },
        include: { booking: { include: { roomAssignments: true } } }
      });

      expect(updatedChannelRes?.status).toBe('CANCELLED');
      expect(updatedChannelRes?.booking?.status).toBe(BookingStatus.CANCELLED);
      // Room assignments should be marked CANCELLED
      for (const ra of updatedChannelRes?.booking?.roomAssignments || []) {
        expect(ra.status).toBe('CANCELLED');
      }
    });

    it('should reject empty or malformed XML with OpenTravel Errors XML', async () => {
      const req = new NextRequest(`http://localhost:3000/api/channels/agoda?connectionId=${testConnection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: ''
      });

      const res = await agodaWebhookPost(req);
      expect(res.status).toBe(400);
      const xmlText = await res.text();
      expect(xmlText).toContain('<Errors>');
      expect(xmlText).toContain('Empty XML payload');
    });
  });

  // =========================================================================
  // 4. AGODA ADAPTER TESTS
  // =========================================================================
  describe('AgodaAdapter Outbound Operations', () => {
    it('should push availability timeline via OTA_HotelAvailNotifRQ', async () => {
      const adapter = new AgodaAdapter();
      const originalFetch = global.fetch;

      let postedXml = '';
      global.fetch = jest.fn(async (url: any, init: any) => {
        if (String(url).includes('/token-based-authentication/exchange')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ accessToken: 'mock_jwt_adapter_token', expiresIn: 3600 })
          } as any;
        }
        if (String(url).includes('/b2b/ota/2013A/hotels')) {
          postedXml = init.body;
          return {
            ok: true,
            status: 200,
            text: async () => `<?xml version="1.0" encoding="UTF-8"?><OTA_HotelAvailNotifRS xmlns="http://www.opentravel.org/OTA/2003/05"><Success/></OTA_HotelAvailNotifRS>`
          } as any;
        }
        return originalFetch(url, init);
      });

      try {
        const timeline = {
          '2026-11-01': 5,
          '2026-11-02': 4,
          '2026-11-03': 6
        };

        const success = await adapter.pushAvailability(testConnection.id, 'EXT_AGD_DLX', timeline);
        expect(success).toBe(true);
        expect(postedXml).toContain('<OTA_HotelAvailNotifRQ');
        expect(postedXml).toContain('InvTypeCode="EXT_AGD_DLX"');
        expect(postedXml).toContain('BookingLimit="5"');
        expect(postedXml).toContain('BookingLimit="4"');
        expect(postedXml).toContain('BookingLimit="6"');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should acknowledge reservations accurately in ChannelReservation', async () => {
      const adapter = new AgodaAdapter();
      const ackSuccess = await adapter.acknowledgeReservation(testConnection.id, 'NON_EXISTENT_DUMMY_ID');
      expect(ackSuccess).toBe(true);
    });
  });
});
