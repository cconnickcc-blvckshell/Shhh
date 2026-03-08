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

describe('Discovery API', () => {
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const user1 = await createTestUser('DiscUser1');
    token1 = user1.accessToken;
    const user2 = await createTestUser('DiscUser2');
    token2 = user2.accessToken;
  });

  it('POST /v1/discover/location updates user location', async () => {
    const res = await request
      .post('/v1/discover/location')
      .set('Authorization', `Bearer ${token1}`)
      .send({ lat: 40.7128, lng: -74.006 });
    expect(res.status).toBe(200);
  });

  it('second user updates location nearby', async () => {
    const res = await request
      .post('/v1/discover/location')
      .set('Authorization', `Bearer ${token2}`)
      .send({ lat: 40.7138, lng: -74.005, isPrecise: true });
    expect(res.status).toBe(200);
  });

  it('GET /v1/discover finds nearby users', async () => {
    const res = await request
      .get('/v1/discover')
      .set('Authorization', `Bearer ${token1}`)
      .query({ lat: '40.7128', lng: '-74.006', radius: '10' });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('validates discovery query parameters', async () => {
    const res = await request
      .get('/v1/discover')
      .set('Authorization', `Bearer ${token1}`)
      .query({ lat: 'invalid', lng: '-74.006' });
    expect(res.status).toBe(400);
  });

  it('A.6: blocked users do not appear in discovery', async () => {
    const blocker = await createTestUser('BlockDisc1', 1);
    const blocked = await createTestUser('BlockDisc2', 1);
    await request.post('/v1/discover/location').set('Authorization', `Bearer ${blocker.accessToken}`).send({ lat: 40.71, lng: -74.0 });
    await request.post('/v1/discover/location').set('Authorization', `Bearer ${blocked.accessToken}`).send({ lat: 40.711, lng: -74.001 });
    await request.post(`/v1/users/${blocked.userId}/block`).set('Authorization', `Bearer ${blocker.accessToken}`).send({});
    const res = await request
      .get('/v1/discover')
      .set('Authorization', `Bearer ${blocker.accessToken}`)
      .query({ lat: '40.71', lng: '-74.0', radius: '5' });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((u: { userId: string }) => u.userId);
    expect(ids).not.toContain(blocked.userId);
  });
});
