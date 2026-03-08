/**
 * B.6 Verification — Tier 2 ID flow, status, moderation resolve.
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
  closeRedis();
  await closeMongoDB();
});

describe('Verification API', () => {
  it('GET /v1/verification/status returns tier and history', async () => {
    const user = await createTestUser('VerifStatus');
    const res = await request
      .get('/v1/verification/status')
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentTier');
    expect(res.body.data).toHaveProperty('verifications');
    expect(Array.isArray(res.body.data.verifications)).toBe(true);
  });

  it('POST /v1/verification/id requires tier 1', async () => {
    const user = await createTestUser('VerifTier0', 0);
    const res = await request
      .post('/v1/verification/id')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ documentHash: 'a'.repeat(10) });
    expect(res.status).toBe(403);
  });

  it('POST /v1/verification/id accepts documentHash', async () => {
    const user = await createTestUser('VerifIdHash', 1);
    const res = await request
      .post('/v1/verification/id')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ documentHash: 'id-hash-' + Date.now().toString(36) });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('verificationId');
  });

  it('POST /v1/verification/id accepts idDocumentUrl', async () => {
    const user = await createTestUser('VerifIdUrl', 1);
    const res = await request
      .post('/v1/verification/id')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        documentHash: 'id-hash-' + Date.now().toString(36),
        idDocumentUrl: 'https://example.com/id-doc.jpg',
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('verificationId');
  });

  it('POST /v1/verification/id rejects duplicate pending', async () => {
    const user = await createTestUser('VerifDup', 1);
    const hash = 'id-hash-dup-' + Date.now();
    await request
      .post('/v1/verification/id')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ documentHash: hash });
    const res = await request
      .post('/v1/verification/id')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ documentHash: hash + '-2' });
    expect(res.status).toBe(409);
  });

  it('POST /v1/verification/id validates documentHash length', async () => {
    const user = await createTestUser('VerifShort', 1);
    const res = await request
      .post('/v1/verification/id')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ documentHash: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('Verification + Moderation resolve', () => {
  it('admin can resolve verification_id via moderation', async () => {
    const user = await createTestUser('VerifModUser', 1);
    const admin = await createTestUser('VerifModAdmin', 2, 'admin');

    const submitRes = await request
      .post('/v1/verification/id')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ documentHash: 'id-resolve-' + Date.now(), idDocumentUrl: 'https://example.com/id.jpg' });
    expect(submitRes.status).toBe(201);
    const verificationId = submitRes.body.data?.verificationId;

    const queueRes = await request
      .get('/v1/admin/moderation')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(queueRes.status).toBe(200);
    const items = queueRes.body.data || [];
    const verifItem = items.find((i: { type: string; target_id: string }) => i.type === 'verification_id' && i.target_id === verificationId);
    expect(verifItem).toBeDefined();

    const resolveRes = await request
      .post(`/v1/admin/moderation/${verifItem.id}/resolve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'approved' });
    expect(resolveRes.status).toBe(200);

    const { query } = await import('../src/config/database');
    const tier = await query('SELECT verification_tier FROM users WHERE id = $1', [user.userId]);
    expect(parseInt(tier.rows[0]?.verification_tier ?? '0')).toBe(2);
  });
});
