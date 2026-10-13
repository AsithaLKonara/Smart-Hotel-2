# Booking.com Demand API (v3.2) — Developer Reference

> **Official Documentation:** [Booking.com Demand API v3.2 OpenAPI Specification](https://developers.booking.com/demand/docs/open-api/3.2/demand-api)  
> **API Version:** `3.2`  
> **Protocol:** HTTPS REST / JSON  
> **HTTP Methods:** Endpoints strictly use `POST` with JSON request bodies.

---

## Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Environments & Base URLs](#2-environments--base-urls)
3. [Global Authentication & Request Headers](#3-global-authentication--request-headers)
4. [Endpoint Catalog](#4-endpoint-catalog)
5. [Common Reference Endpoints](#5-common-reference-endpoints)
6. [Accommodation Endpoints](#6-accommodation-endpoints)
7. [Car Rental Endpoints](#7-car-rental-endpoints)
8. [Orders & Booking Lifecycle](#8-orders--booking-lifecycle)
   - [8.1 Preview an Order (`POST /orders/preview`)](#81-preview-an-order)
   - [8.2 Create and Confirm Order (`POST /orders/create`)](#82-create-and-confirm-order)
   - [8.3 Query Orders Details (`POST /orders/details`)](#83-query-orders-details)
   - [8.4 Accommodation Order Details (`POST /orders/details/accommodations`)](#84-accommodation-order-details)
   - [8.5 Car Rental Order Details (`POST /orders/details/cars`)](#85-car-rental-order-details)
   - [8.6 Flight Order Details (`POST /orders/details/flights`)](#86-flight-order-details)
   - [8.7 Modify an Order (`POST /orders/modify`)](#87-modify-an-order)
   - [8.8 Cancel a Travel Service (`POST /orders/cancel`)](#88-cancel-a-travel-service)
9. [Standard Status Codes & Error Handling](#9-standard-status-codes--error-handling)

---

## 1. Overview & Architecture

The **Booking.com Demand API** enables Affiliate Partners to access Booking.com's travel inventory across the Connected Trip experience: accommodations, car rentals, flights, attractions, and taxis.

### Key Features in v3.2
- **Updated Pricing Structures:** Enhanced breakdown of base rate, taxes, fees, and localized currency amounts.
- **Reporting & Reconciliation:** Inclusion of `attractions` and `taxis` in `/orders/details` for unified post-booking synchronization.
- **Modular Order Lifecycle:** Deterministic progression from search → availability → order preview → order creation → modification/cancellation.

---

## 2. Environments & Base URLs

| Environment | Base URL | Description |
| :--- | :--- | :--- |
| **Production** | `https://demandapi.booking.com/3.2` | Live inventory and real payment processing |
| **Sandbox / Test** | `https://demandapi-sandbox.booking.com/3.2` | Test environment for integration and verification |

---

## 3. Global Authentication & Request Headers

All requests to the Demand API require Bearer token authentication and your unique Affiliate identifier:

| Header | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | `string` | **Yes** | Bearer token format: `Bearer <YOUR_API_TOKEN>` |
| `X-Affiliate-Id` | `integer` | **Yes** | Your numeric Booking.com Affiliate Partner identifier |
| `Content-Type` | `string` | **Yes** | Must be `application/json` |

---

## 4. Endpoint Catalog

### Common & Reference Data (`/common/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/common/locations/airports` | Standardized airport identifiers & metadata |
| `POST` | `/common/locations/cities` | Standardized city identifiers |
| `POST` | `/common/locations/countries` | Country codes (ISO 3166-1 alpha-2) |
| `POST` | `/common/locations/districts` | City districts & sub-regions |
| `POST` | `/common/locations/landmarks` | Key tourist landmarks & points of interest |
| `POST` | `/common/locations/regions` | Geographical regions |
| `POST` | `/common/payments/cards` | Supported credit/debit card types & validation rules |
| `POST` | `/common/payments/currencies` | Supported ISO 4217 3-letter currency codes |
| `POST` | `/common/languages` | Supported IETF BCP 47 language codes (lowercase) |

### Accommodations (`/accommodations/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/accommodations/search` | Search for properties matching destination, dates, and guests |
| `POST` | `/accommodations/availability` | Real-time availability, room rates, and cancellation policies |
| `POST` | `/accommodations/chains` | Hotel chain brand definitions |
| `POST` | `/accommodations/constants` | Constant lookup tables (facilities, room types, bed setups) |
| `POST` | `/accommodations/details` | Comprehensive property metadata, photos, and policies |
| `POST` | `/accommodations/details/changes`| Poll incremental property changes |
| `POST` | `/accommodations/reviews` | Guest reviews and ratings |
| `POST` | `/accommodations/reviews/scores` | Property review score aggregates and breakdown |

### Car Rentals (`/cars/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/cars/search` | Search vehicle categories and availability |
| `POST` | `/cars/details` | Detailed vehicle specifications, insurance, and terms |
| `POST` | `/cars/depots` | Pick-up and drop-off depot locations |
| `POST` | `/cars/depots/reviews/scores` | Supplier depot ratings and feedback scores |
| `POST` | `/cars/suppliers` | Car rental partner/supplier metadata |
| `POST` | `/cars/constants` | Vehicle classification and transmission codes |

### Orders & Booking Lifecycle (`/orders/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/orders/preview` | Pre-booking price lock, cancellation schedule, and preview |
| `POST` | `/orders/create` | Finalize and confirm a booking reservation |
| `POST` | `/orders/details` | Query orders by last-updated window (7-day max) or travel dates |
| `POST` | `/orders/details/accommodations` | Retrieve detailed accommodation reservation folios |
| `POST` | `/orders/details/cars` | Retrieve car rental booking records by reservation ID |
| `POST` | `/orders/details/flights` | Retrieve flight booking itinerary and ticket records |
| `POST` | `/orders/modify` | Update stay dates, guest allocation, or payment info |
| `POST` | `/orders/cancel` | Cancel an accommodation, car rental, or insurance item |

---

## 5. Common Reference Endpoints

Used to look up system constants, geography, and supported configurations prior to performing searches.

### Supported Currencies (`POST /common/payments/currencies`)
Returns all active ISO-4217 three-letter currency codes (e.g., `USD`, `EUR`, `GBP`, `LKR`).

### Supported Languages (`POST /common/languages`)
Returns all supported IETF language codes.  
*Note: Demand API strictly accepts lowercase codes (e.g., `en-us`, `nl`, `de`).*

---

## 6. Accommodation Endpoints

### 6.1 Search (`POST /accommodations/search`)
Query properties based on location coordinates, city ID, or landmark ID with check-in/out date ranges and guest counts.

### 6.2 Availability (`POST /accommodations/availability`)
Fetches dynamic rate plans, meal plans (breakfast included, half board), cancellation rules, and unique product identifiers needed to assemble an order.

---

## 7. Car Rental Endpoints

### 7.1 Search (`POST /cars/search`)
Returns available car offers, search tokens, depot operating hours, and optional extras (GPS, infant seats).

---

## 8. Orders & Booking Lifecycle

### 8.1 Preview an Order

#### Endpoint
`POST /orders/preview`

#### Purpose
Validates an order before checkout and computes final pricing, complete fee breakdown, payment schedule, and cancellation policies.

#### Request Headers
```http
Authorization: Bearer <YOUR_API_TOKEN>
X-Affiliate-Id: <AFFILIATE_ID>
Content-Type: application/json
```

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `currency` | `string` | **Yes** | ISO-4217 3-letter currency code (e.g., `EUR`, `USD`) |
| `accommodation` | `object` | Conditional | Accommodation preview payload (*mutually exclusive with `car`*) |
| `accommodation.checkin` | `string` | Yes | Check-in date (`YYYY-MM-DD`) |
| `accommodation.checkout` | `string` | Yes | Check-out date (`YYYY-MM-DD`) |
| `accommodation.products` | `array` | Yes | Array of product IDs selected from availability |
| `car` | `object` | Conditional | Car rental preview payload (*mutually exclusive with `accommodation`*) |
| `car.offer` | `integer` | Yes | Offer ID from car search |
| `car.search_token` | `string` | Yes | Encrypted search token string |
| `car.products` | `array` | No | Optional car add-ons (`id`, `amount`) |
| `car.insurance` | `object` | No | Optional insurance quote reference |

#### Code Example (Node.js)
```javascript
import fetch from 'node-fetch';

async function previewOrder() {
  const response = await fetch('https://demandapi.booking.com/3.2/orders/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Affiliate-Id': '123456',
      'Authorization': 'Bearer ' + process.env.BOOKING_API_KEY
    },
    body: JSON.stringify({
      currency: 'EUR',
      accommodation: {
        checkin: '2026-06-15',
        checkout: '2026-06-20',
        products: [
          { id: 'prod_4492019' }
        ]
      }
    })
  });

  const data = await response.json();
  console.log(data);
}
```

#### Response Structure (`200 OK`)
```json
{
  "request_id": "01fr9ez700exycb98w90w5r9sh",
  "data": {
    "pricing": {
      "total": {
        "currency": "EUR",
        "amount": "450.00"
      }
    },
    "policies": {
      "cancellation": {
        "refundable": true,
        "free_cancellation_until": "2026-06-13T23:59:59+00:00"
      }
    }
  }
}
```

---

### 8.2 Create and Confirm Order

#### Endpoint
`POST /orders/create`

#### Purpose
Creates and confirms an order using a valid `order_token` (derived from preview/availability), passenger/booker information, and payment authentication.

#### Request Headers
```http
Authorization: Bearer <YOUR_API_TOKEN>
X-Affiliate-Id: <AFFILIATE_ID>
Content-Type: application/json
```

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `order_token` | `string` | **Yes** | Token obtained during preview containing order parameters |
| `booker` | `object` | **Yes** | Booker contact and address information |
| `booker.name` | `object` | **Yes** | Booker's first and last name (`first_name`, `last_name`) |
| `booker.email` | `string` | **Yes** | Booker's primary email address |
| `booker.telephone` | `string` | **Yes** | Primary contact phone number |
| `booker.language` | `string` | No | Preferred IETF lowercase language code (e.g., `en-us`) |
| `booker.company` | `string` | No | Company name for business travelers |
| `booker.address` | `object` | Cond. | Address details (Required if property requires address) |
| `booker.address.address_line` | `string` | No | Street address |
| `booker.address.city` | `string` | No | City |
| `booker.address.country` | `string` | Yes | ISO 2-letter country code (regex: `^[a-z]{2}$`) |
| `booker.address.post_code` | `string` | No | Postal or ZIP code |
| `accommodation` | `object` | Cond. | Product guest mapping, remarks, arrival time |
| `accommodation.products` | `array` | Yes | Room product IDs and associated guest names |
| `accommodation.remarks` | `object` | No | `estimated_arrival_time`, `special_requests` |
| `payment` | `object` | **Yes** | Payment method and execution configuration |
| `payment.method` | `string` | **Yes** | Enum: `"card"`, `"airplus"`, `"wallet"` |
| `payment.timing` | `string` | **Yes** | Enum: `"pay_at_the_property"`, `"pay_online_now"`, `"pay_online_later"`, `"pay_at_pickup"`, `"pay_partial_online_now"` |
| `payment.card` | `object` | Cond. | Required if `method = "card"`: `cardholder`, `number`, `expiry_date` (`YYYY-MM`), `cvc` |
| `payment.include_receipt` | `boolean` | No | Whether to return `receipt_url` in response |

#### Code Example (Node.js)
```javascript
import fetch from 'node-fetch';

async function createOrder() {
  const response = await fetch('https://demandapi.booking.com/3.2/orders/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Affiliate-Id': '123456',
      'Authorization': 'Bearer ' + process.env.BOOKING_API_KEY
    },
    body: JSON.stringify({
      order_token: 'valid-order-preview-token',
      booker: {
        name: {
          first_name: 'John',
          last_name: 'Doe'
        },
        email: 'john.doe@example.com',
        telephone: '+1234567890',
        language: 'en-us',
        company: 'Acme Corp',
        address: {
          address_line: '100 Main Street',
          city: 'Amsterdam',
          country: 'nl',
          post_code: '1012AB'
        }
      },
      accommodation: {
        products: [
          {
            id: 'prod_4492019',
            bed_configuration: 'double',
            guests: [
              { name: 'John Doe', email: 'john.doe@example.com' }
            ]
          }
        ],
        remarks: {
          estimated_arrival_time: { hour: 14 },
          special_requests: 'Quiet room on upper floor preferred.'
        }
      },
      payment: {
        method: 'card',
        timing: 'pay_at_the_property',
        card: {
          cardholder: 'John Doe',
          number: '4111111111111111',
          expiry_date: '2028-12',
          cvc: '123'
        },
        include_receipt: true
      }
    })
  });

  const result = await response.json();
  console.log(result);
}
```

#### Response Structure (`200 OK`)
```json
{
  "request_id": "01fr9ez700exycb98w90w5r9sh",
  "data": {
    "order_id": "509430129718799",
    "status": "confirmed",
    "accommodation": {
      "reservation_id": "423984210",
      "property_id": "12984",
      "status": "confirmed"
    },
    "payment": {
      "status": "guaranteed",
      "receipt_url": "https://secure.booking.com/receipt/509430129718799"
    }
  }
}
```

---

### 8.3 Query Orders Details

#### Endpoint
`POST /orders/details`

#### Purpose
Poll and synchronize orders across supported travel services for financial reconciliation, reporting, and PMS integration. Can query by a 7-day updated window, travel dates, or specific IDs.

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `currency` | `string` | **Yes** | 3-letter currency code (e.g. `EUR`) |
| `updated` | `object` | Cond. | Filter by created/updated timestamp (max 7-day range, within past 1 year) |
| `updated.from` | `string` | Yes | ISO 8601 UTC timestamp (`YYYY-MM-DDTHH:mm:ss+00:00`) |
| `updated.to` | `string` | Yes | ISO 8601 UTC timestamp (>= `from`) |
| `maximum_results` | `integer` | No | Number of records to return (10 to 100, default: 100) |
| `sort` | `object` | No | `{ "by": "updated", "direction": "descending" }` |
| `services` | `string[]` | No | Restrict to: `["accommodations", "cars", "flights", "attractions", "taxis"]` |
| `extras` | `string[]` | No | Additional data fields, e.g., `["payment"]` |

#### Code Example (Node.js)
```javascript
import fetch from 'node-fetch';

async function fetchOrderUpdates() {
  const response = await fetch('https://demandapi.booking.com/3.2/orders/details', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Affiliate-Id': '123456',
      'Authorization': 'Bearer ' + process.env.BOOKING_API_KEY
    },
    body: JSON.stringify({
      currency: 'EUR',
      updated: {
        from: '2026-03-20T00:00:00+00:00',
        to: '2026-03-27T00:00:00+00:00'
      },
      maximum_results: 50,
      sort: {
        by: 'updated',
        direction: 'descending'
      },
      services: ['accommodations'],
      extras: ['payment']
    })
  });

  const result = await response.json();
  console.log(result);
}
```

#### Response Structure (`200 OK`)
```json
{
  "request_id": "01fr9ez700exycb98w90w5r9sh",
  "data": [
    {
      "order_id": "509430129718799",
      "created": "2026-03-21T10:14:02+00:00",
      "updated": "2026-03-22T08:30:12+00:00",
      "service": "accommodations",
      "status": "confirmed"
    }
  ],
  "metadata": {
    "total_results": 1,
    "next_page": null
  }
}
```

---

### 8.4 Accommodation Order Details

#### Endpoint
`POST /orders/details/accommodations`

#### Purpose
Retrieves comprehensive details for specific accommodation orders by Order ID or Reservation ID, including status, cancellation details, policies, and room breakdowns.

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `orders` | `string[]` | Cond. | Array of up to 100 Order IDs (mutually exclusive with `reservations`) |
| `reservations` | `string[]` | Cond. | Array of up to 100 Reservation IDs |
| `currency` | `string` | No | 3-letter currency code (e.g. `EUR`) |
| `language` | `string` | No | IETF language code (defaults to `en-gb`) |
| `extras` | `string[]` | No | Extras to include: `"accommodation_details"`, `"policies"`, `"extra_charges"` |

#### Code Example (Node.js)
```javascript
import fetch from 'node-fetch';

async function getAccommodationDetails() {
  const response = await fetch('https://demandapi.booking.com/3.2/orders/details/accommodations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Affiliate-Id': '123456',
      'Authorization': 'Bearer ' + process.env.BOOKING_API_KEY
    },
    body: JSON.stringify({
      orders: ['509430129718799'],
      currency: 'EUR',
      language: 'en-us',
      extras: ['accommodation_details', 'policies', 'extra_charges']
    })
  });

  const result = await response.json();
  console.log(result);
}
```

---

### 8.5 Car Rental Order Details

#### Endpoint
`POST /orders/details/cars`

#### Purpose
Retrieves detailed car rental order folios using reservation identifiers.

> **Deprecation Notice:** Providing `orders` (Order IDs) is **deprecated**. Always use `reservations` (Reservation IDs) for car rental orders.

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reservations` | `string[]` | **Yes** | Array of up to 100 car reservation IDs |
| `currency` | `string` | No | 3-letter currency code (e.g. `USD`, `EUR`) |
| `extras` | `string[]` | No | Optional extra details, e.g. `["policies"]` |

---

### 8.6 Flight Order Details

#### Endpoint
`POST /orders/details/flights`

#### Purpose
Retrieves flight bookings, flight segment itineraries with IATA airport codes, passenger seat allocations, and e-ticket status by Order ID or Reservation ID.

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `orders` | `string[]` | Cond. | Array of flight order IDs (max 100, mutually exclusive with `reservations`) |
| `reservations` | `string[]` | Cond. | Array of flight reservation IDs |
| `currency` | `string` | No | 3-letter currency code |

---

### 8.7 Modify an Order

#### Endpoint
`POST /orders/modify`

#### Purpose
Modifies parameters of an existing confirmed order, including stay dates (check-in/check-out), guest names, room configuration, or credit card billing details.

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `order` | `string` | **Yes** | Order ID to be modified |
| `modification` | `object` | **Yes** | Contains the modification instructions |
| `modification.accommodation` | `object` | Cond. | Accommodation modification details |
| `modification.accommodation.reservation` | `string` | Yes | Target reservation ID |
| `modification.accommodation.type` | `string` | Yes | Enum: `"dates"`, `"room"` |
| `modification.accommodation.change` | `object` | Yes | Object containing `checkin`/`checkout` strings or room updates |
| `modification.payment` | `object` | Cond. | Updated credit card details if resolving payment failures |

#### Code Example (Node.js)
```javascript
import fetch from 'node-fetch';

async function modifyBookingDates() {
  const response = await fetch('https://demandapi.booking.com/3.2/orders/modify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Affiliate-Id': '123456',
      'Authorization': 'Bearer ' + process.env.BOOKING_API_KEY
    },
    body: JSON.stringify({
      order: '509430129718799',
      modification: {
        accommodation: {
          reservation: '423984210',
          type: 'dates',
          change: {
            checkin: '2026-06-16',
            checkout: '2026-06-21'
          }
        }
      }
    })
  });

  const result = await response.json();
  console.log(result);
}
```

---

### 8.8 Cancel a Travel Service

#### Endpoint
`POST /orders/cancel`

#### Purpose
Cancels a specific travel service (accommodation reservation, car rental, or insurance policy) within an existing order.

> **Single Service Rule:** Only **one** travel service can be cancelled per request.

#### Cancellation Behavior
- **Accommodations:** Synchronous. Reservation is cancelled immediately and returns `{ "status": "successful" }`.
- **Car Rentals & Insurance:** Asynchronous. The cancellation request is accepted and completed in background processing.

#### Request Body Schema
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `order` | `string` | No | Unique order ID containing the service |
| `accommodation` | `object` | Cond. | Accommodation cancellation: `{ "reservation": "string", "reason": "string" }` |
| `car` | `object` | Cond. | Car cancellation: `{ "reservation": "string", "reason": "string", "booker": { "country": "nl" } }` |
| `insurance` | `object` | Cond. | Insurance policy cancellation |

#### Code Example (Node.js)
```javascript
import fetch from 'node-fetch';

async function cancelAccommodation() {
  const response = await fetch('https://demandapi.booking.com/3.2/orders/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Affiliate-Id': '123456',
      'Authorization': 'Bearer ' + process.env.BOOKING_API_KEY
    },
    body: JSON.stringify({
      accommodation: {
        reservation: '423984210',
        reason: 'Guest requested cancellation due to personal scheduling conflict.'
      }
    })
  });

  const result = await response.json();
  console.log(result);
}
```

#### Response Structure (`200 OK`)
```json
{
  "request_id": "01fr9ez700exycb98w90w5r9sh",
  "data": {
    "status": "successful"
  }
}
```

---

## 9. Standard Status Codes & Error Handling

All endpoints return a tracking `request_id` in both successful and error payloads. Always log this identifier for debugging and support tickets.

| HTTP Code | Name | Description |
| :--- | :--- | :--- |
| `200` | OK | Request processed successfully. |
| `400` | Bad Request | Validation error, missing required header, or schema format issue. |
| `403` | Forbidden | Unauthorized affiliate ID, invalid token, or insufficient partner permissions. |
| `409` | Conflict | Business state conflict (e.g., room rate is no longer available or booking cannot be modified). |
| `500` | Internal Server Error | Booking.com internal processing error. Retry with exponential backoff. |

### Standard Error Response Example
```json
{
  "request_id": "01fr9ez700exycb98w90w5r9sh",
  "errors": [
    {
      "code": "INVALID_PARAMETER",
      "message": "The field 'booker.address.country' must match the regex '^[a-z]{2}$'.",
      "field": "booker.address.country"
    }
  ]
}
```