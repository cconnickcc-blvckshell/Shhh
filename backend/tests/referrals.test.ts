/**
 * Wave 5: Referral flow
 */
import { request, createTestUser } from './helpers';
import { getPool, closePool } from '../src/config/database';
import { getRedis, closeRedis } from '../src/config/redis';
import { connectMongoDB, closeMongoDB } from '../src/config/mongodb';

beforeAll(async () => {
  await getPool().query('SELECT 1');
  getRedis();
  await connectMongoDB();
});

afterAll(async () => {
  await closePool();
  await closeRedis();
  await closeMongoDB();
});

describe('Referrals API (Wave 5)', () => {
  let token: string;
  let code: string;

  beforeAll(async () => {
    const user = await createTestUser('ReferralUser');
    token = user.accessToken;
  });

  it('GET /v1/referrals/me returns code and referredCount', async () => {
    const res = await request
      .get('/v1/referrals/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('code');
    expect(res.body.data).toHaveProperty('referredCount');
    expect(typeof res.body.data.code).toBe('string');
    expect(res.body.data.code.length).toBeGreaterThanOrEqual(4);
    code = res.body.data.code;
  });

  it('GET /v1/referrals/me returns same code on second call', async () => {
    const res = await request
      .get('/v1/referrals/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe(code);
  });

  it('GET /v1/referrals/me requires auth (401)', async () => {
    const res = await request.get('/v1/referrals/me');
    expect(res.status).toBe(401);
  });
});
