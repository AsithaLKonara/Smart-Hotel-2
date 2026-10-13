# Agoda Direct Supply Channel Manager Integration — End-to-End Audit & Gap Report

> **Auditor:** Senior Product & Principal Channel Integration Engineer  
> **Target:** SmartHotel-2 PMS Channel Manager Core & Agoda Connectivity  
> **Benchmark:** [Agoda API Documentation](./Agoda%20API%20Doc.md)  
> **Status:** AUDIT COMPLETE — DO NOT EXECUTE (READ-ONLY REPORT)  

---

## Executive Summary

An exhaustive end-to-end audit was conducted comparing the SmartHotel-2 codebase against the official **Agoda Direct Supply API Specification** documented in [Agoda API Doc.md](./Agoda%20API%20Doc.md).

While the system has established an extensible `ChannelManagerCore` architecture (supporting BullMQ queues, `ChannelConnection`, `ChannelRoomMapping`, and a functional `BookingComAdapter`), **Agoda integration is currently non-existent beyond UI dropdown labels and placeholder config references**.

If a hotel operator attempts to connect Agoda in the admin dashboard today:
1. **Connectivity will fail immediately**: There is no `AgodaAdapter` or `AgodaClient` implemented.
2. **Inbound reservations will fail & time out**: Agoda uses a synchronous two-way XML Push model (`OTA_HotelResRQ`), but our webhook route expects JSON with an HMAC signature (`x-ota-signature`) and responds with asynchronous HTTP 202 JSON. Agoda will flag this as a critical failure within 10 seconds.
3. **Outbound ARI pushes will crash**: `outboundWorker` throws `No adapter for provider: AGODA`, while the fallback `ota-service.ts` emits a mock JSON payload without transmitting XML to Agoda.
4. **VCC cards will be lost**: Guest payments with Agoda Virtual Credit Cards cannot be parsed or stored, leading to unchargeable rooms.

### Audit Scorecard by Layer

| Layer | Coverage | Status | Critical Gaps |
| :--- | :---: | :---: | :--- |
| **1. Authentication & Token Lifecycle** | 10% | 🔴 Broken / Stub | Static `AGODA_API_KEY` in env; missing OAuth 2.0 Token Exchange (`/token-based-authentication/exchange`) & token caching |
| **2. Inbound Reservation Ingestion** | 0% | 🔴 Missing | No `OTA_HotelResRQ` XML parser; no synchronous `OTA_HotelResRS` confirmation response |
| **3. Inbound Cancellation Handling** | 0% | 🔴 Missing | No `OTA_CancelRQ` endpoint, no room inventory release on cancellation, no `OTA_CancelRS` |
| **4. Outbound Availability Push** | 10% | 🔴 Broken | No `OTA_HotelAvailNotifRQ` XML generator; no batch timeline push; worker crashes on `AGODA` code |
| **5. Outbound Rate & Restriction Push** | 0% | 🔴 Missing | No `OTA_HotelRateAmountNotifRQ` or `OTA_HotelBookingRuleNotifRQ` generator; rates and MinLOS never pushed |
| **6. Virtual Credit Card (VCC) Handling** | 0% | 🔴 Missing | `PaymentCard` and `TPA_Extensions/VirtualCreditCard` ignored; frontdesk cannot see activation dates or balances |
| **7. Admin UI & Property Mapping** | 35% | 🟡 Inconsistent | UI has 'AGODA' option, but form labels ask for irrelevant `affiliateId` instead of Agoda `HotelCode`; connection test never runs |
| **8. Database Schema & Security** | 60% | 🟡 Incomplete | Schema supports OAuth tokens, but lacks fields for Agoda `HotelCode`, VCC secure vaulting, and XML payload audits |

---

## Flow-by-Flow Gap Analysis

### Flow 1: Agoda Channel Connection & Modern OAuth 2.0 Authorization
* **Official Spec:** 
  - Token Exchange Endpoint: `POST https://supply.agoda.com/token-based-authentication/exchange`
  - Body: `{"clientId": "...", "clientSecret": "..."}`
  - Output: Bearer JWT (`accessToken`, `expiresIn: 3600`)
  - Rate Limits: 100 attempts/hr per Client ID; 220 attempts/hr per IP. IP whitelisting enforced via YCS IAM.
* **Current Implementation:**
  - `lib/env.ts` has `AGODA_API_KEY: z.string().optional()`.
  - `app/api/admin/integrations/channel-manager/route.ts` registers connection in `ChannelConnection`, but only tests connection if `providerCode === 'BOOKING_COM'`.
  - No client or token exchange logic exists to call Agoda's auth server or handle token expiration.
* **Gaps:**
  - **[Missing]** No `AgodaAuthService` or client method to exchange credentials for JWT.
  - **[Broken]** The UI and route store static plaintext secrets without token lifecycle management.
  - **[Security]** Rate limit threshold (100 req/hr) is not respected; without token caching in Redis, concurrent jobs would trigger Agoda 429 throttling and account lockouts.

---

### Flow 2: Inbound Reservation Push Ingestion (`OTA_HotelResRQ` $\rightarrow$ `OTA_HotelResRS`)
* **Official Spec:**
  - Agoda pushes an XML document (`OTA_HotelResRQ`) with Agoda IATA `96637800`, Agoda Booking ID (`UniqueID Type="14"`), Guest Profile, Room Stay, and Rate breakdowns.
  - Partner PMS must parse XML, check idempotency, create internal booking, and return **synchronous XML response** (`OTA_HotelResRS`) with `HotelReservationID ResID_Type="10"` within **10 seconds**.
* **Current Implementation:**
  - `app/api/channels/webhook/route.ts`:
    - Rejects any request missing `x-ota-signature` header (HMAC SHA-256). Agoda **never** sends this header; Agoda uses Bearer token or HTTP Basic Auth.
    - Responds with `202 Accepted` JSON (`{"success": true, "message": "Webhook queued"}`).
  - `app/api/integrations/channel-manager/route.ts`:
    - Also responds with `202 Accepted` JSON.
  - `lib/channel-manager/workers.ts`:
    - `ingestReservation()` assumes `payload` is already JSON (`res.reservation_id`, `res.checkin`, etc.).
* **Gaps:**
  - **[Broken / Critical]** Webhook route fails Agoda calls with `401 Unauthorized` due to missing `x-ota-signature`.
  - **[Broken / Critical]** Returning JSON to Agoda violates the OpenTravel contract; Agoda treats non-XML responses as delivery failures and halts distribution.
  - **[Missing]** No XML parser (`fast-xml-parser`) to extract guest data, stay dates, amounts, and room codes from `OTA_HotelResRQ`.
  - **[Missing]** No synchronous XML serializer to generate `OTA_HotelResRS` within the required 10-second window.

---

### Flow 3: Inbound Booking Cancellation (`OTA_CancelRQ` $\rightarrow$ `OTA_CancelRS`)
* **Official Spec:**
  - Agoda pushes `OTA_CancelRQ` containing Agoda Booking ID (`UniqueID Type="4"`) and PMS ID (`UniqueID Type="5"`).
  - Partner PMS cancels the reservation, releases allotment, and synchronously replies with `OTA_CancelRS` containing cancellation reference (`UniqueID Type="15"`).
* **Current Implementation:**
  - Neither `app/api/channels/webhook/route.ts` nor `workers.ts` has any concept of `OTA_CancelRQ`.
  - The worker only checks `operation === 'RESERVATION_PULL'` or `operation === 'WEBHOOK_PUSH'` with new booking creation logic.
* **Gaps:**
  - **[Missing / Critical]** Agoda cancellations are dropped entirely. Cancelled rooms remain marked as occupied in PMS, causing false inventory depletion and revenue loss.
  - **[Missing]** No `OTA_CancelRS` response generator.

---

### Flow 4: Outbound Availability & Inventory Push (`OTA_HotelAvailNotifRQ`)
* **Official Spec:**
  - Endpoint: `http://supplyota.agoda.com/b2b/ota/2013A/hotels` (or `2015B`).
  - Method: HTTP POST with `Authorization: Bearer <TOKEN>`.
  - Schema: `OTA_HotelAvailNotifRQ` containing `AvailStatusMessages` per `HotelCode`.
  - Elements:
    - Inventory update: `AvailStatusMessage BookingLimit="N"`
    - Close for sale: `RestrictionStatus Status="Close" Restriction="Master"`
    - CTA / CTD: `Restriction="Arrival" Status="Close"` / `Restriction="Departure" Status="Close"`
    - MinLOS / MaxLOS: `LengthOfStay MinMaxMessageType="SetMinLOS" Time="N"`
* **Current Implementation:**
  - `outboundWorker` in `lib/channel-manager/workers.ts` retrieves `adapters[connection.provider.code]`. Because `adapters['AGODA']` is undefined, the worker crashes with:
    `throw new Error("No adapter for provider: AGODA")`.
  - Fallback service `lib/ota/ota-service.ts` generates a mock JSON object (`{ values: [{ property_id, room_type_id, availability }] }`) and logs success to `ChannelSyncEvent` without making an external network request.
  - `app/api/bookings/route.ts` only triggers `pushAvailabilityToOTA` for the single `checkIn` date (`split('T')[0]`), omitting the remaining stay nights and the required 365-day inventory horizon.
* **Gaps:**
  - **[Broken / Critical]** Outbound inventory sync fails with worker exceptions.
  - **[Missing]** No XML builder for `OTA_HotelAvailNotifRQ`.
  - **[Broken]** Only single check-in day is calculated instead of the complete booking date span.

---

### Flow 5: Outbound Rate & Pricing Push (`OTA_HotelRateAmountNotifRQ`)
* **Official Spec:**
  - Schema: `OTA_HotelRateAmountNotifRQ` under `RateAmountMessages/RateAmountMessage`.
  - Supports `BaseByGuestAmts` (`AmountAfterTax`, `AmountBeforeTax`, `CurrencyCode`), extra guest supplements (`AdditionalGuestAmount AgeQualifyingCode="10|8|6"`), and meal plan inclusions (`MealsIncluded MealPlanCodes="3"`).
* **Current Implementation:**
  - The codebase has zero implementation of rate push for Agoda.
  - `ChannelConnector.pushRates()` is defined in `connector.ts`, but no worker dispatches it, and no Agoda rate XML generator exists.
* **Gaps:**
  - **[Missing / High]** PMS rate updates never reach Agoda. Room rates on Agoda become stale or desynchronized with PMS master rates.

---

### Flow 6: Agoda Virtual Credit Card (VCC) Handling
* **Official Spec:**
  - Prepaid bookings contain `<PaymentCard CardCode="..." EffectiveDate="...">` with `<TPA_Extensions><VirtualCreditCard CurrentBalance="..." FutureBalance="..." CurrencyCode="..." ExpirationDate="..." IsVCC="true"/></TPA_Extensions>`.
  - Card number, expiration date, and CVC (`SecureInd`) must be securely handled.
  - Card cannot be charged before `EffectiveDate`. Initial pre-auth balance may be $1.00 until the effective date.
* **Current Implementation:**
  - `workers.ts` simply hardcodes:
    ```ts
    paymentStatus: PaymentStatus.completed,
    paymentMethod: 'OTA_COLLECT',
    ```
  - It does not extract or persist the VCC number, expiry date, CVV, currency, or `EffectiveDate`.
* **Gaps:**
  - **[Missing / Critical]** Hoteliers cannot view or charge Agoda Virtual Credit Cards. Front desk cannot verify guest payment on arrival, leading to payment disputes and uncollected revenue.

---

### Flow 7: Booking Rules & Restriction Management (`OTA_HotelBookingRuleNotifRQ`)
* **Official Spec:**
  - Supports relative restrictions: `MinAdvancedBookingOffset="P3D"`, `MaxAdvancedBookingOffset="P365D"`.
  - Supports absolute cutoffs: `AbsoluteCutoff="YYYY-MM-DD"`, `AbsoluteDropTime="YYYY-MM-DD"`.
* **Current Implementation:**
  - Not implemented anywhere in the repository.
* **Gaps:**
  - **[Missing / Medium]** Early-bird or advance purchase rate rules defined in PMS cannot be enforced on Agoda.

---

### Flow 8: Error Handling, Logging & Code Lists
* **Official Spec:**
  - Agoda defines strict business validation codes:
    - `9001`: Message Timestamp older than 10 minutes (clock drift).
    - `9004`: `StartDate` > `EndDate`.
    - `9012` / `9013`: Missing `InvTypeCode` or `RatePlanCode`.
    - `9901`: Access denied / IP not whitelisted.
* **Current Implementation:**
  - Logs are saved as generic error strings in `ChannelSyncEvent`.
  - No error code parser or alerting exists to distinguish between recoverable credential expiration and critical IP whitelist blocks (`9901`).
* **Gaps:**
  - **[Missing / Medium]** Channel manager health status never alerts staff if Agoda rejects pushes due to IP whitelisting or clock drift.

---

## Detailed Ticket-Ready Findings List

```json
[
  {
    "id": "AGODA-001",
    "flow": "Authentication & Authorization",
    "layer": "Integration / Backend",
    "type": "Missing",
    "severity": "Critical",
    "effort": "M",
    "title": "Missing Agoda OAuth 2.0 Token Exchange Service",
    "description": "The system lacks an OAuth 2.0 client to call POST https://supply.agoda.com/token-based-authentication/exchange. Currently only a static AGODA_API_KEY environment variable is defined.",
    "fixPlan": "Create AgodaDemandClient / AgodaAuthService with 55-minute in-memory/Redis token caching, rate-limit protection, and automatic renewal."
  },
  {
    "id": "AGODA-002",
    "flow": "Channel Connector Architecture",
    "layer": "Backend",
    "type": "Missing",
    "severity": "Critical",
    "effort": "L",
    "title": "Missing AgodaAdapter implementing ChannelConnector",
    "description": "lib/channel-manager/adapters/agoda.ts does not exist. lib/channel-manager/workers.ts only registers BOOKING_COM in the adapters dictionary, causing any Agoda sync job to throw 'No adapter for provider: AGODA'.",
    "fixPlan": "Implement AgodaAdapter adhering to ChannelConnector interface and register it in workers.ts."
  },
  {
    "id": "AGODA-003",
    "flow": "Inbound Push Booking",
    "layer": "API / Webhook",
    "type": "Broken",
    "severity": "Critical",
    "effort": "M",
    "title": "Webhook Route Incompatible with Agoda OpenTravel Push Protocol",
    "description": "app/api/channels/webhook/route.ts requires an x-ota-signature HMAC header and returns 202 JSON. Agoda sends OTA_HotelResRQ XML over standard HTTPS and requires synchronous OTA_HotelResRS XML within 10 seconds.",
    "fixPlan": "Create dedicated route app/api/channels/agoda/route.ts that accepts raw XML, authenticates via Bearer/Basic Auth, parses OTA_HotelResRQ synchronously, creates booking, and returns OTA_HotelResRS with HotelReservationID."
  },
  {
    "id": "AGODA-004",
    "flow": "Inbound Push Booking",
    "layer": "Integration",
    "type": "Missing",
    "severity": "Critical",
    "effort": "M",
    "title": "Missing OTA_HotelResRQ XML Parser and OTA_HotelResRS Serializer",
    "description": "workers.ts assumes all reservations are JSON. There is no XML parsing utility to extract Agoda Booking ID, guest name, contact details, stay dates, and amounts from OpenTravel XML.",
    "fixPlan": "Implement robust XML parser and serializer in lib/channel-manager/serializers/agoda-xml.ts using fast-xml-parser."
  },
  {
    "id": "AGODA-005",
    "flow": "Inbound Cancellation",
    "layer": "API / Backend",
    "type": "Missing",
    "severity": "Critical",
    "effort": "M",
    "title": "No Handling for OTA_CancelRQ Cancellation Messages",
    "description": "The PMS has no endpoint or worker capable of handling Agoda cancellation notifications. Cancelled bookings remain confirmed in PMS, blocking room inventory.",
    "fixPlan": "Add OTA_CancelRQ parser to the Agoda route; locate booking by externalReservationId, update status to CANCELLED, release room assignments, and reply with OTA_CancelRS."
  },
  {
    "id": "AGODA-006",
    "flow": "Virtual Credit Card",
    "layer": "Database / Security / UI",
    "type": "Missing",
    "severity": "High",
    "effort": "M",
    "title": "Agoda Virtual Credit Card (VCC) Data Dropped on Ingestion",
    "description": "PaymentCard and TPA_Extensions/VirtualCreditCard elements from Agoda are ignored. The folio and front desk cannot access VCC details, activation date, or balance.",
    "fixPlan": "Store encrypted VCC data in ChannelReservation / Folio, display masked card and activation date in Receptionist Folio view with audit logging."
  },
  {
    "id": "AGODA-007",
    "flow": "Outbound Availability",
    "layer": "Backend / Worker",
    "type": "Broken",
    "severity": "High",
    "effort": "M",
    "title": "Outbound Availability Push Does Not Transmit OTA_HotelAvailNotifRQ",
    "description": "pushAvailabilityToOTA in ota-service.ts only generates mock JSON and logs success without transmitting an HTTP request. outboundWorker fails because AgodaAdapter is missing.",
    "fixPlan": "Build pushAvailability in AgodaAdapter to serialize timeline to OTA_HotelAvailNotifRQ XML and POST to Agoda 2013A/2015B endpoint."
  },
  {
    "id": "AGODA-008",
    "flow": "Outbound Rates & Restrictions",
    "layer": "Backend",
    "type": "Missing",
    "severity": "High",
    "effort": "M",
    "title": "Missing Outbound Rate & MinLOS XML Push",
    "description": "No worker or adapter pushes OTA_HotelRateAmountNotifRQ (rates, guest pricing) or OTA_HotelBookingRuleNotifRQ (MinLOS, booking windows) to Agoda.",
    "fixPlan": "Implement pushRates and pushRestrictions methods in AgodaAdapter with full OpenTravel XML payload generators."
  },
  {
    "id": "AGODA-009",
    "flow": "Admin UI & Configuration",
    "layer": "UI / Frontend",
    "type": "Inconsistent",
    "severity": "Medium",
    "effort": "S",
    "title": "ClientChannelManager Modal Asks for Incompatible Agoda Credentials",
    "description": "The connection modal asks for affiliateId which is Booking.com-specific. Agoda requires HotelCode (property ID), Client ID, and Client Secret. Connection test is never triggered for Agoda.",
    "fixPlan": "Update ClientChannelManager modal to dynamically display provider-specific fields (HotelCode for Agoda) and invoke test connection endpoint on submit."
  },
  {
    "id": "AGODA-010",
    "flow": "Observability & Error Handling",
    "layer": "Integration",
    "type": "Missing",
    "severity": "Low",
    "effort": "S",
    "title": "Agoda Error Code Taxonomy (9001–9999) Not Parsed",
    "description": "Agoda error codes (e.g. 9001 timestamp drift, 9901 IP whitelist failure) are not recognized, preventing actionable alerts for system administrators.",
    "fixPlan": "Add Agoda error dictionary mapping error codes to human-readable remediation instructions in ChannelSyncEvent."
  }
]
```

---

## Prioritized Fixing Order & Implementation Roadmap

To systematically resolve all gaps without breaking existing Booking.com integrations or the PMS core, implement the fixes in the following **5-Phase Execution Order**:

```
+---------------------------------------------------------------------------------+
|                    AGODA INTEGRATION FIXING ROADMAP                             |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  PHASE 1: Core Foundation & OAuth 2.0 Auth                                      |
|  - Implement AgodaAuthService (POST /token-based-authentication/exchange)       |
|  - In-memory/Redis JWT caching (55m TTL) + IP whitelisting validation           |
|  - XML serialization engine (fast-xml-parser) for OpenTravel 2013A/2015B        |
|                                                                                 |
|  PHASE 2: Inbound Push Ingestion (`OTA_HotelResRQ` / `OTA_CancelRQ`)            |
|  - Create dedicated endpoint `POST /api/channels/agoda/route.ts`               |
|  - Synchronous parsing of `OTA_HotelResRQ` $\rightarrow$ create Booking/Folio  |
|  - Synchronous response generation `OTA_HotelResRS` (< 10s SLA)                |
|  - Handle `OTA_CancelRQ` $\rightarrow$ cancel Booking, release room, `CancelRS` |
|                                                                                 |
|  PHASE 3: Virtual Credit Card (VCC) Extraction & Vaulting                       |
|  - Parse `<PaymentCard>` & `<TPA_Extensions><VirtualCreditCard>`               |
|  - Securely store card details, `EffectiveDate`, and balance in database        |
|  - Add VCC view in Receptionist / Frontdesk Folio                               |
|                                                                                 |
|  PHASE 4: Outbound ARI Sync Engine (`AgodaAdapter`)                             |
|  - Implement `AgodaAdapter` in `lib/channel-manager/adapters/agoda.ts`           |
|  - Register `AGODA` in `lib/channel-manager/workers.ts`                         |
|  - Build `OTA_HotelAvailNotifRQ` generator (Allotment, Close, CTA, CTD, MinLOS) |
|  - Build `OTA_HotelRateAmountNotifRQ` generator (Base rates, extra guests)      |
|                                                                                 |
|  PHASE 5: Admin UI, Property Mapping & E2E Verification                         |
|  - Update `ClientChannelManager.tsx` modal for Agoda HotelCode & credentials    |
|  - Implement ping / health check in `AgodaAdapter.connect()`                    |
|  - End-to-end integration test suite simulating full Agoda push/pull cycle      |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

### Phase Breakdown

#### Phase 1: Authentication & XML Core (Foundation)
1. **`lib/channel-manager/clients/agoda-client.ts`**:
   - Implements `authenticate()` calling `POST https://supply.agoda.com/token-based-authentication/exchange`.
   - Caches `accessToken` with 3300s TTL.
   - Respects 100 req/hr rate limits.
2. **`lib/channel-manager/serializers/agoda-xml.ts`**:
   - Configures `fast-xml-parser` with XML validation.
   - Provides helpers: `parseHotelResRQ`, `buildHotelResRS`, `parseCancelRQ`, `buildCancelRS`, `buildAvailNotifRQ`, `buildRateAmountNotifRQ`.

#### Phase 2: Inbound Two-Way Push Booking Endpoint
1. **`app/api/channels/agoda/route.ts`**:
   - Inspects incoming XML root element (`OTA_HotelResRQ` vs `OTA_CancelRQ`).
   - Authenticates via Bearer token or HTTP Basic Auth configured in `ChannelConnection`.
   - On `OTA_HotelResRQ`:
     - Checks idempotency in `ChannelReservation` by `externalReservationId`.
     - Maps `InvTypeCode` $\rightarrow$ local `RoomType`.
     - Creates `Booking`, `RoomAssignment`, and guest `Folio`.
     - Synchronously returns `OTA_HotelResRS` with `HotelReservationID` within < 2 seconds.
   - On `OTA_CancelRQ`:
     - Finds reservation, marks `BookingStatus.CANCELLED`, unassigns rooms.
     - Synchronously returns `OTA_CancelRS` with `UniqueID Type="15"`.

#### Phase 3: Agoda Virtual Credit Card (VCC) Security & Visibility
1. Extract `<PaymentCard>` attributes:
   - `CardCode`, `CardHolderName`, `CardNumber`, `ExpireDate`, `SecureInd` (CVV).
   - `VirtualCreditCard`: `CurrentBalance`, `FutureBalance`, `CurrencyCode`, `EffectiveDate`, `ExpirationDate`.
2. Encrypt card data using AES-256-GCM.
3. Expose VCC details in Receptionist Folio with masked PAN (`•••• •••• •••• 1111`) and activation date countdown.

#### Phase 4: Outbound ARI Adapter & Worker Integration
1. **`lib/channel-manager/adapters/agoda.ts`**:
   - Implement `ChannelConnector`:
     - `connect()`: Verifies token exchange and validates `HotelCode`.
     - `pushAvailability()`: Constructs `OTA_HotelAvailNotifRQ` for 365-day timeline and POSTs to `http://supplyota.agoda.com/b2b/ota/2013A/hotels`.
     - `pushRates()`: Constructs `OTA_HotelRateAmountNotifRQ`.
2. Register `AGODA: new AgodaAdapter()` in `lib/channel-manager/workers.ts`.
3. Update `app/api/bookings/route.ts` to trigger full stay date span availability push upon new booking or cancellation.

#### Phase 5: UI & E2E Validation
1. Update `ClientChannelManager.tsx` modal:
   - When `AGODA` is selected, replace `affiliateId` with `Agoda Hotel Code (Property ID)`.
2. Provide pre-flight credential test button invoking `POST /api/admin/integrations/channel-manager/test`.
3. Add full unit and integration tests covering XML parsing, idempotency, and XML response generation.
