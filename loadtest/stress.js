import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

export const options = {
  scenarios: {
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.1'],
    http_req_failed: ['rate<0.1'],
  },
};

const tokens = [];

export function setup() {
  const results = [];
  for (let i = 0; i < 20; i++) {
    const phone = `+1555${Date.now().toString().slice(-7)}${i}`;
    const res = http.post(`${BASE_URL}/v1/auth/register`, JSON.stringify({
      phone, displayName: `StressUser${i}`,
    }), { headers: { 'Content-Type': 'application/json' } });

    if (res.status === 201) {
      results.push(res.json('data.accessToken'));
      http.post(`${BASE_URL}/v1/discover/location`, JSON.stringify({
        lat: 40.7128 + (Math.random() - 0.5) * 0.05,
        lng: -74.006 + (Math.random() - 0.5) * 0.05,
      }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${res.json('data.accessToken')}` } });
    }
  }
  return { tokens: results };
}

export default function (data) {
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  if (!token) { sleep(1); return; }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const actions = [
    () => http.get(`${BASE_URL}/health`),
    () => http.get(`${BASE_URL}/v1/users/me`, authHeaders),
    () => http.get(`${BASE_URL}/v1/discover?lat=40.7128&lng=-74.006&radius=50`, authHeaders),
    () => http.get(`${BASE_URL}/v1/conversations`, authHeaders),
    () => http.get(`${BASE_URL}/v1/events/nearby?lat=40.7128&lng=-74.006`, authHeaders),
    () => http.get(`${BASE_URL}/v1/safety/contacts`, authHeaders),
  ];

  const action = actions[Math.floor(Math.random() * actions.length)];
  const res = action();

  const ok = check(res, { 'status ok': (r) => r.status >= 200 && r.status < 400 });
  errorRate.add(!ok);
  apiDuration.add(res.timings.duration);

  sleep(0.5 + Math.random());
}
