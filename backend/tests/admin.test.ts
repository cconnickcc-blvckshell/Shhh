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

describe('Admin API', () => {
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    const admin = await createTestUser('AdminUser', 2);
    adminToken = admin.accessToken;
    const user = await createTestUser('RegularUser');
    userId = user.userId;
  });

  it('GET /v1/admin/stats returns dashboard stats', async () => {
    const res = await request
      .get('/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('moderation');
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('reports');
  });

  it('GET /v1/admin/moderation returns queue', async () => {
    const res = await request
      .get('/v1/admin/moderation')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /v1/admin/users/:userId returns user detail', async () => {
    const res = await request
      .get(`/v1/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data).toHaveProperty('profile');
  });

  it('POST /v1/admin/users/:userId/trust-score calculates score', async () => {
    const res = await request
      .post(`/v1/admin/users/${userId}/trust-score`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalScore');
    expect(res.body.data).toHaveProperty('badge');
  });

  it('GET /v1/admin/audit-logs returns logs', async () => {
    const res = await request
      .get('/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('rejects non-admin users', async () => {
    const user = await createTestUser('LowTierUser', 0);
    const res = await request
      .get('/v1/admin/stats')
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(403);
  });
});
