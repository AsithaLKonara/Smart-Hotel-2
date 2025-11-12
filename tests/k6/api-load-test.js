import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiResponseTime = new Trend('api_response_time')

// Test configuration for API endpoints
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 requests/second
    { duration: '3m', target: 100 },  // Stay at 100 requests/second
    { duration: '1m', target: 50 },   // Ramp down
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

const endpoints = [
  { method: 'GET', path: '/api/rooms', name: 'Get Rooms' },
  { method: 'GET', path: '/api/restaurant/menu', name: 'Get Menu' },
  { method: 'GET', path: '/api/health/live', name: 'Health Live' },
  { method: 'GET', path: '/api/health/ready', name: 'Health Ready' },
]

export default function () {
  // Test each endpoint
  endpoints.forEach((endpoint) => {
    const startTime = Date.now()
    const response = http.request(endpoint.method, `${BASE_URL}${endpoint.path}`)
    const duration = Date.now() - startTime

    apiResponseTime.add(duration)

    const checkResult = check(response, {
      [`${endpoint.name} status is 200`]: (r) => r.status === 200,
      [`${endpoint.name} response time < 500ms`]: (r) => r.timings.duration < 500,
    })

    errorRate.add(!checkResult)
    sleep(0.5)
  })
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  }
}

function textSummary(data, options) {
  let summary = '\n📊 API Load Test Summary\n'
  summary += '='.repeat(50) + '\n\n'
  
  summary += `Total Requests: ${data.metrics.http_reqs.values.count}\n`
  summary += `Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`
  summary += `Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`
  summary += `p95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`
  summary += `p99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`
  
  return summary
}

