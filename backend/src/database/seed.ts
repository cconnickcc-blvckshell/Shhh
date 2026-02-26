import { getPool, closePool, query } from '../config/database';
import { connectMongoDB, closeMongoDB } from '../config/mongodb';
import { logger } from '../config/logger';
import { hashPhone } from '../utils/hash';

const SEED_USERS = [
  { phone: '+15550000001', name: 'Alex & Jamie', bio: 'Fun couple looking for like-minded friends', gender: 'couple', sexuality: 'bisexual', exp: 'experienced', host: true, kinks: ['nightlife', 'travel', 'dancing'], tier: 2, photo: '/photos/stock/person_1.jpg' },
  { phone: '+15550000002', name: 'Kira', bio: 'New in town, looking to explore', gender: 'woman', sexuality: 'pansexual', exp: 'curious', host: false, kinks: ['social', 'events', 'wine'], tier: 1, photo: '/photos/stock/person_2.jpg' },
  { phone: '+15550000003', name: 'Marcus & Nia', bio: 'Hosting this weekend', gender: 'couple', sexuality: 'bisexual', exp: 'veteran', host: true, kinks: ['hosting', 'parties', 'cooking'], tier: 2, photo: '/photos/stock/person_3.jpg' },
  { phone: '+15550000004', name: 'Jade', bio: 'Here for the vibes', gender: 'woman', sexuality: 'bisexual', exp: 'experienced', host: false, kinks: ['festivals', 'yoga', 'art'], tier: 1, photo: '/photos/stock/person_4.jpg' },
  { phone: '+15550000005', name: 'Dex & Luna', bio: 'Weekend warriors', gender: 'couple', sexuality: 'open', exp: 'experienced', host: false, kinks: ['clubs', 'resorts', 'travel'], tier: 3, photo: '/photos/stock/person_5.jpg' },
  { phone: '+15550000006', name: 'River', bio: 'Traveling through, open tonight', gender: 'non_binary', sexuality: 'queer', exp: 'curious', host: false, kinks: ['travel', 'music', 'connection'], tier: 0, photo: '/photos/stock/person_6.jpg' },
];

const SEED_VENUE = {
  name: 'The Purple Room',
  description: 'Premier lifestyle lounge in the heart of NYC',
  tagline: 'Where secrets come alive',
  lat: 40.7128, lng: -74.006, type: 'club', capacity: 200,
  dressCode: 'Upscale casual', ageMinimum: 21, priceRange: '$$$',
  features: ['valet', 'coat_check', 'bottle_service', 'vip_rooms', 'rooftop'],
  amenities: ['bar', 'dancefloor', 'private_rooms'],
};

async function seed() {
  const pool = getPool();
  await pool.query('SELECT 1');
  await connectMongoDB();

  logger.info('Seeding database...');

  const userIds: string[] = [];

  for (const u of SEED_USERS) {
    const existing = await query('SELECT id FROM users WHERE phone_hash = $1', [hashPhone(u.phone)]);
    let userId: string;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      logger.info({ name: u.name }, 'User exists, updating...');
    } else {
      const res = await query(
        `INSERT INTO users (phone_hash, verification_tier) VALUES ($1, $2) RETURNING id`,
        [hashPhone(u.phone), u.tier]
      );
      userId = res.rows[0].id;

      await query(
        `INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, u.name]
      );
    }

    await query(
      `UPDATE users SET verification_tier = $1 WHERE id = $2`,
      [u.tier, userId]
    );

    await query(
      `UPDATE user_profiles SET display_name = $1, bio = $2, gender = $3, sexuality = $4,
       experience_level = $5, is_host = $6, kinks = $7, photos_json = $8
       WHERE user_id = $9`,
      [u.name, u.bio, u.gender, u.sexuality, u.exp, u.host, u.kinks,
       JSON.stringify([u.photo]), userId]
    );

    const jitterLat = 40.7128 + (Math.random() - 0.5) * 0.01;
    const jitterLng = -74.006 + (Math.random() - 0.5) * 0.01;

    await query(
      `INSERT INTO locations (user_id, geom_point, updated_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), NOW())
       ON CONFLICT (user_id) DO UPDATE SET geom_point = ST_SetSRID(ST_MakePoint($2, $3), 4326), updated_at = NOW()`,
      [userId, jitterLng, jitterLat]
    );

    userIds.push(userId);
    logger.info({ name: u.name, userId }, 'User seeded');
  }

  // Seed venue
  const venueRes = await query(
    `INSERT INTO venues (name, description, lat, lng, type, capacity, amenities, tagline, dress_code, age_minimum, price_range, features)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT DO NOTHING RETURNING id`,
    [SEED_VENUE.name, SEED_VENUE.description, SEED_VENUE.lat, SEED_VENUE.lng,
     SEED_VENUE.type, SEED_VENUE.capacity, SEED_VENUE.amenities, SEED_VENUE.tagline,
     SEED_VENUE.dressCode, SEED_VENUE.ageMinimum, SEED_VENUE.priceRange, SEED_VENUE.features]
  );

  if (venueRes.rows.length > 0) {
    const venueId = venueRes.rows[0].id;
    logger.info({ venueId }, 'Venue seeded');

    // Seed event
    const tomorrow = new Date(Date.now() + 86400000);
    const dayAfter = new Date(Date.now() + 172800000);

    await query(
      `INSERT INTO events (venue_id, host_user_id, title, description, starts_at, ends_at, type, capacity)
       VALUES ($1, $2, 'Friday Night Social', 'Chill meetup for verified couples', $3, $4, 'party', 50)`,
      [venueId, userIds[0], tomorrow, dayAfter]
    );
    logger.info('Event seeded');

    // Seed ad placement
    await query(
      `INSERT INTO ad_placements (venue_id, surface, headline, body, target_radius_km, cpm_cents, expires_at)
       VALUES ($1, 'discover_feed', 'Tonight at The Purple Room', 'Open bar 9-11pm. Couples welcome.', 25, 2500, NOW() + INTERVAL '7 days')`,
      [venueId]
    );
    logger.info('Ad placement seeded');

    // Seed special
    await query(
      `INSERT INTO venue_specials (venue_id, title, description, day_of_week, start_time, end_time)
       VALUES ($1, 'Friday Frenzy', 'Half price entry before 10pm', 5, '21:00', '02:00')`,
      [venueId]
    );
    logger.info('Venue special seeded');
  }

  // Set one user as admin
  await query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userIds[0]]);
  logger.info({ userId: userIds[0] }, 'Admin role assigned');

  // Create a conversation between first two users
  const convRes = await query(
    `INSERT INTO conversations (type) VALUES ('direct') RETURNING id`
  );
  const convId = convRes.rows[0].id;
  await query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [convId, userIds[0]]);
  await query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [convId, userIds[1]]);
  logger.info({ convId }, 'Conversation seeded');

  logger.info('Seed complete!');
  await closePool();
  await closeMongoDB();
}

seed().catch(err => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
