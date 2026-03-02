import supertest from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { query } from '../src/config/database';

const app = createApp();
export const request = supertest(app);

let counter = Date.now();

export function uniquePhone(): string {
  counter++;
  return `+1555${counter.toString().slice(-7)}`;
}

export async function createTestUser(displayName: string = 'TestUser', tier: number = 0, role?: string) {
  const phone = uniquePhone();
  const res = await request
    .post('/v1/auth/register')
    .send({ phone, displayName });

  const { userId, accessToken, refreshToken } = res.body.data;

  if (tier > 0 || role) {
    if (tier > 0) await query('UPDATE users SET verification_tier = $1 WHERE id = $2', [tier, userId]);
    if (role) await query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    const newToken = jwt.sign(
      { userId, tier },
      process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production-abc123xyz',
      { expiresIn: '15m' } as jwt.SignOptions
    );
    return { userId, accessToken: newToken, refreshToken, phone };
  }

  return { userId, accessToken, refreshToken, phone };
}
