import { request, uniquePhone } from './helpers';
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

describe('Auth API', () => {
  const testPhone = uniquePhone();
  const testDisplayName = 'TestUser';
  let accessToken: string;
  let refreshToken: string;

  it('GET /health returns ok', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.modules).toContain('auth');
  });

  it('POST /v1/auth/register creates a new user', async () => {
    const res = await request
      .post('/v1/auth/register')
      .send({ phone: testPhone, displayName: testDisplayName });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('userId');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('POST /v1/auth/register rejects duplicate phone', async () => {
    const res = await request
      .post('/v1/auth/register')
      .send({ phone: testPhone, displayName: 'Another' });
    expect(res.status).toBe(409);
  });

  it('POST /v1/auth/login authenticates existing user', async () => {
    const res = await request
      .post('/v1/auth/login')
      .send({ phone: testPhone });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('POST /v1/auth/refresh rotates tokens', async () => {
    const res = await request
      .post('/v1/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;
  });

  it('GET /v1/users/me returns the current user profile', async () => {
    const res = await request
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe(testDisplayName);
  });

  it('PUT /v1/users/me updates profile', async () => {
    const res = await request
      .put('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bio: 'Hello world', gender: 'couple', experienceLevel: 'curious' });
    expect(res.status).toBe(200);
    expect(res.body.data.bio).toBe('Hello world');
  });

  it('DELETE /v1/auth/logout revokes tokens', async () => {
    const res = await request
      .delete('/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(204);
  });

  it('rejects requests without auth token', async () => {
    const res = await request.get('/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('validates input - rejects short phone', async () => {
    const res = await request
      .post('/v1/auth/register')
      .send({ phone: '123', displayName: 'Test' });
    expect(res.status).toBe(400);
  });
});
