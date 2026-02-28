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

describe('Events API', () => {
  let token: string;
  let eventId: string;

  beforeAll(async () => {
    const user = await createTestUser('EventHost', 2);
    token = user.accessToken;
  });

  it('POST /v1/events creates an event', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const dayAfter = new Date(Date.now() + 172800000).toISOString();

    const res = await request
      .post('/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Friday Night Social', description: 'A fun evening', startsAt: tomorrow, endsAt: dayAfter, type: 'party', capacity: 50 });
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

  it('GET /v1/events/:id/attendees returns privacy-safe attendee list', async () => {
    const res = await request
      .get(`/v1/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('personaType');
      expect(res.body.data[0]).toHaveProperty('badges');
      expect(res.body.data[0]).not.toHaveProperty('userId');
    }
  });

  it('GET /v1/events/:id/chat-rooms returns event chat rooms', async () => {
    const res = await request
      .get(`/v1/events/${eventId}/chat-rooms`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /v1/events accepts optional vibeTag', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const dayAfter = new Date(Date.now() + 172800000).toISOString();
    const res = await request
      .post('/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Vibe Night', startsAt: tomorrow, endsAt: dayAfter, vibeTag: 'social_mix' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    if (res.body.data.vibe_tag !== undefined) {
      expect(res.body.data.vibe_tag).toBe('social_mix');
    }
  });

  it('GET /v1/events/nearby accepts optional vibe filter', async () => {
    const res = await request
      .get('/v1/events/nearby?lat=0&lng=0&vibe=newbie_friendly')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Tonight feed API', () => {
  let token: string;

  beforeAll(async () => {
    const user = await createTestUser('TonightUser', 1);
    token = user.accessToken;
  });

  it('GET /v1/tonight returns events and venues with currentAttendees', async () => {
    const res = await request
      .get('/v1/tonight?lat=0&lng=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('events');
    expect(res.body.data).toHaveProperty('venues');
    expect(res.body.data).toHaveProperty('date');
    expect(Array.isArray(res.body.data.events)).toBe(true);
    expect(Array.isArray(res.body.data.venues)).toBe(true);
    if (res.body.data.venues.length > 0) {
      expect(res.body.data.venues[0]).toHaveProperty('currentAttendees');
    }
  });

  it('GET /v1/tonight accepts optional date param', async () => {
    const res = await request
      .get('/v1/tonight?lat=0&lng=0&date=2030-01-15')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.date).toBe('2030-01-15');
  });
});
