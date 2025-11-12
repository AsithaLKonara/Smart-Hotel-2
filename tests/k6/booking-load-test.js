import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 50 },    // Ramp down to 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
    errors: ['rate<0.01'],                          // Custom error rate < 1%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // Test 1: Get rooms (public endpoint)
  const roomsResponse = http.get(`${BASE_URL}/api/rooms`)
  const roomsCheck = check(roomsResponse, {
    'rooms status is 200': (r) => r.status === 200,
    'rooms response time < 500ms': (r) => r.timings.duration < 500,
    'rooms has data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.rooms && data.rooms.length > 0
      } catch {
        return false
      }
    },
  })
  errorRate.add(!roomsCheck)
  sleep(1)

  // Test 2: Get restaurant menu (public endpoint)
  const menuResponse = http.get(`${BASE_URL}/api/restaurant/menu`)
  const menuCheck = check(menuResponse, {
    'menu status is 200': (r) => r.status === 200,
    'menu response time < 300ms': (r) => r.timings.duration < 300,
  })
  errorRate.add(!menuCheck)
  sleep(1)

  // Test 3: Health check
  const healthResponse = http.get(`${BASE_URL}/api/health/live`)
  const healthCheck = check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  })
  errorRate.add(!healthCheck)
  sleep(1)

  // Test 4: Create booking (simulated - may require auth)
  const bookingPayload = JSON.stringify({
    roomId: 'test-room-id',
    checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    guests: 2,
    paymentMethod: 'pay_later',
  })

  const bookingResponse = http.post(
    `${BASE_URL}/api/bookings`,
    bookingPayload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const bookingCheck = check(bookingResponse, {
    'booking status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'booking response time < 1000ms': (r) => r.timings.duration < 1000,
  })
  errorRate.add(!bookingCheck)
  sleep(2)
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  }
}

function textSummary(data, options) {
  let summary = '\n📊 Load Test Summary\n'
  summary += '='.repeat(50) + '\n\n'
  
  summary += `Total Requests: ${data.metrics.http_reqs.values.count}\n`
  summary += `Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`
  summary += `Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`
  summary += `p95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`
  summary += `p99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`
  
  return summary
}
