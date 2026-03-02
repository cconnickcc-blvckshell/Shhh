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

describe('Couples API', () => {
  let token1: string;
  let token2: string;
  let inviteCode: string;

  beforeAll(async () => {
    const u1 = await createTestUser('Partner1');
    token1 = u1.accessToken;
    const u2 = await createTestUser('Partner2');
    token2 = u2.accessToken;
  });

  it('POST /v1/couples creates a couple profile with invite code', async () => {
    const res = await request
      .post('/v1/couples')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(201);
    expect(res.body.data.inviteCode).toHaveLength(8);
    inviteCode = res.body.data.inviteCode;
  });

  it('POST /v1/couples/link links partner with invite code', async () => {
    const res = await request
      .post('/v1/couples/link')
      .set('Authorization', `Bearer ${token2}`)
      .send({ inviteCode });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });

  it('GET /v1/couples/me returns couple info', async () => {
    const res = await request
      .get('/v1/couples/me')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.partner_1_name).toBe('Partner1');
  });

  it('POST /v1/couples/dissolve starts dissolution with cooldown', async () => {
    const res = await request
      .post('/v1/couples/dissolve')
      .set('Authorization', `Bearer ${token1}`)
      .send({ reason: 'Amicable split' });
    expect(res.status).toBe(200);
    expect(res.body.data.cooldownExpires).toBeDefined();
  });
});
