import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface ParsedAgodaReservation {
  messageType: 'OTA_HotelResRQ';
  echoToken?: string;
  resStatus: 'Commit' | 'Modify' | 'Cancel';
  agodaBookingId: string;
  supplierBookingId?: string;
  hotelCode: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  roomTypeCode: string;
  ratePlanCode: string;
  numberOfUnits: number;
  adultCount: number;
  childCount: number;
  guest: {
    givenName: string;
    surname: string;
    email?: string;
    phone?: string;
    countryCode?: string;
  };
  totalAmount: number;
  currencyCode: string;
  paymentCard?: {
    cardCode?: string;
    cardHolderName?: string;
    cardNumber?: string;
    expireDate?: string;
    secureInd?: string;
    effectiveDate?: string;
    isVcc?: boolean;
    currentBalance?: number;
    futureBalance?: number;
    currencyCode?: string;
    expirationDate?: string;
  };
  specialRequests?: string[];
  rawXml: string;
}

export interface ParsedAgodaCancellation {
  messageType: 'OTA_CancelRQ';
  echoToken?: string;
  agodaBookingId: string;
  supplierBookingId?: string;
  rawXml: string;
}

export type ParsedAgodaMessage = ParsedAgodaReservation | ParsedAgodaCancellation;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  trimValues: true,
  isArray: (name) => ['UniqueID', 'RoomStay', 'Rate', 'SpecialRequest', 'Error', 'AvailStatusMessage'].includes(name)
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  suppressEmptyNode: true
});

/**
 * Parses raw OpenTravel XML messages sent by Agoda
 */
export function parseAgodaXml(xmlString: string): ParsedAgodaMessage {
  const parsed = parser.parse(xmlString);

  if (parsed.OTA_HotelResRQ) {
    const root = parsed.OTA_HotelResRQ;
    const echoToken = root['@_EchoToken'];
    const resStatus = root['@_ResStatus'] || 'Commit';

    // Unique IDs (Agoda uses Type="14" or Type="4" for Agoda ID, Type="5" for Supplier ID)
    let agodaBookingId = '';
    let supplierBookingId: string | undefined = undefined;

    const uniqueIds = Array.isArray(root.UniqueID) ? root.UniqueID : root.UniqueID ? [root.UniqueID] : [];
    for (const uid of uniqueIds) {
      const type = String(uid['@_Type']);
      const id = String(uid['@_ID']);
      if (type === '14' || type === '4' || uid['@_ID_Context'] === 'Agoda') {
        agodaBookingId = id;
      } else if (type === '5') {
        supplierBookingId = id;
      }
    }

    if (!agodaBookingId && uniqueIds.length > 0) {
      agodaBookingId = String(uniqueIds[0]['@_ID']);
    }

    // Hotel Reservations
    const hotelRes = root.HotelReservations?.HotelReservation;
    const roomStay = Array.isArray(hotelRes?.RoomStays?.RoomStay) 
      ? hotelRes.RoomStays.RoomStay[0] 
      : hotelRes?.RoomStays?.RoomStay || {};

    const hotelCode = String(
      roomStay.BasicPropertyInfo?.['@_HotelCode'] || 
      hotelRes?.BasicPropertyInfo?.['@_HotelCode'] || 
      root.POS?.Source?.RequestorID?.['@_ID'] || 
      ''
    );

    const timeSpan = roomStay.TimeSpan || {};
    const checkIn = timeSpan['@_Start'] || '';
    const checkOut = timeSpan['@_End'] || '';

    const roomType = roomStay.RoomTypes?.RoomType || {};
    const roomTypeCode = String(roomType['@_RoomTypeCode'] || roomStay['@_RoomTypeCode'] || 'STANDARD');
    const numberOfUnits = Number(roomType['@_NumberOfUnits'] || roomStay['@_NumberOfUnits'] || 1);

    const ratePlan = roomStay.RatePlans?.RatePlan || {};
    const ratePlanCode = String(ratePlan['@_RatePlanCode'] || roomStay['@_RatePlanCode'] || 'BAR');

    // Guest Counts
    let adultCount = 1;
    let childCount = 0;
    const guestCounts = roomStay.GuestCounts?.GuestCount;
    const guestCountArr = Array.isArray(guestCounts) ? guestCounts : guestCounts ? [guestCounts] : [];
    for (const gc of guestCountArr) {
      const ageCode = String(gc['@_AgeQualifyingCode']);
      const count = Number(gc['@_Count'] || 1);
      if (ageCode === '10') {
        adultCount = count;
      } else if (ageCode === '8' || ageCode === '6') {
        childCount += count;
      }
    }

    // Guest details
    const resGuest = Array.isArray(hotelRes?.ResGuests?.ResGuest) 
      ? hotelRes.ResGuests.ResGuest[0] 
      : hotelRes?.ResGuests?.ResGuest || {};
    const profile = resGuest.Profiles?.ProfileInfo?.Profile || {};
    const customer = profile.Customer || {};
    const personName = customer.PersonName || {};
    const givenName = String(personName.GivenName || 'Valued');
    const surname = String(personName.Surname || 'Guest');
    const email = customer.Email ? String(customer.Email['#text'] || customer.Email) : undefined;
    const phone = customer.Telephone ? String(customer.Telephone['@_PhoneNumber'] || customer.Telephone) : undefined;
    const countryCode = customer.CitizenCountryName ? String(customer.CitizenCountryName['@_Code'] || '') : undefined;

    // Monetary Totals
    const total = roomStay.Total || {};
    const totalAmount = Number(total['@_AmountAfterTax'] || total['@_AmountBeforeTax'] || 0);
    const currencyCode = String(total['@_CurrencyCode'] || 'USD');

    // PaymentCard & Virtual Credit Card
    let paymentCard: ParsedAgodaReservation['paymentCard'] = undefined;
    const guarantee = hotelRes?.Services?.Service || hotelRes?.RoomStays?.RoomStay?.Guarantee || hotelRes?.Guarantee;
    const cardNode = guarantee?.GuaranteesAccepted?.GuaranteeAccepted?.PaymentCard || 
                     guarantee?.PaymentCard || 
                     hotelRes?.PaymentCard;

    if (cardNode) {
      const vccNode = cardNode.TPA_Extensions?.VirtualCreditCard;
      const rawCard = cardNode.CardNumber ? (typeof cardNode.CardNumber === 'object' ? cardNode.CardNumber['#text'] : cardNode.CardNumber) : cardNode['@_CardNumber'];
      const rawSec = cardNode.CardNumber?.['@_SecureInd'] || cardNode['@_SecureInd'] || cardNode['@_SeriesCode'];

      paymentCard = {
        cardCode: cardNode['@_CardCode'] ? String(cardNode['@_CardCode']) : undefined,
        cardHolderName: cardNode.CardHolderName ? String(cardNode.CardHolderName) : undefined,
        cardNumber: rawCard !== undefined ? String(rawCard) : undefined,
        expireDate: cardNode.CardNumber?.['@_ExpireDate'] || cardNode['@_ExpireDate'],
        secureInd: rawSec !== undefined ? String(rawSec) : undefined,
        effectiveDate: cardNode['@_EffectiveDate'],
        isVcc: vccNode ? (vccNode['@_IsVCC'] === 'true' || vccNode['@_IsVCC'] === true) : false,
        currentBalance: vccNode ? Number(vccNode['@_CurrentBalance'] || 0) : undefined,
        futureBalance: vccNode ? Number(vccNode['@_FutureBalance'] || 0) : undefined,
        currencyCode: vccNode?.['@_CurrencyCode'],
        expirationDate: vccNode?.['@_ExpirationDate']
      };
    }

    // Special Requests
    const specialRequests: string[] = [];
    const specReqs = hotelRes?.SpecialRequests?.SpecialRequest;
    if (specReqs) {
      const arr = Array.isArray(specReqs) ? specReqs : [specReqs];
      for (const req of arr) {
        const text = typeof req === 'string' ? req : req['#text'] || JSON.stringify(req);
        if (text) specialRequests.push(text);
      }
    }

    return {
      messageType: 'OTA_HotelResRQ',
      echoToken,
      resStatus,
      agodaBookingId,
      supplierBookingId,
      hotelCode,
      checkIn,
      checkOut,
      roomTypeCode,
      ratePlanCode,
      numberOfUnits,
      adultCount,
      childCount,
      guest: {
        givenName,
        surname,
        email,
        phone,
        countryCode
      },
      totalAmount,
      currencyCode,
      paymentCard,
      specialRequests,
      rawXml: xmlString
    };
  }

  if (parsed.OTA_CancelRQ) {
    const root = parsed.OTA_CancelRQ;
    const echoToken = root['@_EchoToken'];

    let agodaBookingId = '';
    let supplierBookingId: string | undefined = undefined;

    const uniqueIds = Array.isArray(root.UniqueID) ? root.UniqueID : root.UniqueID ? [root.UniqueID] : [];
    for (const uid of uniqueIds) {
      const type = String(uid['@_Type']);
      const id = String(uid['@_ID']);
      if (type === '4' || uid['@_ID_Context']?.toLowerCase() === 'agoda') {
        agodaBookingId = id;
      } else if (type === '5') {
        supplierBookingId = id;
      }
    }

    if (!agodaBookingId && uniqueIds.length > 0) {
      agodaBookingId = String(uniqueIds[0]['@_ID']);
    }

    return {
      messageType: 'OTA_CancelRQ',
      echoToken,
      agodaBookingId,
      supplierBookingId,
      rawXml: xmlString
    };
  }

  throw new Error('Unsupported or unrecognizable Agoda OpenTravel XML root element.');
}

/**
 * Builds synchronous OTA_HotelResRS success response to acknowledge reservation push
 */
export function buildHotelResRS(echoToken: string | undefined, agodaBookingId: string, confirmationCode: string): string {
  const timestamp = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResRS xmlns="http://www.opentravel.org/OTA/2003/05"
    ${echoToken ? `EchoToken="${echoToken}"` : ''}
    TimeStamp="${timestamp}"
    Version="1.006">
    <Success />
    <HotelReservations>
        <HotelReservation>
            <UniqueID ID="${agodaBookingId}" Type="14" ID_Context="Agoda" />
            <HotelReservationIDs>
                <HotelReservationID ResID_Type="10" ResID_Value="${confirmationCode}" />
            </HotelReservationIDs>
        </HotelReservation>
    </HotelReservations>
</OTA_HotelResRS>`;
}

/**
 * Builds synchronous OTA_HotelResRS error response
 */
export function buildHotelResErrorRS(echoToken: string | undefined, errorCode: string | number, errorMessage: string): string {
  const timestamp = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResRS xmlns="http://www.opentravel.org/OTA/2003/05"
    ${echoToken ? `EchoToken="${echoToken}"` : ''}
    TimeStamp="${timestamp}"
    Version="1.006">
    <Errors>
        <Error Code="${errorCode}" Type="3" ShortText="${errorMessage}">${errorMessage}</Error>
    </Errors>
</OTA_HotelResRS>`;
}

/**
 * Builds synchronous OTA_CancelRS success response to acknowledge cancellation push
 */
export function buildCancelRS(echoToken: string | undefined, cancellationNumber: string): string {
  const timestamp = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_CancelRS xmlns="http://www.opentravel.org/OTA/2003/05"
    ${echoToken ? `EchoToken="${echoToken}"` : ''}
    TimeStamp="${timestamp}"
    Status="Confirmed"
    Version="0.2">
    <Success />
    <UniqueID ID="${cancellationNumber}" Type="15" />
</OTA_CancelRS>`;
}

/**
 * Builds synchronous OTA_CancelRS error response
 */
export function buildCancelErrorRS(echoToken: string | undefined, errorCode: string | number, errorMessage: string): string {
  const timestamp = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_CancelRS xmlns="http://www.opentravel.org/OTA/2003/05"
    ${echoToken ? `EchoToken="${echoToken}"` : ''}
    TimeStamp="${timestamp}"
    Status="Unsuccessful"
    Version="0.2">
    <Errors>
        <Error Code="${errorCode}" Type="3" ShortText="${errorMessage}">${errorMessage}</Error>
    </Errors>
</OTA_CancelRS>`;
}

/**
 * Builds OTA_HotelAvailNotifRQ for outbound availability and restriction updates
 */
export interface AvailMessageItem {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  invTypeCode: string;
  bookingLimit?: number;
  ratePlanCode?: string;
  isClosed?: boolean;
  cta?: boolean;
  ctd?: boolean;
  minLos?: number;
  maxLos?: number;
}

export function buildAvailNotifRQ(hotelCode: string, items: AvailMessageItem[]): string {
  const timestamp = new Date().toISOString();
  const echoToken = Date.now().toString();

  const messagesXml = items.map(item => {
    let inner = '';
    if (item.bookingLimit !== undefined) {
      // Inventory update
      return `        <AvailStatusMessage BookingLimit="${Math.max(0, item.bookingLimit)}">
            <StatusApplicationControl Start="${item.startDate}" End="${item.endDate}" InvTypeCode="${item.invTypeCode}" />
        </AvailStatusMessage>`;
    }

    let restrictionXml = '';
    if (item.isClosed) {
      restrictionXml += `<RestrictionStatus Status="Close" Restriction="Master" />`;
    } else if (item.isClosed === false) {
      restrictionXml += `<RestrictionStatus Status="Open" Restriction="Master" />`;
    }

    if (item.cta !== undefined) {
      restrictionXml += `<RestrictionStatus Status="${item.cta ? 'Close' : 'Open'}" Restriction="Arrival" />`;
    }
    if (item.ctd !== undefined) {
      restrictionXml += `<RestrictionStatus Status="${item.ctd ? 'Close' : 'Open'}" Restriction="Departure" />`;
    }

    let losXml = '';
    if (item.minLos !== undefined) {
      losXml += item.minLos > 0 
        ? `<LengthOfStay MinMaxMessageType="SetMinLOS" Time="${item.minLos}" />`
        : `<LengthOfStay MinMaxMessageType="RemoveMinLOS" />`;
    }
    if (item.maxLos !== undefined) {
      losXml += item.maxLos > 0
        ? `<LengthOfStay MinMaxMessageType="SetMaxLOS" Time="${item.maxLos}" />`
        : `<LengthOfStay MinMaxMessageType="RemoveMaxLOS" />`;
    }

    return `        <AvailStatusMessage>
            <StatusApplicationControl Start="${item.startDate}" End="${item.endDate}" InvTypeCode="${item.invTypeCode}" ${item.ratePlanCode ? `RatePlanCode="${item.ratePlanCode}"` : ''} />
            ${losXml ? `<LengthsOfStay>${losXml}</LengthsOfStay>` : ''}
            ${restrictionXml}
        </AvailStatusMessage>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelAvailNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="${echoToken}"
    TimeStamp="${timestamp}"
    Target="Production"
    Version="1.006"
    PrimaryLangID="en">
    <AvailStatusMessages HotelCode="${hotelCode}">
${messagesXml}
    </AvailStatusMessages>
</OTA_HotelAvailNotifRQ>`;
}

/**
 * Builds OTA_HotelRateAmountNotifRQ for outbound rate pushes
 */
export interface RateMessageItem {
  startDate: string;
  endDate: string;
  invTypeCode: string;
  ratePlanCode: string;
  currencyCode: string;
  amountAfterTax: number;
  amountBeforeTax?: number;
  extraAdultAmount?: number;
  extraChildAmount?: number;
  mealPlanCode?: number; // 1 All Inclusive, 3 Breakfast, 10 Full Board, 12 Half Board
}

export function buildRateAmountNotifRQ(hotelCode: string, items: RateMessageItem[]): string {
  const timestamp = new Date().toISOString();
  const echoToken = Date.now().toString();

  const messagesXml = items.map(item => {
    let extraGuests = '';
    if (item.extraAdultAmount !== undefined && item.extraAdultAmount > 0) {
      extraGuests += `<AdditionalGuestAmount AgeQualifyingCode="10" Amount="${item.extraAdultAmount.toFixed(2)}" CurrencyCode="${item.currencyCode}" />`;
    }
    if (item.extraChildAmount !== undefined && item.extraChildAmount > 0) {
      extraGuests += `<AdditionalGuestAmount AgeQualifyingCode="8" Amount="${item.extraChildAmount.toFixed(2)}" CurrencyCode="${item.currencyCode}" />`;
    }

    return `        <RateAmountMessage>
            <StatusApplicationControl Start="${item.startDate}" End="${item.endDate}" InvTypeCode="${item.invTypeCode}" RatePlanCode="${item.ratePlanCode}" />
            <Rates>
                <Rate CurrencyCode="${item.currencyCode}">
                    <BaseByGuestAmts>
                        <BaseByGuestAmt NumberOfGuests="2" AmountAfterTax="${item.amountAfterTax.toFixed(2)}" ${item.amountBeforeTax ? `AmountBeforeTax="${item.amountBeforeTax.toFixed(2)}"` : ''} CurrencyCode="${item.currencyCode}" />
                    </BaseByGuestAmts>
                    ${extraGuests ? `<AdditionalGuestAmounts>${extraGuests}</AdditionalGuestAmounts>` : ''}
                    ${item.mealPlanCode ? `<MealsIncluded MealPlanCodes="${item.mealPlanCode}" />` : ''}
                </Rate>
            </Rates>
        </RateAmountMessage>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelRateAmountNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="${echoToken}"
    TimeStamp="${timestamp}"
    Target="Production"
    Version="1.006">
    <RateAmountMessages HotelCode="${hotelCode}">
${messagesXml}
    </RateAmountMessages>
</OTA_HotelRateAmountNotifRQ>`;
}
