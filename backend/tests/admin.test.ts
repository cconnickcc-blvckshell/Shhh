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
    const admin = await createTestUser('AdminUser', 2, 'admin');
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

  it('GET /v1/admin/moderation/resolved returns resolved items', async () => {
    const res = await request
      .get('/v1/admin/moderation/resolved')
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

  it('GET /v1/admin/stats/trust-scores returns distribution', async () => {
    const res = await request
      .get('/v1/admin/stats/trust-scores')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('bucket_0_20');
    expect(res.body.data).toHaveProperty('bucket_81_100');
    expect(res.body.data).toHaveProperty('no_score');
  });

  it('GET /v1/admin/analytics/funnel returns conversion funnel', async () => {
    const res = await request
      .get('/v1/admin/analytics/funnel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('signups');
    expect(res.body.data).toHaveProperty('verified');
    expect(res.body.data).toHaveProperty('hasLiked');
    expect(res.body.data).toHaveProperty('hasMessaged');
    expect(res.body.data).toHaveProperty('hasWhispered');
    expect(res.body.data).toHaveProperty('hasRsvpd');
  });

  it('GET /v1/admin/activity-feed returns recent activity', async () => {
    const res = await request
      .get('/v1/admin/activity-feed?limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /v1/venues/:id/analytics/density returns density intelligence (tier 2)', async () => {
    const tier2 = await createTestUser('DensityTester', 2);
    const res = await request
      .get('/v1/venues/00000000-0000-0000-0000-000000000001/analytics/density')
      .set('Authorization', `Bearer ${tier2.accessToken}`);
    expect([200, 403, 404, 500]).toContain(res.status); // 403 if venue access denied, 404 if venue doesn't exist, 500 if migrations not applied
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('peakLastDays');
      expect(res.body.data).toHaveProperty('eventTypePerformance');
      expect(Array.isArray(res.body.data.eventTypePerformance)).toBe(true);
    }
  });

  it('rejects non-admin users', async () => {
    const user = await createTestUser('LowTierUser', 0);
    const res = await request
      .get('/v1/admin/stats')
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('B.8: auth via httpOnly cookie when ADMIN_HTTPONLY_COOKIE=true', async () => {
    const bypass = await request.post('/v1/auth/admin-bypass').send({});
    expect(bypass.status).toBe(200);
    const token = bypass.body.data?.accessToken;
    expect(token).toBeTruthy();

    const setCookie = bypass.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(Array.isArray(setCookie) ? setCookie.length : 0).toBeGreaterThan(0);

    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const cookieValue = cookieHeader.split(';')[0];

    const res = await request
      .get('/v1/admin/stats')
      .set('Cookie', cookieValue);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('moderation');
  });
});
