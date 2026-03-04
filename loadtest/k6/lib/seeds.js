/**
 * Seed loading: from file or from API.
 */
import { seedUsers, resetTestState, checkTestHealth } from './auth.js';

/**
 * Load seed users. Prefer SEED_FILE env; else call reset + seed API.
 * Reset clears Redis rate-limit/cache for deterministic baseline.
 */
export function loadSeeds(count, lat = 40.7128, lng = -74.006) {
  const seedFile = __ENV.SEED_FILE;
  if (seedFile) {
    try {
      const data = JSON.parse(open(seedFile));
      return data.users || data;
    } catch (e) {
      console.warn('SEED_FILE not found or invalid, falling back to API seed');
    }
  }
  if (!checkTestHealth()) {
    throw new Error('Test mode not enabled. Ensure TEST_MODE=true and backend /v1/test/health returns 200.');
  }
  resetTestState();
  return seedUsers(count, lat, lng).users;
}
