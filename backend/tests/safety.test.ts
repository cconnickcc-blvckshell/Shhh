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

describe('Safety API', () => {
  let token: string;
  let contactId: string;

  beforeAll(async () => {
    const u = await createTestUser('SafetyUser');
    token = u.accessToken;
  });

  it('POST /v1/safety/contacts adds emergency contact', async () => {
    const res = await request
      .post('/v1/safety/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jane Doe', phone: '+15559998888', relationship: 'friend' });
    expect(res.status).toBe(201);
    contactId = res.body.data.id;
  });

  it('GET /v1/safety/contacts lists contacts', async () => {
    const res = await request
      .get('/v1/safety/contacts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('POST /v1/safety/checkin records a check-in', async () => {
    const res = await request
      .post('/v1/safety/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'arrived', lat: 40.7128, lng: -74.006, nextCheckInMinutes: 60 });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeDefined();
  });

  it('POST /v1/safety/panic triggers panic alert', async () => {
    const res = await request
      .post('/v1/safety/panic')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: 40.7128, lng: -74.006 });
    expect(res.status).toBe(200);
    expect(res.body.data.checkinId).toBeDefined();
    expect(res.body.data.contactsNotified).toBe(0); // Notifications to contacts not yet implemented
    expect(res.body.data.emergencyContactsOnFile).toBe(1);
  });

  it('DELETE /v1/safety/contacts/:id removes contact', async () => {
    const res = await request
      .delete(`/v1/safety/contacts/${contactId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
