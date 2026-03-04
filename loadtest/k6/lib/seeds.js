/**
 * Seed loading: from file or from API.
 */
import { seedUsers } from './auth.js';

/**
 * Load seed users. Prefer SEED_FILE env; else call seed API.
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
  return seedUsers(count, lat, lng).users;
}
