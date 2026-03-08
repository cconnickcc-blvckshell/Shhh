/**
 * Wave 4: Analytics events API
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

describe('Analytics API (Wave 4)', () => {
  let token: string;

  beforeAll(async () => {
    const user = await createTestUser('AnalyticsUser');
    token = user.accessToken;
  });

  it('POST /v1/analytics/events tracks event (204)', async () => {
    const res = await request
      .post('/v1/analytics/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ event_type: 'discovery_tile_impression', payload: { screen: 'discover' } });
    expect(res.status).toBe(204);
  });

  it('POST /v1/analytics/events rejects invalid event_type (400)', async () => {
    const res = await request
      .post('/v1/analytics/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ event_type: 'invalid-type-with-dashes!', payload: {} });
    expect(res.status).toBe(400);
  });

  it('POST /v1/analytics/events requires auth (401)', async () => {
    const res = await request
      .post('/v1/analytics/events')
      .send({ event_type: 'whisper_sent' });
    expect(res.status).toBe(401);
  });
});
