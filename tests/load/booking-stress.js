import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users over 30s
    { duration: '1m', target: 20 },  // Stay at 20 users for 1m
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate a user checking room availability
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7); // Next week
  
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3); // 3 days stay

  const res = http.get(`${BASE_URL}/api/rooms/availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}&adults=2`);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'returns rooms': (r) => r.json() && Array.isArray(r.json()),
  });

  // Random sleep between 1 and 3 seconds to simulate user think time
  sleep(Math.random() * 2 + 1);
}
