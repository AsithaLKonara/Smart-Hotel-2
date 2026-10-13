# Agoda Direct Supply API Documentation

> **Official Specification & Reference Manual**  
> Source: [Agoda Developer Portal](https://developer.agoda.com/supply/reference/where-to-start)  
> Environment: Production (`supplyota.agoda.com` / `supply.agoda.com`) & Sandbox  
> Specification: OpenTravel Alliance (OTA) 2003A / 2013A / 2015B XML & REST OAuth 2.0 Token Exchange  

---

## Table of Contents

1. [Executive Overview & API Ecosystem](#1-executive-overview--api-ecosystem)
2. [Authentication & Authorization (OAuth 2.0 - 2025 Standard)](#2-authentication--authorization-oauth-20---2025-standard)
   - [2.1 Overview & Architecture](#21-overview--architecture)
   - [2.2 Token Exchange Endpoint](#22-token-exchange-endpoint)
   - [2.3 Request & Response Payloads](#23-request--response-payloads)
   - [2.4 Token Expiry & Refresh Workflow](#24-token-expiry--refresh-workflow)
   - [2.5 IP Whitelisting & IAM Self-Service](#25-ip-whitelisting--iam-self-service)
   - [2.6 Rate Limits & Throttling Policies](#26-rate-limits--throttling-policies)
3. [OTA XML API Architecture](#3-ota-xml-api-architecture)
   - [3.1 Service Endpoints & Versions (2013A vs 2015B)](#31-service-endpoints--versions-2013a-vs-2015b)
   - [3.2 Standard Envelope, Namespaces & Headers](#32-standard-envelope-namespaces--headers)
   - [3.3 Identification & Point of Sale (POS)](#33-identification--point-of-sale-pos)
4. [Availability & Restriction Management (`OTA_HotelAvailNotifRQ / RS`)](#4-availability--restriction-management-ota_hotelavailnotifrq--rs)
   - [4.1 Notification Types: Overlay vs Delta](#41-notification-types-overlay-vs-delta)
   - [4.2 Stop Sell / Close for Sale (Master & Rate Plan Level)](#42-stop-sell--close-for-sale-master--rate-plan-level)
   - [4.3 Closed to Arrival (CTA) & Closed to Departure (CTD)](#43-closed-to-arrival-cta--closed-to-departure-ctd)
   - [4.4 Minimum Length of Stay (MinLOS)](#44-minimum-length-of-stay-minlos)
   - [4.5 Maximum Length of Stay (MaxLOS)](#45-maximum-length-of-stay-maxlos)
   - [4.6 XML Message Schemas & Sample Payloads](#46-xml-message-schemas--sample-payloads)
5. [Rate & Inventory Management (`OTA_HotelRateAmountNotifRQ / RS`)](#5-rate--inventory-management-ota_hotelrateamountnotifrq--rs)
   - [5.1 Rate Structure & Pricing Models](#51-rate-structure--pricing-models)
   - [5.2 Base Rates & Extra Guest Pricing (`BaseByGuestAmt`)](#52-base-rates--extra-guest-pricing-basebyguestamt)
   - [5.3 Age Qualifying Codes & Child Pricing](#53-age-qualifying-codes--child-pricing)
   - [5.4 Taxes & Surcharges](#54-taxes--surcharges)
   - [5.5 Meals & Inclusions](#55-meals--inclusions)
   - [5.6 Complete XML Examples](#56-complete-xml-examples)
6. [Generic Push Booking API (`OTA_HotelResRQ / RS`)](#6-generic-push-booking-api-ota_hotelresrq--rs)
   - [6.1 Push Booking Workflow](#61-push-booking-workflow)
   - [6.2 Reservation Payload Schema (`OTA_HotelResRQ`)](#62-reservation-payload-schema-ota_hotelresrq)
   - [6.3 Customer & Guest Details (`ResGuest`)](#63-customer--guest-details-resguest)
   - [6.4 Room Rates & Monetary Breakdowns](#64-room-rates--monetary-breakdowns)
   - [6.5 Partner Confirmation Response (`OTA_HotelResRS`)](#65-partner-confirmation-response-ota_hotelresrs)
7. [Booking Cancellation Flow (`OTA_CancelRQ / RS`)](#7-booking-cancellation-flow-ota_cancelrq--rs)
   - [7.1 Cancellation Notification Workflow](#71-cancellation-notification-workflow)
   - [7.2 Cancellation Request Schema (`OTA_CancelRQ`)](#72-cancellation-request-schema-ota_cancelrq)
   - [7.3 Partner Cancellation Response (`OTA_CancelRS`)](#73-partner-cancellation-response-ota_cancelrs)
8. [Booking Rules (`OTA_HotelBookingRuleNotifRQ / RS`)](#8-booking-rules-ota_hotelbookingrulenotifrq--rs)
   - [8.1 Relative Booking Rules (`Min/MaxAdvancedBookingOffset`)](#81-relative-booking-rules-minmaxadvancedbookingoffset)
   - [8.2 Absolute Cutoff & Drop Time (`AbsoluteCutoff`, `AbsoluteDropTime`)](#82-absolute-cutoff--drop-time-absolutecutoff-absolutedroptime)
   - [8.3 XML Request & Response Examples](#83-xml-request--response-examples)
9. [Precheck & Search Availability (`OTA_HotelAvailRQ / RS`)](#9-precheck--search-availability-ota_hotelavailrq--rs)
   - [9.1 Availability Query Specification](#91-availability-query-specification)
   - [9.2 Single Property Availability Request](#92-single-property-availability-request)
   - [9.3 Precheck Response Handling](#93-precheck-response-handling)
10. [Payment Card Solutions & Virtual Credit Cards (VCC)](#10-payment-card-solutions--virtual-credit-cards-vcc)
    - [10.1 PaymentCard Structure in Reservations](#101-paymentcard-structure-in-reservations)
    - [10.2 Virtual Credit Card Parameters (`TPA_Extensions`)](#102-virtual-credit-card-parameters-tpa_extensions)
    - [10.3 Activation, Balances & Charging Restrictions](#103-activation-balances--charging-restrictions)
    - [10.4 Card Issuer Codes](#104-card-issuer-codes)
11. [Code Lists & Taxonomy](#11-code-lists--taxonomy)
    - [11.1 Age Qualifying Codes (AQC)](#111-age-qualifying-codes-aqc)
    - [11.2 Meal Plan Codes](#112-meal-plan-codes)
    - [11.3 Unique ID Context Codes](#113-unique-id-context-codes)
    - [11.4 Special Request Identifiers](#114-special-request-identifiers)
12. [Error Handling & Complete Error Code Directory](#12-error-handling--complete-error-code-directory)
    - [12.1 Standard Error Response Structure](#121-standard-error-response-structure)
    - [12.2 HTTP Statuses vs Business Error Codes](#122-http-statuses-vs-business-error-codes)
    - [12.3 Complete Master Error Code Directory (9001–9999)](#123-complete-master-error-code-directory-90019999)
13. [Content Push API & Product Management Summary](#13-content-push-api--product-management-summary)

---

## 1. Executive Overview & API Ecosystem

Agoda Direct Supply enables Channel Managers, Central Reservation Systems (CRS), Property Management Systems (PMS), and Accommodation Suppliers to connect directly to Agoda’s global distribution platform.

### Agoda Connectivity Models

Agoda Direct Supply comprises four primary connectivity mechanisms:

```
+-----------------------------------------------------------------------------+
|                          AGODA DIRECT SUPPLY ECOSYSTEM                      |
+-----------------------------------------------------------------------------+
|                                                                             |
|  1. OTA XML API (OpenTravel 2013A / 2015B)                                  |
|     - ARI: Rates, Allotment, Restrictions (Push)                            |
|     - Booking Rules: Advance booking windows, Cutoffs (Push)                |
|     - Precheck: Real-time live room check (`OTA_HotelAvailRQ`)              |
|                                                                             |
|  2. Generic Push Booking API (Two-Way XML)                                  |
|     - Agoda PUSHES reservations to Partner endpoint (`OTA_HotelResRQ`)       |
|     - Agoda PUSHES cancellations to Partner endpoint (`OTA_CancelRQ`)        |
|     - Partner responds synchronously with Confirmation / Error Number       |
|     - Supports Agoda Virtual Cards (VCC) & Guest details                    |
|                                                                             |
|  3. YCS API (Yield Control System / REST / JSON PullSpec)                   |
|     - Property room mapping & inventory retrieval                           |
|     - Alternative pull-based reservation polling                            |
|                                                                             |
|  4. Content Push API & Promotion API                                        |
|     - REST endpoints to create/update hotel descriptions, rooms, rates,      |
|       amenities, photos, contracts, and marketing promotions                |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## 2. Authentication & Authorization (OAuth 2.0 - 2025 Standard)

### 2.1 Overview & Architecture

Agoda has modernized all Direct Supply APIs to use **OAuth 2.0 Token-Based Authentication**.
- Legacy basic HTTP authentication is deprecated.
- All requests must authenticate via an ephemeral Bearer JSON Web Token (JWT) retrieved from Agoda's token exchange endpoint.
- Access tokens have a maximum lifetime of **1 hour (3600 seconds)**.

### 2.2 Token Exchange Endpoint

* **Production Endpoint:** `POST https://supply.agoda.com/token-based-authentication/exchange`
* **Sandbox Endpoint:** `POST https://supply-sandbox.agoda.com/token-based-authentication/exchange` (or designated partner test URL)
* **Headers:**
  ```http
  Content-Type: application/json
  ```

### 2.3 Request & Response Payloads

#### Request Payload
Agoda accepts both camelCase and snake_case field naming:

```json
{
  "clientId": "your_agoda_client_id",
  "clientSecret": "your_agoda_client_secret"
}
```
*Or:*
```json
{
  "client_id": "your_agoda_client_id",
  "client_secret": "your_agoda_client_secret"
}
```

#### Successful Response (HTTP 200 OK)
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

#### Passing Token to Subsequent API Requests
Every subsequent request (OTA XML, Content Push, Promotion, YCS) must supply the token in the HTTP Authorization header:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ...
```

### 2.4 Token Expiry & Refresh Workflow

- **No Refresh Token**: Agoda OAuth 2.0 does not use long-lived refresh tokens. When an access token expires or nears expiration, re-call `/token-based-authentication/exchange` using your `clientId` and `clientSecret`.
- **Preemptive Renewal**: Recommended practice is to refresh tokens at **50 to 55 minutes** (5-10 minutes prior to expiry) to prevent mid-flight 401 Unauthorized errors during high-volume ARI pushes.

### 2.5 IP Whitelisting & IAM Self-Service

Agoda enforces strict network-level IP whitelisting in addition to client credentials:
- API access is rejected from unauthorized source IPs, even with valid credentials.
- Whitelisting is managed via Agoda's **YCS Self-Service IAM Portal**:
  - URL: `https://ycs.agoda.com/mldc/en-us/app/iam/selfservice`
  - Partners register the static IPv4/IPv6 addresses or CIDR blocks of all outbound application servers, staging servers, and worker droplets.

### 2.6 Rate Limits & Throttling Policies

Agoda implements granular rate limiting on the token exchange endpoint:

| Scope | Metric / Window | Limit | Consequence of Breach |
| :--- | :--- | :--- | :--- |
| **Client ID Level** | Hourly attempts | Max **100 attempts / hour** (Up to 90 successful issuances) | `429 Too Many Requests` / Temporary block |
| **Client ID Level** | Daily attempts | Max **2,100 attempts / 24 hours** | `429 Too Many Requests` |
| **IP Address Level** | Hourly attempts | Max **220 attempts / hour** per IP | IP temporarily blacklisted |

> [!IMPORTANT]
> Do NOT request a new token for every individual API call. Cache the token in-memory or in Redis across your cluster until 5 minutes before expiry.

---

## 3. OTA XML API Architecture

### 3.1 Service Endpoints & Versions (2013A vs 2015B)

Agoda provides two primary OpenTravel version targets:

| OTA Version | Production URL | Description |
| :--- | :--- | :--- |
| **2013A** | `http://supplyota.agoda.com/b2b/ota/2013A/hotels` | Standard stable production endpoint for OTA XML transactions |
| **2015B** | `http://supplyota.agoda.com/b2b/ota/2015B/hotels` | Enhanced specification featuring advanced rate codes & child occupancy tiers |

### 3.2 Standard Envelope, Namespaces & Headers

* **Protocol**: HTTP/1.1 POST
* **Content-Type**: `application/xml` or `text/xml; charset=utf-8`
* **Namespace**: `xmlns="http://www.opentravel.org/OTA/2003/05"`
* **Target**: `Target="Production"` (or `"Test"`)
* **EchoToken**: Globally unique UUID or Unix epoch millisecond timestamp used to correlate request/response pairs.

### 3.3 Identification & Point of Sale (POS)

Agoda identification inside OTA requests uses Agoda's official IATA Requestor ID:

```xml
<POS>
    <Source>
        <RequestorID ID="96637800" ID_Context="IATA" Type="18" URL="Agoda.com" />
    </Source>
</POS>
```
* **IATA ID**: `96637800` (Agoda Corporate Identifier)
* **Type**: `18` (OTA Code for "Other" / Online Travel Agency)
* **ID_Context**: `IATA`

---

## 4. Availability & Restriction Management (`OTA_HotelAvailNotifRQ / RS`)

### 4.1 Notification Types: Overlay vs Delta

The `OTA_HotelAvailNotifRQ` supports two processing modes via the `@NotifType` attribute:

* **Overlay (`NotifType="Overlay"`)**: Replaces the entire availability and restriction dataset for the specified room/date range. Any restriction not explicitly specified is wiped/reset to open defaults.
* **Delta (`NotifType="Delta"`)**: Modifies only the specific fields supplied (e.g. toggles CTA or changes MinLOS) without altering existing unmentioned restrictions.

### 4.2 Stop Sell / Close for Sale (Master & Rate Plan Level)

Restrictions are communicated within `AvailStatusMessages` per `HotelCode`:

* **Room-Level Close (Master Stop Sell)**: Omit `RatePlanCode` and specify only `BookingLimit="0"` or `RestrictionStatus Status="Close" Restriction="Master"`.
* **Rate-Plan Close**: Include `RatePlanCode` and specify `RestrictionStatus Status="Close"`.
* **Open for Sale**: Specify `RestrictionStatus Status="Open"`.

### 4.3 Closed to Arrival (CTA) & Closed to Departure (CTD)

* **Closed to Arrival (CTA)**:
  ```xml
  <RestrictionStatus Restriction="Arrival" Status="Close" />
  ```
  *(To reopen: `Status="Open"`)*
* **Closed to Departure (CTD)**:
  ```xml
  <RestrictionStatus Restriction="Departure" Status="Close" />
  ```
  *(To reopen: `Status="Open"`)*

### 4.4 Minimum Length of Stay (MinLOS)

Agoda supports two MinLOS mechanisms:
1. **SetMinLOS**: Enforces a minimum stay requirement for arrivals on that date.
2. **RemoveMinLOS**: Clears previously established MinLOS restrictions.

```xml
<LengthsOfStay>
    <LengthOfStay MinMaxMessageType="SetMinLOS" Time="2" />
</LengthsOfStay>
```
*(To remove: `<LengthOfStay MinMaxMessageType="RemoveMinLOS" />`)*

### 4.5 Maximum Length of Stay (MaxLOS)

Similar to MinLOS, MaxLOS limits maximum stay length:
```xml
<LengthsOfStay>
    <LengthOfStay MinMaxMessageType="SetMaxLOS" Time="14" />
</LengthsOfStay>
```
*(To remove: `<LengthOfStay MinMaxMessageType="RemoveMaxLOS" />`)*

### 4.6 XML Message Schemas & Sample Payloads

#### Sample Request (`OTA_HotelAvailNotifRQ`): Allotment, Close for Sale, CTA, CTD & MinLOS
```xml
<OTA_HotelAvailNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="1728867600000"
    TimeStamp="2026-10-14T03:30:00+08:00"
    Target="Production"
    Version="1.006"
    PrimaryLangID="en">
    <AvailStatusMessages HotelCode="61027">
        <!-- Update Allotment / Inventory -->
        <AvailStatusMessage BookingLimit="10">
            <StatusApplicationControl Start="2026-11-01" End="2026-11-05" InvTypeCode="DLX" />
        </AvailStatusMessage>
        <!-- Close Rate Plan for Sale -->
        <AvailStatusMessage>
            <StatusApplicationControl Start="2026-11-01" End="2026-11-02" InvTypeCode="DLX" RatePlanCode="RO" />
            <RestrictionStatus Status="Close" Restriction="Master" />
        </AvailStatusMessage>
        <!-- Enforce MinLOS = 3 Nights & CTA -->
        <AvailStatusMessage>
            <StatusApplicationControl Start="2026-11-03" End="2026-11-05" InvTypeCode="DLX" RatePlanCode="BB" />
            <LengthsOfStay>
                <LengthOfStay MinMaxMessageType="SetMinLOS" Time="3" />
            </LengthsOfStay>
            <RestrictionStatus Status="Close" Restriction="Arrival" />
        </AvailStatusMessage>
    </AvailStatusMessages>
</OTA_HotelAvailNotifRQ>
```

#### Successful Response (`OTA_HotelAvailNotifRS`)
```xml
<OTA_HotelAvailNotifRS xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="1728867600000"
    TimeStamp="2026-10-14T03:30:01+08:00"
    Version="1.006">
    <Success />
</OTA_HotelAvailNotifRS>
```

---

## 5. Rate & Inventory Management (`OTA_HotelRateAmountNotifRQ / RS`)

### 5.1 Rate Structure & Pricing Models

Agoda supports two pricing architectures:
1. **Per Room Rate (Standard Occupancy)**: Rate set for standard room capacity with supplementary fees for extra guests.
2. **Occupancy-Based Pricing (OBP)**: Discrete rates per exact guest count (1 guest, 2 guests, 3 guests, etc.).

Rates are communicated via `OTA_HotelRateAmountNotifRQ` under `Rates/Rate`.

### 5.2 Base Rates & Extra Guest Pricing (`BaseByGuestAmt`)

Inside `<BaseByGuestAmts>`:
* **`AmountAfterTax`**: Final selling rate inclusive of all mandatory taxes.
* **`AmountBeforeTax`**: Net rate before taxes.
* **`AmountPlain`**: Agoda base amount without markup.
* **`NumberOfGuests`**: Integer representing occupant count.
* **`CurrencyCode`**: 3-letter ISO 4217 currency code (e.g., `USD`, `EUR`, `LKR`).

### 5.3 Age Qualifying Codes & Child Pricing

Extra guests or age-tiered supplements use `AgeQualifyingCode`:
* **`10`**: Adult
* **`8`**: Child
* **`6`**: Infant

```xml
<AdditionalGuestAmounts>
    <!-- Extra Adult Charge -->
    <AdditionalGuestAmount AgeQualifyingCode="10" Amount="25.00" CurrencyCode="USD" />
    <!-- Extra Child Charge -->
    <AdditionalGuestAmount AgeQualifyingCode="8" Amount="12.50" CurrencyCode="USD" />
</AdditionalGuestAmounts>
```

### 5.4 Taxes & Surcharges

Taxes and fees are declared within `Taxes/Tax` or `Fees/Fee`:
* `TaxCode`: Specific government or local surcharge code.
* `Amount`: Monetary charge or percentage value.
* `Percent`: Boolean or value indicating whether tax is a percentage.
* `Type`: Tax classification code.

### 5.5 Meals & Inclusions

Meals are designated on the rate plan via `MealsIncluded`:
* `MealPlanCodes`: `1` (All Inclusive), `3` (Breakfast), `10` (Full Board), `12` (Half Board).

### 5.6 Complete XML Examples

#### Sample Request (`OTA_HotelRateAmountNotifRQ`)
```xml
<OTA_HotelRateAmountNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="1728867605000"
    TimeStamp="2026-10-14T03:30:05+08:00"
    Target="Production"
    Version="1.006">
    <RateAmountMessages HotelCode="61027">
        <RateAmountMessage>
            <StatusApplicationControl Start="2026-11-01" End="2026-11-05" InvTypeCode="DLX" RatePlanCode="BB" />
            <Rates>
                <Rate CurrencyCode="USD">
                    <BaseByGuestAmts>
                        <BaseByGuestAmt NumberOfGuests="2" AmountAfterTax="120.00" AmountBeforeTax="100.00" CurrencyCode="USD" />
                        <BaseByGuestAmt NumberOfGuests="1" AmountAfterTax="100.00" AmountBeforeTax="83.33" CurrencyCode="USD" />
                    </BaseByGuestAmts>
                    <AdditionalGuestAmounts>
                        <AdditionalGuestAmount AgeQualifyingCode="10" Amount="30.00" CurrencyCode="USD" />
                        <AdditionalGuestAmount AgeQualifyingCode="8" Amount="15.00" CurrencyCode="USD" />
                    </AdditionalGuestAmounts>
                    <MealsIncluded MealPlanCodes="3" />
                </Rate>
            </Rates>
        </RateAmountMessage>
    </RateAmountMessages>
</OTA_HotelRateAmountNotifRQ>
```

#### Successful Response (`OTA_HotelRateAmountNotifRS`)
```xml
<OTA_HotelRateAmountNotifRS xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="1728867605000"
    TimeStamp="2026-10-14T03:30:06+08:00"
    Version="1.006">
    <Success />
</OTA_HotelRateAmountNotifRS>
```

---

## 6. Generic Push Booking API (`OTA_HotelResRQ / RS`)

### 6.1 Push Booking Workflow

In Agoda's Generic Push Booking model:
1. A guest makes a booking on Agoda.com.
2. Agoda immediately sends an HTTP POST request containing `OTA_HotelResRQ` to the Partner's configured HTTPS endpoint.
3. The Partner validates the message, commits the reservation to their database/PMS, and returns `OTA_HotelResRS` synchronously within **10 seconds**.
4. If the partner times out or returns an error, Agoda marks the delivery as failed and invokes automated retry policies.

### 6.2 Reservation Payload Schema (`OTA_HotelResRQ`)

#### Identifying Keys
* **`ResStatus`**: `"Commit"` (New booking) or `"Modify"` (Modification).
* **`UniqueID Type="14"`**: Agoda Reservation Reference ID (e.g., `210466950`).
* **`UniqueID Type="5"`**: Supplier Confirmation Number (if modification).
* **`POS/Source/RequestorID`**: ID `96637800` (Agoda IATA identifier).

### 6.3 Customer & Guest Details (`ResGuest`)

The payload contains guest identity details:
* `ResGuest/Profiles/ProfileInfo/Profile/Customer`:
  * `PersonName/GivenName`: Guest first name.
  * `PersonName/Surname`: Guest surname.
  * `Telephone`: Contact phone number.
  * `Email`: Guest email or masked proxy email.
  * `CitizenCountryName`: Guest nationality code.

### 6.4 Room Rates & Monetary Breakdowns

Contains:
* `RoomStay/RoomTypes/RoomType/@RoomTypeCode`: Hotel's room code.
* `RoomStay/RatePlans/RatePlan/@RatePlanCode`: Hotel's rate plan code.
* `RoomStay/TimeSpan`: `@Start` (Check-in) and `@End` (Check-out).
* `RoomStay/GuestCounts`: Number of adults and children.
* `RoomStay/Total`:
  * `@AmountAfterTax`: Total amount to be collected or charged to the VCC.
  * `@CurrencyCode`: Currency unit.

### 6.5 Partner Confirmation Response (`OTA_HotelResRS`)

The Partner must reply with their confirmation number inside `HotelReservationIDs`:

```xml
<OTA_HotelResRS xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="1728867610000"
    TimeStamp="2026-10-14T03:30:11+08:00"
    Version="1.006">
    <Success />
    <HotelReservations>
        <HotelReservation>
            <UniqueID ID="210466950" Type="14" ID_Context="Agoda" />
            <HotelReservationIDs>
                <!-- Partner PMS Booking Confirmation Number -->
                <HotelReservationID ResID_Type="10" ResID_Value="PMS-987654" />
            </HotelReservationIDs>
        </HotelReservation>
    </HotelReservations>
</OTA_HotelResRS>
```

---

## 7. Booking Cancellation Flow (`OTA_CancelRQ / RS`)

### 7.1 Cancellation Notification Workflow

When a booking is cancelled:
1. Agoda transmits an `OTA_CancelRQ` to the Partner endpoint.
2. The request specifies the Agoda Booking ID and Partner Confirmation ID.
3. The Partner marks the booking as cancelled in the PMS, releases room allotment, and returns `OTA_CancelRS` with a cancellation reference number.

### 7.2 Cancellation Request Schema (`OTA_CancelRQ`)

```xml
<OTA_CancelRQ Version="0.2" TimeStamp="2026-10-14T03:35:00+07:00" xmlns="http://www.opentravel.org/OTA/2003/05">
    <POS>
        <Source>
            <RequestorID ID="96637800" ID_Context="IATA" Type="18" URL="Agoda.com"/>
        </Source>
    </POS>
    <!-- Agoda Booking ID (Type 4) -->
    <UniqueID ID="210466950" Type="4" ID_Context="Agoda"/>
    <!-- Supplier PMS Booking ID (Type 5) -->
    <UniqueID ID="PMS-987654" Type="5" ID_Context="DHIL"/>
</OTA_CancelRQ>
```

#### UniqueID Type Definitions in Cancellation:
* **`Type="4"`**: Agoda Booking ID.
* **`Type="5"`**: Supplier / PMS Booking ID.

### 7.3 Partner Cancellation Response (`OTA_CancelRS`)

```xml
<OTA_CancelRS Version="0.2" TimeStamp="2026-10-14T03:35:01+07:00" Status="Confirmed" xmlns="http://www.opentravel.org/OTA/2003/05">
    <Success />
    <!-- Partner Cancellation Number -->
    <UniqueID ID="CANC-2026-1092" Type="15" />
</OTA_CancelRS>
```

---

## 8. Booking Rules (`OTA_HotelBookingRuleNotifRQ / RS`)

Booking rules specify advance booking restrictions (e.g., early bird deals, last-minute restrictions) and cutoff dates.

### 8.1 Relative Booking Rules (`Min/MaxAdvancedBookingOffset`)

* **`MinAdvancedBookingOffset`**: Minimum advance reservation window (ISO 8601 duration, e.g. `P3D` = 3 days in advance).
* **`MaxAdvancedBookingOffset`**: Maximum advance reservation window (e.g. `P365D` = up to 365 days in advance).

```xml
<BookingRules>
    <BookingRule MinAdvancedBookingOffset="P3D" MaxAdvancedBookingOffset="P365D" />
</BookingRules>
```

### 8.2 Absolute Cutoff & Drop Time (`AbsoluteCutoff`, `AbsoluteDropTime`)

* **`AbsoluteCutoff`**: The absolute fixed deadline (date) after which no bookings can be made (e.g., `2026-10-31`).
* **`AbsoluteDropTime`**: The earliest calendar date when bookings are permitted to open.

```xml
<BookingRules>
    <BookingRule AbsoluteDropTime="2026-09-01" AbsoluteCutoff="2026-10-05" />
</BookingRules>
```

### 8.3 XML Request & Response Examples

```xml
<OTA_HotelBookingRuleNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
    Target="Production"
    Version="1.006"
    PrimaryLangID="en"
    TimeStamp="2026-10-14T03:36:00+02:00">
    <RuleMessages HotelCode="61027">
        <RuleMessage UniqueID="982341">
            <StatusApplicationControl Start="2026-11-01" End="2026-12-31" InvTypeCode="DLX" RatePlanCode="EARLY" />
            <BookingRules>
                <BookingRule MinAdvancedBookingOffset="P14D" />
            </BookingRules>
        </RuleMessage>
    </RuleMessages>
</OTA_HotelBookingRuleNotifRQ>
```

---

## 9. Precheck & Search Availability (`OTA_HotelAvailRQ / RS`)

Precheck allows a partner to query real-time availability and rate configuration from Agoda.

### 9.1 Availability Query Specification
Used to query live availability for single or multiple properties over designated stay dates.

### 9.2 Single Property Availability Request

```xml
<OTA_HotelAvailRQ PrimaryLangID="en" xmlns="http://www.opentravel.org/OTA/2003/05">
    <AvailRequestSegments>
        <AvailRequestSegment>
            <StayDateRange Start="2026-11-25" End="2026-11-29" />
            <RatePlanCandidates>
                <RatePlanCandidate RatePlanCode="BB" />
            </RatePlanCandidates>
            <RoomStayCandidates>
                <RoomStayCandidate RoomTypeCode="DLX" Quantity="1">
                    <GuestCounts>
                        <GuestCount AgeQualifyingCode="10" Count="2" />
                    </GuestCounts>
                </RoomStayCandidate>
            </RoomStayCandidates>
            <HotelSearchCriteria>
                <Criterion>
                    <HotelRef HotelCode="61027" />
                </Criterion>
            </HotelSearchCriteria>
        </AvailRequestSegment>
    </AvailRequestSegments>
</OTA_HotelAvailRQ>
```

---

## 10. Payment Card Solutions & Virtual Credit Cards (VCC)

### 10.1 PaymentCard Structure in Reservations

When an Agoda booking is prepaid by the customer (Merchant Model / Agoda Collect), Agoda issues an **Agoda Virtual Credit Card (VCC)** to the supplier to charge the net supplier amount.

The card details are securely embedded inside the `OTA_HotelResRQ` under `Guarantee/GuaranteesAccepted/GuaranteeAccepted/PaymentCard`.

```xml
<PaymentCard CardCode="VI" EffectiveDate="2026-11-01">
    <CardHolderName>Agoda Virtual Card</CardHolderName>
    <CardNumber ExpireDate="11/2026" SecureInd="123">4111111111111111</CardNumber>
    <TPA_Extensions>
        <VirtualCreditCard
            CurrentBalance="100.00"
            FutureBalance="100.00"
            CurrencyCode="USD"
            DecimalPlaces="2"
            ExpirationDate="2026-12-01"
            IsVCC="true" />
    </TPA_Extensions>
</PaymentCard>
```

### 10.2 Virtual Credit Card Parameters (`TPA_Extensions`)

| Field / Attribute | Type | Description |
| :--- | :--- | :--- |
| **`@CurrentBalance`** | Decimal/Integer | The current chargeable balance on the VCC. |
| **`@FutureBalance`** | Decimal/Integer | The full payable amount that will be loaded upon the activation date. |
| **`@CurrencyCode`** | String (3-char) | ISO 4217 currency code (e.g. `USD`, `EUR`). |
| **`@DecimalPlaces`** | Integer | Currency minor decimal places (e.g. `2`). |
| **`@ExpirationDate`** | String | Date on which the VCC expires and can no longer be processed. |
| **`@IsVCC`** | Boolean | Boolean flag (`true`) indicating the card is an Agoda Virtual Card. |

### 10.3 Activation, Balances & Charging Restrictions

* **`EffectiveDate`**: The earliest date the card can be charged (usually check-in or cancellation window deadline). Attempting to charge before `EffectiveDate` will decline.
* **Pre-authorization**: VCCs typically have $1.00 balance loaded until `EffectiveDate`, at which point the full `FutureBalance` is unlocked.
* **Charge Exact Amount**: Charging amounts higher than the allocated balance results in immediate terminal decline.

### 10.4 Card Issuer Codes

| Card Brand | Issuer Code (`@CardCode`) |
| :--- | :--- |
| **Visa** | `VI` |
| **MasterCard** | `MC` |
| **American Express** | `AX` |
| **Diners Club** | `DN` |

---

## 11. Code Lists & Taxonomy

### 11.1 Age Qualifying Codes (AQC)

| Code | Classification | Definition |
| :--- | :--- | :--- |
| **`10`** | Adult | Full paying adult guest |
| **`8`** | Child | Child guest (subject to hotel child policy age ranges) |
| **`6`** | Infant | Infant guest (usually crib/cot) |

### 11.2 Meal Plan Codes

| Code | Plan Type | Description |
| :--- | :--- | :--- |
| **`1`** | All Inclusive | Room including all meals and selected beverages |
| **`3`** | Breakfast | Bed & Breakfast |
| **`10`** | Full Board | Room including Breakfast, Lunch, and Dinner |
| **`12`** | Half Board | Room including Breakfast and Dinner |

### 11.3 Unique ID Context Codes

| ID_Context / Type | Meaning |
| :--- | :--- |
| **`Type="4"`** | Agoda Booking ID |
| **`Type="5"`** | Supplier / PMS Reservation ID |
| **`Type="14"`** | Reservation Reference in `OTA_HotelResRQ` |
| **`Type="15"`** | Cancellation Reference in `OTA_CancelRS` |
| **`Type="18"`** | Online Travel Agency Requestor Type |
| **`ID_Context="IATA"`** | International Air Transport Association context (`96637800`) |

### 11.4 Special Request Identifiers

Agoda passes standard guest request preference codes inside `SpecialRequests/SpecialRequest`:
* Non-smoking room
* High floor
* Early check-in / Late check-out
* Airport transfer requested
* Bedding preferences (Twin beds / King bed)

---

## 12. Error Handling & Complete Error Code Directory

### 12.1 Standard Error Response Structure

When validation fails, Agoda returns an XML document containing `<Errors>`:

```xml
<OTA_HotelAvailNotifRS xmlns="http://www.opentravel.org/OTA/2003/05"
    EchoToken="1728867600000"
    TimeStamp="2026-10-14T03:30:02+08:00"
    Version="1.006">
    <Errors>
        <Error Code="9004" Type="3" ShortText="StartDate is greater than EndDate">
            StartDate is greater than EndDate
        </Error>
    </Errors>
</OTA_HotelAvailNotifRS>
```

### 12.2 HTTP Statuses vs Business Error Codes

* **`HTTP 200 OK`**: Message received and successfully parsed. If business rules failed, `<Errors>` is embedded inside the payload.
* **`HTTP 400 Bad Request`**: Schema validation, timestamp, or parameter error.
* **`HTTP 403 Forbidden`**: Token unauthorized, IP not whitelisted, or property unmapped.
* **`HTTP 405 Method Not Allowed`**: Incorrect HTTP verb (e.g. GET instead of POST).
* **`HTTP 429 Too Many Requests`**: Rate limit exceeded.
* **`HTTP 500 Internal Server Error`**: Agoda downstream processing error.

### 12.3 Complete Master Error Code Directory (9001–9999)

The following table documents all official Agoda Direct Supply error codes:

| HTTP Status | Error Code | Official Description & Trigger Cause |
| :--- | :--- | :--- |
| **400** | **`9001`** | Message Timestamp is older than 10 minutes (System clock drift) |
| **400** | **`9004`** | `StartDate` is greater than `EndDate` |
| **400** | **`9005`** | `StartDate` can't be in the past |
| **400** | **`9006`** | `EndDate` can't be in the past |
| **400** | **`9009`** | Amount must be > 0.0 |
| **400** | **`9010`** | Amount is not specified |
| **400** | **`9011`** | `NumberOfGuests` must be >= 0 |
| **400** | **`9012`** | `InvTypeCode` (Room Type Code) cannot be empty |
| **400** | **`9013`** | `RatePlanCode` cannot be empty |
| **400** | **`9015`** | `RestrictionStatus` cannot be empty |
| **400** | **`9016`** | `RestrictionStatus` should be `Open` or `Close` |
| **400** | **`9019`** | `OffsetTimeUnit` cannot be empty |
| **400** | **`9020`** | `OffsetDropTime` cannot be empty |
| **400** | **`9021`** | `OffsetUnitMultiplier` must be greater than -1 |
| **400** | **`9022`** | `AbsoluteDropTime` must be less than or equal to `AbsoluteCutoff` |
| **400** | **`9028`** | `AmountIncludingMarkup` / `AmountAfterTax` should be PB and Percent |
| **400** | **`9029`** | `BaseByGuestAmt` not allowed to have multiple currencies in single message |
| **400** | **`9030`** | `AgeQualifyingCode` invalid value (Must be 6, 8, or 10) |
| **400** | **`9031`** | `AgeQualifyingCode` duplicate value in same tier |
| **400** | **`9033`** | Fee DateRange not inclusive in Checkin to LastCheckin+LOS |
| **400** | **`9035`** | Tax DateRange not inclusive in Checkin to LastCheckin+LOS |
| **400** | **`9036`** | Fee DateRange cannot overlap in the same group |
| **400** | **`9037`** | Tax DateRange cannot overlap in the same group |
| **400** | **`9039`** | Fee not allowed if `BaseByGuestAmt` is empty |
| **400** | **`9040`** | `LengthOfStay` required between 1 and maximum number allowed |
| **400** | **`9041`** | `RateLoadType` not allowed |
| **400** | **`9042`** | `NumberOfUnit` is required to be greater than zero |
| **400** | **`9044`** | Tax Code is not allowed or unrecognized |
| **400** | **`9045`** | Fee Code is not allowed or unrecognized |
| **400** | **`9098`** | Lead Days exceeds maximum permissible advance booking window |
| **400** | **`9099`** | Length of Stay (LOS) cannot exceed 2 years (730 days) |
| **403** | **`9901`** | Access is denied. User is unauthorized or IP address is not whitelisted |
| **405** | **`9903`** | Method not allowed (HTTP verb mismatch) |
| **500** | **`9999`** | Internal Server Error within Agoda processing engine |

---

## 13. Content Push API & Product Management Summary

In addition to the core OTA XML ARI engine, Agoda supports REST/JSON management endpoints:

* **Property Management**:
  * `POST /supply/properties`: Register or update property descriptive data.
  * `PUT /supply/properties/{id}/status`: Activate or deactivate property distribution.
* **Room & Rate Plan Setup**:
  * `POST /supply/properties/{id}/rooms`: Create room types, bedding configurations, max occupancy.
  * `POST /supply/properties/{id}/rates`: Establish master rate plans, currency, and default meal inclusions.
* **Content Taxonomies**:
  * Endpoints to query supported amenities, fees, benefits, cancellation policies, currencies, bed types, and image caption categories.
* **Contracts**:
  * View and digitally sign host/hotel supply distribution agreements via `AG_HotelContractInfoRQ` and `AG_HotelContractSignNotifRQ`.
