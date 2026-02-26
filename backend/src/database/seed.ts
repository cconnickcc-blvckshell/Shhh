import { getPool, closePool, query } from '../config/database';
import { connectMongoDB, closeMongoDB } from '../config/mongodb';
import { logger } from '../config/logger';
import { hashPhone } from '../utils/hash';

const USERS = [
  { phone: '+15550000001', name: 'Alex & Jamie', bio: 'Fun-loving couple. Nightlife, travel, and good vibes only. Verified regulars at The Purple Room.', gender: 'couple', sexuality: 'bisexual', exp: 'experienced', host: true, kinks: ['nightlife', 'travel', 'dancing', 'wine tasting'], tier: 2, role: 'admin', photo: '/photos/stock/portrait_m1.jpg', status: 'id_verified' },
  { phone: '+15550000002', name: 'Kira', bio: 'Just moved to the city. Open-minded, curious, and looking to make genuine connections. Coffee dates welcome.', gender: 'woman', sexuality: 'pansexual', exp: 'curious', host: false, kinks: ['social events', 'art galleries', 'wine', 'yoga'], tier: 1, photo: '/photos/stock/portrait_w1.jpg', status: 'photo_verified' },
  { phone: '+15550000003', name: 'Marcus & Nia', bio: 'Hosting weekends at our place. Safe space, great music, better company. ID verified. References available.', gender: 'couple', sexuality: 'bisexual', exp: 'veteran', host: true, kinks: ['hosting', 'house parties', 'cooking', 'music'], tier: 3, photo: '/photos/stock/portrait_m2.jpg', status: 'reference_verified' },
  { phone: '+15550000004', name: 'Jade', bio: 'Festival season is my personality. Here for the energy, not the drama. Couples friendly.', gender: 'woman', sexuality: 'bisexual', exp: 'experienced', host: false, kinks: ['festivals', 'yoga', 'art', 'nature'], tier: 2, photo: '/photos/stock/portrait_w2.jpg', status: 'id_verified' },
  { phone: '+15550000005', name: 'Dex & Luna', bio: 'Weekend warriors. Resort lovers. We travel for the lifestyle and bring the party with us.', gender: 'couple', sexuality: 'open', exp: 'experienced', host: false, kinks: ['resorts', 'travel', 'clubs', 'pool parties'], tier: 2, photo: '/photos/stock/portrait_m3.jpg', status: 'id_verified' },
  { phone: '+15550000006', name: 'River', bio: 'Passing through town. Non-binary, open energy. Looking for authentic connections, even if just for tonight.', gender: 'non_binary', sexuality: 'queer', exp: 'curious', host: false, kinks: ['music', 'deep convos', 'spontaneity', 'travel'], tier: 0, photo: '/photos/stock/portrait_w3.jpg', status: 'unverified' },
  { phone: '+15550000007', name: 'Sasha & Dom', bio: 'Event organizers by night. We know every venue in the city. Ask us for recommendations.', gender: 'couple', sexuality: 'heteroflexible', exp: 'veteran', host: true, kinks: ['events', 'nightlife', 'community', 'networking'], tier: 3, photo: '/photos/stock/portrait_w4.jpg', status: 'reference_verified' },
  { phone: '+15550000008', name: 'Kai', bio: 'Gym by day, adventures by night. Direct, respectful, and always down for something new.', gender: 'man', sexuality: 'bisexual', exp: 'experienced', host: false, kinks: ['fitness', 'outdoor', 'clubs', 'spontaneity'], tier: 1, photo: '/photos/stock/portrait_m4.jpg', status: 'photo_verified' },
  { phone: '+15550000009', name: 'Mira & Cole', bio: 'High school sweethearts exploring together. New to the scene but eager learners. Be patient with us!', gender: 'couple', sexuality: 'bicurious', exp: 'new', host: false, kinks: ['date nights', 'social', 'learning', 'trust building'], tier: 1, photo: '/photos/stock/portrait_w5.jpg', status: 'photo_verified' },
  { phone: '+15550000010', name: 'Zara', bio: 'Life is short. I host, I travel, I make things happen. Verified and vouched for.', gender: 'woman', sexuality: 'bisexual', exp: 'veteran', host: true, kinks: ['hosting', 'luxury', 'travel', 'fine dining'], tier: 3, photo: '/photos/stock/portrait_w6.jpg', status: 'reference_verified' },
  { phone: '+15550000011', name: 'Theo', bio: 'Bartender at The Purple Room. I know everyone. Single, friendly, and full of stories.', gender: 'man', sexuality: 'straight', exp: 'experienced', host: false, kinks: ['cocktails', 'nightlife', 'storytelling', 'music'], tier: 2, photo: '/photos/stock/portrait_m5.jpg', status: 'id_verified' },
  { phone: '+15550000012', name: 'Nyx & Atlas', bio: 'We met on Shhh. Now we host together. Full circle energy. DM us for next Saturday.', gender: 'couple', sexuality: 'pansexual', exp: 'veteran', host: true, kinks: ['hosting', 'community', 'couples', 'themed nights'], tier: 3, photo: '/photos/stock/portrait_m6.jpg', status: 'reference_verified' },
  { phone: '+15550000013', name: 'Lily', bio: 'New here. A little shy but very curious. Looking for a chill couple to show me around.', gender: 'woman', sexuality: 'bicurious', exp: 'new', host: false, kinks: ['cocktails', 'conversation', 'exploring', 'trust'], tier: 0, photo: '/photos/stock/portrait_w7.jpg', status: 'unverified' },
  { phone: '+15550000014', name: 'Dante & Ivy', bio: 'Traveling couple. In town for the week. Where should we go? Whisper us your secrets.', gender: 'couple', sexuality: 'bisexual', exp: 'experienced', host: false, kinks: ['travel', 'food', 'adventure', 'new cities'], tier: 2, photo: '/photos/stock/portrait_m7.jpg', status: 'id_verified' },
  { phone: '+15550000015', name: 'Raven', bio: 'DJ at underground events. I set the mood, you bring the energy. Singles and couples welcome.', gender: 'woman', sexuality: 'queer', exp: 'veteran', host: false, kinks: ['music', 'DJing', 'underground', 'dancing'], tier: 2, photo: '/photos/stock/portrait_w8.jpg', status: 'id_verified' },
  { phone: '+15550000016', name: 'Blake', bio: 'Quiet confidence. I observe before I approach. Quality over quantity, always.', gender: 'man', sexuality: 'heteroflexible', exp: 'experienced', host: false, kinks: ['whiskey', 'conversation', 'rooftops', 'discretion'], tier: 1, photo: '/photos/stock/portrait_m8.jpg', status: 'photo_verified' },
];

const VENUES = [
  { name: 'The Purple Room', desc: 'Premier lifestyle lounge in the heart of downtown. Three floors, rooftop bar, and the city\'s most trusted space for discreet socializing.', tagline: 'Where secrets come alive', lat: 40.7128, lng: -74.006, type: 'club', capacity: 200, dressCode: 'Upscale casual — no sneakers, no jerseys', age: 21, price: '$$$', features: ['valet', 'coat_check', 'bottle_service', 'vip_rooms', 'rooftop', 'dj_booth'], amenities: ['bar', 'dancefloor', 'private_rooms', 'lounge_seating'], cover: '/photos/stock/venue_cover_1.jpg' },
  { name: 'Whisper Lounge', desc: 'Intimate cocktail bar with velvet booths and low lighting. Perfect for first meetings and quiet connections.', tagline: 'Say less. Mean more.', lat: 40.7145, lng: -74.008, type: 'club', capacity: 80, dressCode: 'Smart casual', age: 21, price: '$$', features: ['cocktail_menu', 'live_jazz', 'private_booths'], amenities: ['bar', 'lounge_seating', 'outdoor_patio'], cover: '/photos/stock/venue_cover_2.jpg' },
  { name: 'Ember Resort & Spa', desc: 'Adults-only resort 45 minutes from the city. Pool parties, themed weekends, and total privacy.', tagline: 'Escape. Explore. Return renewed.', lat: 40.8200, lng: -73.950, type: 'resort', capacity: 500, dressCode: 'Resort casual — swimwear at pool only', age: 21, price: '$$$$', features: ['pool', 'spa', 'cabanas', 'themed_weekends', 'restaurant', 'overnight'], amenities: ['pool', 'hot_tub', 'sauna', 'restaurant', 'rooms'], cover: '/photos/stock/venue_cover_3.jpg' },
  { name: 'The Loft', desc: 'Private event space in SoHo. Available for vetted hosts only. Apply through the app.', tagline: 'By invitation only.', lat: 40.7230, lng: -74.000, type: 'private_residence', capacity: 40, dressCode: 'Host discretion', age: 21, price: '$$', features: ['sound_system', 'mood_lighting', 'full_kitchen', 'rooftop_access'], amenities: ['bar', 'lounge_seating', 'outdoor_space'], cover: '/photos/stock/venue_cover_4.jpg' },
];

const SPECIALS = [
  { venue: 0, title: 'Friday Frenzy', desc: 'Half price entry before 10pm. DJ Raven on the decks.', day: 5, start: '21:00', end: '03:00' },
  { venue: 0, title: 'Couples Night', desc: 'Verified couples drink free until midnight.', day: 6, start: '20:00', end: '02:00' },
  { venue: 1, title: 'Jazz & Whispers', desc: 'Live jazz trio. Whisper someone across the bar.', day: 4, start: '19:00', end: '23:00' },
  { venue: 2, title: 'Pool Party Sundays', desc: 'DJ, open bar, swimwear required. Couples and singles.', day: 0, start: '12:00', end: '20:00' },
  { venue: 3, title: 'Monthly Mixer', desc: 'Curated guest list. Apply in advance.', day: 6, start: '21:00', end: '01:00' },
];

async function seed() {
  const pool = getPool();
  await pool.query('SELECT 1');
  await connectMongoDB();
  logger.info('Seeding database with rich content...');

  const userIds: string[] = [];

  for (const u of USERS) {
    const ph = hashPhone(u.phone);
    const existing = await query('SELECT id FROM users WHERE phone_hash = $1', [ph]);
    let uid: string;
    if (existing.rows.length > 0) {
      uid = existing.rows[0].id;
    } else {
      const r = await query(`INSERT INTO users (phone_hash, verification_tier) VALUES ($1, $2) RETURNING id`, [ph, u.tier]);
      uid = r.rows[0].id;
      await query(`INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [uid, u.name]);
    }

    await query(`UPDATE users SET verification_tier = $1${u.role ? ', role = \'' + u.role + '\'' : ''} WHERE id = $2`, [u.tier, uid]);
    await query(
      `UPDATE user_profiles SET display_name=$1, bio=$2, gender=$3, sexuality=$4, experience_level=$5, is_host=$6, kinks=$7, photos_json=$8, verification_status=$9 WHERE user_id=$10`,
      [u.name, u.bio, u.gender, u.sexuality, u.exp, u.host, u.kinks, JSON.stringify([u.photo]), u.status, uid]
    );

    const jLat = 40.7128 + (Math.random() - 0.5) * 0.015;
    const jLng = -74.006 + (Math.random() - 0.5) * 0.015;
    await query(
      `INSERT INTO locations (user_id, geom_point, updated_at) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), NOW()) ON CONFLICT (user_id) DO UPDATE SET geom_point = ST_SetSRID(ST_MakePoint($2, $3), 4326), updated_at = NOW()`,
      [uid, jLng, jLat]
    );

    userIds.push(uid);
    logger.info({ name: u.name }, 'Seeded');
  }

  // Set some presence states
  for (let i = 0; i < 6; i++) {
    const states = ['browsing', 'open_to_chat', 'nearby', 'at_venue', 'open_to_chat', 'browsing'];
    await query(
      `INSERT INTO presence (user_id, state, expires_at, decay_minutes) VALUES ($1, $2, NOW() + INTERVAL '2 hours', 120) ON CONFLICT (user_id) DO UPDATE SET state = $2, expires_at = NOW() + INTERVAL '2 hours'`,
      [userIds[i], states[i]]
    );
  }

  // Set some intent flags
  const intentPairs = [
    [1, 'open_tonight'], [2, 'hosting'], [3, 'open_tonight'], [5, 'traveling'],
    [6, 'hosting'], [7, 'looking_for_friends'], [9, 'hosting'], [13, 'traveling'],
  ];
  for (const [idx, flag] of intentPairs) {
    await query(
      `INSERT INTO intent_flags (user_id, flag, expires_at) VALUES ($1, $2, NOW() + INTERVAL '8 hours') ON CONFLICT DO NOTHING`,
      [userIds[idx as number], flag]
    );
  }

  // Venues
  const venueIds: string[] = [];
  for (const v of VENUES) {
    const r = await query(
      `INSERT INTO venues (name, description, tagline, lat, lng, type, capacity, dress_code, age_minimum, price_range, features, amenities, cover_photo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT DO NOTHING RETURNING id`,
      [v.name, v.desc, v.tagline, v.lat, v.lng, v.type, v.capacity, v.dressCode, v.age, v.price, v.features, v.amenities, v.cover]
    );
    if (r.rows.length > 0) {
      venueIds.push(r.rows[0].id);
      logger.info({ name: v.name }, 'Venue seeded');
    } else {
      const existing = await query(`SELECT id FROM venues WHERE name = $1`, [v.name]);
      venueIds.push(existing.rows[0]?.id || '');
    }
  }

  // Specials
  for (const sp of SPECIALS) {
    if (venueIds[sp.venue]) {
      await query(
        `INSERT INTO venue_specials (venue_id, title, description, day_of_week, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [venueIds[sp.venue], sp.title, sp.desc, sp.day, sp.start, sp.end]
      );
    }
  }

  // Events
  const tomorrow = new Date(Date.now() + 86400000);
  const dayAfter = new Date(Date.now() + 172800000);
  const nextWeek = new Date(Date.now() + 604800000);
  const nextWeekEnd = new Date(Date.now() + 691200000);

  const events = [
    { venue: 0, host: 0, title: 'Friday Night Social', desc: 'Verified couples and singles. DJ Raven on decks. Dress to impress.', start: tomorrow, end: dayAfter, type: 'party', cap: 50 },
    { venue: 1, host: 6, title: 'First Timers Welcome', desc: 'Low-key mixer for newcomers. Friendly crowd, no pressure.', start: tomorrow, end: dayAfter, type: 'club_night', cap: 30 },
    { venue: 2, host: 2, title: 'Weekend Pool Takeover', desc: 'Two-day resort event. Cabanas, open bar, themed nights. Apply for invite.', start: nextWeek, end: nextWeekEnd, type: 'hotel_takeover', cap: 100 },
    { venue: 3, host: 11, title: 'Intimate Gathering', desc: 'Curated guest list. 20 couples max. Hosted by Nyx & Atlas.', start: dayAfter, end: new Date(dayAfter.getTime() + 86400000), type: 'party', cap: 20 },
  ];

  for (const ev of events) {
    if (venueIds[ev.venue] && userIds[ev.host]) {
      await query(
        `INSERT INTO events (venue_id, host_user_id, title, description, starts_at, ends_at, type, capacity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [venueIds[ev.venue], userIds[ev.host], ev.title, ev.desc, ev.start, ev.end, ev.type, ev.cap]
      );
    }
  }

  // Ad placements
  if (venueIds[0]) {
    await query(`INSERT INTO ad_placements (venue_id, surface, headline, body, target_radius_km, cpm_cents, expires_at) VALUES ($1, 'discover_feed', 'Tonight at The Purple Room', 'Open bar 9-11pm. Couples welcome. DJ Raven.', 25, 2500, NOW() + INTERVAL '7 days')`, [venueIds[0]]);
  }
  if (venueIds[2]) {
    await query(`INSERT INTO ad_placements (venue_id, surface, headline, body, target_radius_km, cpm_cents, expires_at) VALUES ($1, 'discover_feed', 'Ember Resort Pool Takeover', 'Next weekend. Apply for your invite now.', 100, 3500, NOW() + INTERVAL '14 days')`, [venueIds[2]]);
  }

  // Conversations
  const conv1 = await query(`INSERT INTO conversations (type) VALUES ('direct') RETURNING id`);
  await query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [conv1.rows[0].id, userIds[0], userIds[1]]);

  const conv2 = await query(`INSERT INTO conversations (type) VALUES ('direct') RETURNING id`);
  await query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [conv2.rows[0].id, userIds[0], userIds[3]]);

  // Whisper
  await query(
    `INSERT INTO whispers (from_user_id, to_user_id, message, expires_at) VALUES ($1, $2, 'Love your energy tonight ✨', NOW() + INTERVAL '4 hours')`,
    [userIds[4], userIds[0]]
  );

  logger.info('=== SEED COMPLETE ===');
  logger.info(`${USERS.length} users, ${VENUES.length} venues, ${events.length} events, ${SPECIALS.length} specials`);

  await closePool();
  await closeMongoDB();
}

seed().catch(err => { logger.error({ err }, 'Seed failed'); process.exit(1); });
