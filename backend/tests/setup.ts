import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../..', '.env') });

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.ADMIN_HTTPONLY_COOKIE = 'true';

// Stub jwks-rsa (pulls in ESM-only jose) so Jest can run without transforming node_modules
jest.mock('jwks-rsa', () => {
  return jest.fn(() => ({
    getSigningKey: jest.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key-for-test',
    }),
  }));
});
