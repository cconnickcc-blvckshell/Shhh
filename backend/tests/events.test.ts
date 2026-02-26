import supertest from 'supertest';
import { createApp } from '../src/app';
import { getPool, closePool, query } from '../src/config/database';
import { getRedis, closeRedis } from '../src/config/redis';
import { connectMongoDB, closeMongoDB } from '../src/config/mongodb';

const app = createApp();
const request = supertest(app);

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

describe('Events API', () => {
  let token: string;
  let userId: string;
  let eventId: string;

  beforeAll(async () => {
    const res = await request
      .post('/v1/auth/register')
      .send({ phone: '+15558880001', displayName: 'EventHost' });
    token = res.body.data.accessToken;
    userId = res.body.data.userId;

    await query('UPDATE users SET verification_tier = 2 WHERE id = $1', [userId]);

    const jwt = await import('jsonwebtoken');
    token = jwt.sign(
      { userId, tier: 2 },
      process.env.JWT_SECRET || 'dev-jwt-secret',
      { expiresIn: '15m' }
    );
  });

  it('POST /v1/events creates an event', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const dayAfter = new Date(Date.now() + 172800000).toISOString();

    const res = await request
      .post('/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Friday Night Social',
        description: 'A fun evening',
        startsAt: tomorrow,
        endsAt: dayAfter,
        type: 'party',
        capacity: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    eventId = res.body.data.id;
  });

  it('GET /v1/events/:id returns the event', async () => {
    const res = await request
      .get(`/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Friday Night Social');
  });

  it('POST /v1/events/:id/rsvp allows RSVP', async () => {
    const res = await request
      .post(`/v1/events/${eventId}/rsvp`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'going' });

    expect(res.status).toBe(200);
  });

  it('POST /v1/events/:id/checkin allows check-in', async () => {
    const res = await request
      .post(`/v1/events/${eventId}/checkin`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
