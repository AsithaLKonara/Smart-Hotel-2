import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent virtual users
    { duration: '1m', target: 50 },   // Sustain load
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'], // 95% of requests must complete under 150ms
    http_req_failed: ['rate<0.01'],    // Under 1% failures
  },
};

export default function () {
  const payload = JSON.stringify({
    roomId: 'room-101',
    propertyId: 'prop-01',
    guestId: 'guest-501',
    businessDate: '2026-05-08',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'RECEPTIONIST',
    },
  };

  // 1. Simulate check-in request load
  const checkinRes = http.post('http://localhost:3000/api/check-in', payload, params);
  check(checkinRes, {
    'checkin status was 200': (r) => r.status === 200,
    'checkin transaction success': (r) => r.json().success === true,
  });

  sleep(0.5);

  // 2. Simulate payment capture hold load
  const paymentPayload = JSON.stringify({
    bookingId: 'book-901',
    amount: 150.00,
    currency: 'USD',
  });

  const paymentRes = http.post('http://localhost:3000/api/payments/capture', paymentPayload, params);
  check(paymentRes, {
    'payment status was 200': (r) => r.status === 200,
    'payment capture completed': (r) => r.json().captured === true,
  });

  sleep(1);
}
