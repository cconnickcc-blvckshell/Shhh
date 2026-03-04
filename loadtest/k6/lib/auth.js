/**
 * Auth helpers for k6: seed-based tokens or OTP flow (dev/test).
 */
import http from 'k6/http';
import { BASE_URL } from './config.js';

/**
 * Fetch tokens from seed endpoint (TEST_MODE). Creates N users deterministically.
 * @param {number} count - Number of users to seed
 * @param {number} lat - Center lat for user geos
 * @param {number} lng - Center lng for user geos
 * @returns {{ users: Array<{ userId: string, accessToken: string, refreshToken: string, phone: string }> }}
 */
export function seedUsers(count, lat = 40.7128, lng = -74.006) {
  const res = http.post(
    `${BASE_URL}/v1/test/seed`,
    JSON.stringify({ count, lat, lng }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status !== 200) {
    throw new Error(`Seed failed: ${res.status} ${res.body}`);
  }
  const data = res.json();
  return data.data || data;
}

/**
 * Full OTP flow: send-code → verify → register. Use when seed not available.
 */
export function registerWithOTP(phone, displayName) {
  const sendRes = http.post(
    `${BASE_URL}/v1/auth/phone/send-code`,
    JSON.stringify({ phone }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (sendRes.status !== 200) return null;
  const devCode = sendRes.json('data.devCode');
  if (!devCode) return null;

  const verifyRes = http.post(
    `${BASE_URL}/v1/auth/phone/verify`,
    JSON.stringify({ phone, code: devCode }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (verifyRes.status !== 200) return null;
  const sessionToken = verifyRes.json('data.sessionToken');
  if (!sessionToken) return null;

  const regRes = http.post(
    `${BASE_URL}/v1/auth/register`,
    JSON.stringify({ phone, displayName, sessionToken }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (regRes.status !== 201) return null;
  return regRes.json('data');
}

/**
 * Get auth headers for API calls.
 */
export function authHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}
