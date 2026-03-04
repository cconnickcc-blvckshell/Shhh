/**
 * Auth login scenario: send-code → verify → login (or register).
 * Uses devCode in test env. For seed-based runs, this scenario is skipped.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../lib/config.js';
import { authHeaders } from '../lib/auth.js';
import { errorRate } from '../lib/metrics.js';

export function authLogin(phone, displayName) {
  const sendRes = http.post(
    `${BASE_URL}/v1/auth/phone/send-code`,
    JSON.stringify({ phone }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'auth_send_code' } }
  );
  if (!check(sendRes, { 'send-code 200': (r) => r.status === 200 })) {
    errorRate.add(1);
    return null;
  }
  const devCode = sendRes.json('data.devCode');
  if (!devCode) {
    errorRate.add(1);
    return null;
  }

  const verifyRes = http.post(
    `${BASE_URL}/v1/auth/phone/verify`,
    JSON.stringify({ phone, code: devCode }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'auth_verify' } }
  );
  if (!check(verifyRes, { 'verify 200': (r) => r.status === 200 })) {
    errorRate.add(1);
    return null;
  }
  const sessionToken = verifyRes.json('data.sessionToken');
  if (!sessionToken) {
    errorRate.add(1);
    return null;
  }

  const regRes = http.post(
    `${BASE_URL}/v1/auth/register`,
    JSON.stringify({ phone, displayName, sessionToken }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'auth_register' } }
  );
  if (!check(regRes, { 'register 201': (r) => r.status === 201 })) {
    errorRate.add(1);
    return null;
  }
  errorRate.add(0);
  return regRes.json('data');
}
