import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const discoverDuration = new Trend('discover_duration');

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.05'],
  },
};

function randomPhone() {
  return `+1555${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

export default function () {
  // Register
  const phone = randomPhone();
  const regRes = http.post(`${BASE_URL}/v1/auth/register`, JSON.stringify({
    phone, displayName: `User_${phone.slice(-4)}`,
  }), { headers: { 'Content-Type': 'application/json' } });

  const regOk = check(regRes, { 'register 201': (r) => r.status === 201 });
  errorRate.add(!regOk);
  authDuration.add(regRes.timings.duration);

  if (regRes.status !== 201) { sleep(1); return; }

  const token = regRes.json('data.accessToken');
  const authHeaders = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };

  // Update location
  http.post(`${BASE_URL}/v1/discover/location`, JSON.stringify({
    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
    lng: -74.006 + (Math.random() - 0.5) * 0.1,
  }), authHeaders);

  // Discover nearby
  const discRes = http.get(`${BASE_URL}/v1/discover?lat=40.7128&lng=-74.006&radius=50`, authHeaders);
  const discOk = check(discRes, { 'discover 200': (r) => r.status === 200 });
  errorRate.add(!discOk);
  discoverDuration.add(discRes.timings.duration);

  // Get profile
  http.get(`${BASE_URL}/v1/users/me`, authHeaders);

  // Health check
  http.get(`${BASE_URL}/health`);

  sleep(1);
}
