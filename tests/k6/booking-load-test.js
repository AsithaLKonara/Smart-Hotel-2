import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const bookingSuccessRate = new Rate('booking_success_rate')

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    booking_success_rate: ['rate>0.9'], // Booking success rate must be above 90%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // Test room search
  const searchResponse = http.get(`${BASE_URL}/api/rooms`)
  check(searchResponse, {
    'room search status is 200': (r) => r.status === 200,
    'room search response time < 1000ms': (r) => r.timings.duration < 1000,
  })

  sleep(1)

  // Test booking creation
  const bookingPayload = {
    userId: `test-user-${__VU}`,
    roomId: 'test-room-1',
    checkIn: '2025-11-01',
    checkOut: '2025-11-03',
    paymentMethod: 'pay_now',
  }

  const bookingResponse = http.post(
    `${BASE_URL}/api/bookings`,
    JSON.stringify(bookingPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
    }
  )

  const bookingSuccess = check(bookingResponse, {
    'booking creation status is 201': (r) => r.status === 201,
    'booking creation response time < 2000ms': (r) => r.timings.duration < 2000,
    'booking response has ID': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.id !== undefined
      } catch (e) {
        return false
      }
    },
  })

  bookingSuccessRate.add(bookingSuccess)

  sleep(2)

  // Test booking retrieval
  const bookingsResponse = http.get(`${BASE_URL}/api/bookings`, {
    headers: {
      'Authorization': 'Bearer test-token',
    },
  })

  check(bookingsResponse, {
    'bookings retrieval status is 200': (r) => r.status === 200,
    'bookings retrieval response time < 1000ms': (r) => r.timings.duration < 1000,
  })

  sleep(1)
}

export function handleSummary(data) {
  return {
    'k6-results.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
