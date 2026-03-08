/**
 * A.6 Visibility Policy — block checks across profile, like, pass, messaging, whisper.
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

describe('Visibility Policy (Block Checks)', () => {
  let userA: { userId: string; accessToken: string };
  let userB: { userId: string; accessToken: string };

  beforeAll(async () => {
    userA = await createTestUser('BlockTesterA', 1);
    userB = await createTestUser('BlockTesterB', 1);
  });

  it('A blocks B', async () => {
    const res = await request
      .post(`/v1/users/${userB.userId}/block`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({});
    expect(res.status).toBe(204);
  });

  it('A cannot view B profile (404)', async () => {
    const res = await request
      .get(`/v1/users/${userB.userId}/profile`)
      .set('Authorization', `Bearer ${userA.accessToken}`);
    expect(res.status).toBe(404);
  });

  it('B cannot view A profile (404)', async () => {
    const res = await request
      .get(`/v1/users/${userA.userId}/profile`)
      .set('Authorization', `Bearer ${userB.accessToken}`);
    expect(res.status).toBe(404);
  });

  it('A cannot like B (403)', async () => {
    const res = await request
      .post(`/v1/users/${userB.userId}/like`)
      .set('Authorization', `Bearer ${userA.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('A cannot pass B (403)', async () => {
    const res = await request
      .post(`/v1/users/${userB.userId}/pass`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('A cannot create conversation with B (403)', async () => {
    const res = await request
      .post('/v1/conversations')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ participantIds: [userA.userId, userB.userId] });
    expect(res.status).toBe(403);
  });

  it('A cannot send whisper to B (403)', async () => {
    const res = await request
      .post('/v1/whispers')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ toUserId: userB.userId, message: 'Hi' });
    expect(res.status).toBe(403);
  });

  it('unblocked users can view each other', async () => {
    const u1 = await createTestUser('ViewTester1', 1);
    const u2 = await createTestUser('ViewTester2', 1);
    const res = await request
      .get(`/v1/users/${u2.userId}/profile`)
      .set('Authorization', `Bearer ${u1.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('displayName');
  });
});
