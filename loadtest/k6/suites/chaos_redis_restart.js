/**
 * Chaos test: simulates Redis restart / network blip.
 * Run manually: inject failure during load, verify system recovers.
 * Note: Actual Redis restart requires external orchestration; this suite
 * validates that 429 (rate limit) is returned under extreme load, not 500.
 */
import { sleep } from 'k6';
import { loadSeeds } from '../lib/seeds.js';
import { discoveryNearby } from '../scenarios/discovery_nearby.js';
import { getHealth } from '../lib/api.js';
import { check } from 'k6';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '10s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'runSpike',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{name:health}': ['p(95)<500'],
  },
};

export function setup() {
  const users = loadSeeds(600, 40.7128, -74.006);
  if (!users || users.length === 0) {
    throw new Error('Seed failed: no users.');
  }
  return { users };
}

export function runSpike(data) {
  const users = data.users;
  const u = users[__VU % users.length];
  const token = u && u.accessToken;
  if (!token) {
    sleep(1);
    return;
  }

  if (__ITER % 3 === 0) {
    const healthRes = getHealth();
    check(healthRes, { 'health 200': (r) => r.status === 200 });
  } else {
    discoveryNearby(token);
  }
  sleep(0.1 + Math.random() * 0.2);
}
