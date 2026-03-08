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

describe('Messaging API', () => {
  it('GET /v1/conversations/sync returns total and data', async () => {
    const user = await createTestUser('SyncTester');
    const res = await request
      .get('/v1/conversations/sync')
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('serverTime');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /v1/conversations/sync requires auth', async () => {
    const res = await request.get('/v1/conversations/sync');
    expect(res.status).toBe(401);
  });
});
