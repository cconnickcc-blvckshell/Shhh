#!/usr/bin/env tsx
/**
 * Backfill locations for users who have user_profiles but no locations row.
 * Assigns varied coordinates throughout Canada and USA.
 *
 * Run: npx tsx src/database/backfill-locations.ts
 * Or: npm run backfill:locations
 */
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { query, closePool } from '../config/database';

dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

/** Cities with [lng, lat] (PostGIS uses lng, lat order for ST_MakePoint) */
const CITIES: Array<[number, number]> = [
  // USA
  [-74.006, 40.7128],   // New York
  [-118.2437, 34.0522], // Los Angeles
  [-87.6298, 41.8781], // Chicago
  [-95.3698, 29.7604],  // Houston
  [-112.074, 33.4484], // Phoenix
  [-122.4194, 37.7749], // San Francisco
  [-80.1918, 25.7617],  // Miami
  [-122.3321, 47.6062], // Seattle
  [-104.9903, 39.7392], // Denver
  [-97.7431, 30.2672],  // Austin
  [-71.0589, 42.3601],  // Boston
  [-86.1581, 39.7684],  // Indianapolis
  [-122.6765, 45.5231], // Portland OR
  [-90.0715, 29.9511],  // New Orleans
  [-93.2650, 44.9778],  // Minneapolis
  [-84.3880, 33.7490],  // Atlanta
  [-79.9959, 40.4406],  // Pittsburgh
  [-97.3301, 32.7555],  // Fort Worth
  [-106.6504, 35.0844], // Albuquerque
  // Canada
  [-79.3832, 43.6532],  // Toronto
  [-123.1207, 49.2827], // Vancouver
  [-73.5673, 45.5017],  // Montreal
  [-114.0719, 51.0447], // Calgary
  [-75.6972, 45.4215],  // Ottawa
  [-113.4909, 53.5461], // Edmonton
  [-97.1375, 49.8954],  // Winnipeg
  [-63.5723, 44.6488],  // Halifax
  [-106.6600, 52.1579], // Saskatoon
  [-79.8770, 43.2557],  // Hamilton
  [-80.4922, 43.4516],  // Kitchener
  [-73.7454, 45.5017],  // Laval
  [-71.2074, 46.8139],  // Quebec City
  [-79.2663, 43.7315],  // Brampton
  [-79.3832, 43.7615],  // Mississauga
];

function pickCityForUser(userId: string): [number, number] {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const idx = parseInt(hash.slice(0, 8), 16) % CITIES.length;
  const [lng, lat] = CITIES[idx];
  // Add small random offset so users aren't all at exact same point (within ~2km)
  const jitter = 0.01;
  const jitterLng = (parseInt(hash.slice(8, 12), 16) / 65535 - 0.5) * jitter;
  const jitterLat = (parseInt(hash.slice(12, 16), 16) / 65535 - 0.5) * jitter;
  return [lng + jitterLng, lat + jitterLat];
}

async function main() {
  const result = await query(`
    SELECT up.user_id
    FROM user_profiles up
    WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.user_id = up.user_id)
  `);

  const userIds = result.rows.map((r: { user_id: string }) => r.user_id);
  console.log(`Found ${userIds.length} users without locations. Backfilling...`);

  let count = 0;
  for (const userId of userIds) {
    const [lng, lat] = pickCityForUser(userId);
    await query(
      `INSERT INTO locations (user_id, geom_point, is_precise_mode, updated_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), false, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         geom_point = ST_SetSRID(ST_MakePoint($2, $3), 4326),
         updated_at = NOW()`,
      [userId, lng, lat]
    );
    count++;
    if (count % 10 === 0) console.log(`  Backfilled ${count}/${userIds.length}`);
  }

  console.log(`Done. Backfilled locations for ${count} users.`);
  await closePool();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
