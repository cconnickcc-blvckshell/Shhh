import path from 'path';
import fs from 'fs';
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

const TEST_IMAGE = path.resolve(__dirname, 'fixtures/test.jpg');

beforeAll(() => {
  const dir = path.resolve(__dirname, 'fixtures');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(TEST_IMAGE)) {
    // Create a minimal valid JPEG (1x1 pixel)
    const buf = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
      0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
      0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
      0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
      0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
      0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
      0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
      0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
      0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
      0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
      0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
      0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
      0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
      0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
      0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
      0x00, 0x00, 0x3F, 0x00, 0x7B, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xFF, 0xD9,
    ]);
    fs.writeFileSync(TEST_IMAGE, buf);
  }
});

describe('Media & Albums API', () => {
  let token1: string;
  let token2: string;
  let userId2: string;
  let mediaId: string;
  let albumId: string;

  beforeAll(async () => {
    const u1 = await createTestUser('MediaUser1', 1);
    token1 = u1.accessToken;
    const u2 = await createTestUser('MediaUser2', 1);
    token2 = u2.accessToken;
    userId2 = u2.userId;
  });

  it('POST /v1/media/upload uploads a photo', async () => {
    const res = await request
      .post('/v1/media/upload')
      .set('Authorization', `Bearer ${token1}`)
      .attach('file', TEST_IMAGE)
      .field('category', 'photos');
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('url');
    mediaId = res.body.data.id;
  });

  it('GET /v1/media/my lists user media', async () => {
    const res = await request
      .get('/v1/media/my')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('POST /v1/media/upload/self-destruct creates self-destructing media', async () => {
    const res = await request
      .post('/v1/media/upload/self-destruct')
      .set('Authorization', `Bearer ${token1}`)
      .attach('file', TEST_IMAGE)
      .field('ttlSeconds', '60');
    expect(res.status).toBe(201);
    expect(res.body.data.selfDestructing).toBe(true);
    expect(res.body.data.expiresAt).toBeTruthy();
  });

  it('POST /v1/media/albums creates a private album', async () => {
    const res = await request
      .post('/v1/media/albums')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Private Collection', description: 'For special friends only', isPrivate: true });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Private Collection');
    albumId = res.body.data.id;
  });

  it('POST /v1/media/albums/:id/media adds photo to album', async () => {
    const res = await request
      .post(`/v1/media/albums/${albumId}/media`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ mediaId });
    expect(res.status).toBe(200);
  });

  it('GET /v1/media/albums/:id shows album with media (owner)', async () => {
    const res = await request
      .get(`/v1/media/albums/${albumId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.data.media).toHaveLength(1);
    expect(res.body.data.shares).toHaveLength(0);
  });

  it('GET /v1/media/albums/:id denied for non-shared user', async () => {
    const res = await request
      .get(`/v1/media/albums/${albumId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(404);
  });

  it('POST /v1/media/albums/:id/share shares album with user', async () => {
    const res = await request
      .post(`/v1/media/albums/${albumId}/share`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ userId: userId2, canDownload: false, expiresInHours: 24 });
    expect(res.status).toBe(200);
    expect(res.body.data.sharedWith).toBe(userId2);
    expect(res.body.data.expiresAt).toBeTruthy();
  });

  it('GET /v1/media/albums/:id now accessible by shared user', async () => {
    const res = await request
      .get(`/v1/media/albums/${albumId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(200);
    expect(res.body.data.media).toHaveLength(1);
  });

  it('GET /v1/media/albums/shared lists albums shared with me', async () => {
    const res = await request
      .get('/v1/media/albums/shared')
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].owner_name).toBe('MediaUser1');
  });

  it('DELETE /v1/media/albums/:id/share/:userId revokes share', async () => {
    const res = await request
      .delete(`/v1/media/albums/${albumId}/share/${userId2}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(204);
  });

  it('album no longer accessible after revoke', async () => {
    const res = await request
      .get(`/v1/media/albums/${albumId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(404);
  });

  it('POST /v1/media/:id/view tracks media view', async () => {
    const res = await request
      .post(`/v1/media/${mediaId}/view`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ durationMs: 5000 });
    expect(res.status).toBe(200);
  });

  it('DELETE /v1/media/:id deletes media', async () => {
    const uploadRes = await request
      .post('/v1/media/upload')
      .set('Authorization', `Bearer ${token1}`)
      .attach('file', TEST_IMAGE)
      .field('category', 'photos');
    const delRes = await request
      .delete(`/v1/media/${uploadRes.body.data.id}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(delRes.status).toBe(204);
  });
});
