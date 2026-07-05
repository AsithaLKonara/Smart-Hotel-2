import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: 10,
  maxVUs: 10,
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Sustained load
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests should be below 1000ms
    'http_req_failed': ['rate<0.05'],    // Error rate < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@smarthotel.com';
const ADMIN_PASSWORD = 'SmartHotel@2025!';

// We perform login in setup to get an auth cookie to share across VUs
export function setup() {
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`);
  let csrfToken = '';
  if (csrfRes.json()) {
    csrfToken = csrfRes.json().csrfToken;
  }
  
  const loginRes = http.post(`${BASE_URL}/api/auth/callback/credentials`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    csrfToken: csrfToken,
    json: 'true',
    redirect: 'false'
  });

  let sessionCookie = '';
  if (loginRes.cookies['next-auth.session-token']) {
    sessionCookie = loginRes.cookies['next-auth.session-token'][0].value;
  } else if (loginRes.cookies['__Secure-next-auth.session-token']) {
    sessionCookie = loginRes.cookies['__Secure-next-auth.session-token'][0].value;
  }

  return { sessionCookie };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${data.sessionCookie}; __Secure-next-auth.session-token=${data.sessionCookie}`
  };

  group('Availability Search', function () {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30));
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);

    const res = http.get(`${BASE_URL}/api/rooms/availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}&adults=2`);
    check(res, {
      'availability status 200': (r) => r.status === 200,
    });
  });
  sleep(1);

  group('Rooms Fetch', function () {
    const res = http.get(`${BASE_URL}/api/rooms`, { headers });
    check(res, {
      'rooms fetch successful': (r) => r.status === 200,
    });
  });
  sleep(1);

  group('FAQ Search', function () {
    const res = http.get(`${BASE_URL}/api/faq`, { headers });
    check(res, {
      'faq search status 200': (r) => r.status === 200,
    });
  });
  sleep(1);
}
