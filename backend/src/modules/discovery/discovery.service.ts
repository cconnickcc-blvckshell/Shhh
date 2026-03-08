import { query } from '../../config/database';
import { getRedis } from '../../config/redis';
import { config } from '../../config';

/** Canonical intent lane for discovery (GC-3.1). */
export type PrimaryIntent = 'social' | 'curious' | 'lifestyle' | 'couple';

export interface DiscoveryFilters {
  radius?: number;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  experienceLevel?: string;
  isHost?: boolean;
  minTier?: number;
  /** Filter by their primary_intent (GC-3.1). If not set, use viewer's primary_intent as default when available. */
  primaryIntent?: PrimaryIntent | null;
  /** GC-6.1: When true, only show users who share at least one group with me. */
  inMyGroups?: boolean;
}

/** When set, discovery result is capped (e.g. 30 for free, 50 for premium). Venue/event context can bypass cap. */
export interface DiscoveryOptions {
  /** Max number of results (closest by distance). Default 50. */
  limit?: number;
}

export interface NearbyUser {
  userId: string;
  displayName: string;
  bio: string;
  gender: string | null;
  sexuality: string | null;
  photosJson: unknown[];
  verificationStatus: string;
  experienceLevel: string;
  isHost: boolean;
  distance: number;
  lastActive: string;
  primaryIntent?: PrimaryIntent | null;
}

/** Max implied speed (km/h) for location updates. Reject if exceeded (GPS spoof / error). */
const MAX_VELOCITY_KMH = 900;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class DiscoveryService {
  /** Wave 1: Lightweight activity counts for density signals. Real counts only (no fake density). */
  async getActivityCounts(userId: string, lat: number, lng: number, radiusKm: number = 50): Promise<{ nearbyCount: number; eventsTonightCount: number }> {
    const radiusMeters = Math.min(radiusKm, config.geo.maxDiscoveryRadiusKm) * 1000;
    const today = new Date().toISOString().slice(0, 10);
    const [nearby, events] = await Promise.all([
      query(
        `SELECT COUNT(*)::int as cnt FROM user_profiles them
         JOIN users u ON them.user_id = u.id
         JOIN locations l ON them.user_id = l.user_id
         CROSS JOIN user_profiles me
         WHERE me.user_id = $1 AND u.is_active = true AND u.deleted_at IS NULL AND them.user_id != $1
           AND ST_DWithin(l.geom_point::geography, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography, $4)
           AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = them.user_id) OR (b.blocker_id = them.user_id AND b.blocked_id = $1))
           AND (me.seeking_genders IS NULL OR them.gender = ANY(me.seeking_genders))
           AND (them.discovery_visible_to = 'all' OR (them.discovery_visible_to = 'social_and_curious' AND me.primary_intent IN ('social', 'curious')) OR (them.discovery_visible_to = 'same_intent' AND them.primary_intent IS NOT DISTINCT FROM me.primary_intent))`,
        [userId, lat, lng, radiusMeters]
      ),
      query(
        `SELECT COUNT(*)::int as cnt FROM events e
         LEFT JOIN venues v ON e.venue_id = v.id
         WHERE e.status IN ('upcoming', 'active') AND e.starts_at > NOW() AND e.ends_at > NOW()
           AND (e.starts_at AT TIME ZONE 'UTC')::date = $1::date
           AND (v.id IS NULL OR ST_DWithin(ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography, $4))`,
        [today, lat, lng, radiusMeters]
      ),
    ]);
    return {
      nearbyCount: nearby.rows[0]?.cnt ?? 0,
      eventsTonightCount: events.rows[0]?.cnt ?? 0,
    };
  }

  async updateLocation(userId: string, lat: number, lng: number, isPrecise: boolean) {
    const prev = await query(
      `SELECT ST_Y(geom_point::geometry)::double precision as lat, ST_X(geom_point::geometry)::double precision as lng, updated_at
       FROM locations WHERE user_id = $1`,
      [userId]
    );
    if (prev.rows[0]) {
      const { lat: oldLat, lng: oldLng, updated_at: prevAt } = prev.rows[0];
      const distKm = haversineKm(oldLat, oldLng, lat, lng);
      const hours = (Date.now() - new Date(prevAt).getTime()) / 3600000;
      if (hours > 0 && distKm / hours > MAX_VELOCITY_KMH) {
        return; // Implausible velocity; skip update (GPS spoof / error)
      }
    }

    await query(
      `INSERT INTO locations (user_id, geom_point, is_precise_mode, updated_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         geom_point = ST_SetSRID(ST_MakePoint($2, $3), 4326),
         is_precise_mode = $4,
         updated_at = NOW()`,
      [userId, lng, lat, isPrecise]
    );

    const redis = getRedis();
    await redis.geoadd('user:locations', lng, lat, userId);
    await redis.expire('user:locations', 3600);
  }

  async getNearbyUsers(
    userId: string,
    lat: number,
    lng: number,
    filters: DiscoveryFilters = {},
    options: DiscoveryOptions = {}
  ): Promise<NearbyUser[]> {
    const radiusKm = Math.min(filters.radius || 50, config.geo.maxDiscoveryRadiusKm);
    const radiusMeters = radiusKm * 1000;
    const limit = options.limit ?? config.geo.discoveryCapPremium;
    const primaryIntent = filters.primaryIntent ?? null;
    const experienceLevel = filters.experienceLevel ?? null;
    let inMyGroups = filters.inMyGroups === true;
    if (inMyGroups) {
      const hasTable = await query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members'`
      );
      if (hasTable.rows.length === 0) inMyGroups = false;
    }

    const redis = getRedis();
    const cacheKey = `discover:${userId}:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusKm}:${limit}:${primaryIntent ?? ''}:${experienceLevel ?? ''}:${inMyGroups}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const fuzz = config.geo.defaultFuzzMeters;

    const result = await query(
      `SELECT
        them.user_id,
        them.display_name,
        them.bio,
        them.gender,
        them.sexuality,
        them.photos_json,
        them.verification_status,
        them.experience_level,
        them.is_host,
        them.show_as_role,
        them.show_as_relationship,
        them.age,
        them.primary_intent,
        them.profile_visibility_tier,
        CASE WHEN l.is_precise_mode THEN
          ST_Distance(l.geom_point::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)
        ELSE
          GREATEST(0, ST_Distance(l.geom_point::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) + (random() * $5 - $5/2))
        END as distance,
        l.updated_at as last_active,
        pr.state as presence_state,
        (SELECT array_agg(flag) FROM intent_flags WHERE user_id = them.user_id AND expires_at > NOW()) as active_intents
      FROM user_profiles them
      JOIN users u ON them.user_id = u.id
      JOIN locations l ON them.user_id = l.user_id
      LEFT JOIN presence pr ON them.user_id = pr.user_id AND pr.expires_at > NOW()
      CROSS JOIN user_profiles me
      WHERE me.user_id = $3
        AND u.is_active = true
        AND u.deleted_at IS NULL
        AND them.user_id != $3
        AND ST_DWithin(
          l.geom_point::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $4
        )
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b.blocker_id = $3 AND b.blocked_id = them.user_id)
             OR (b.blocker_id = them.user_id AND b.blocked_id = $3)
        )
        AND (me.seeking_genders IS NULL OR them.gender = ANY(me.seeking_genders))
        AND (me.seeking_roles IS NULL OR them.show_as_role = ANY(me.seeking_roles))
        AND (me.seeking_relationships IS NULL OR them.show_as_relationship = ANY(me.seeking_relationships))
        AND (me.seeking_experience IS NULL OR them.experience_level = ANY(me.seeking_experience))
        AND (me.seeking_age_min IS NULL OR them.age IS NULL OR them.age >= me.seeking_age_min)
        AND (me.seeking_age_max IS NULL OR them.age IS NULL OR them.age <= me.seeking_age_max)
        AND (me.seeking_verified_only = false OR u.verification_tier >= 1)
        AND (them.seeking_genders IS NULL OR me.gender = ANY(them.seeking_genders))
        AND (them.seeking_roles IS NULL OR me.show_as_role = ANY(them.seeking_roles))
        AND (them.seeking_relationships IS NULL OR me.show_as_relationship = ANY(them.seeking_relationships))
        AND (them.seeking_experience IS NULL OR me.experience_level = ANY(them.seeking_experience))
        AND (them.seeking_age_min IS NULL OR me.age IS NULL OR me.age >= them.seeking_age_min)
        AND (them.seeking_age_max IS NULL OR me.age IS NULL OR me.age <= them.seeking_age_max)
        AND ($7::text IS NULL OR them.primary_intent = $7)
        AND ($8::text IS NULL OR them.experience_level = $8)
        AND (them.discovery_visible_to = 'all'
             OR (them.discovery_visible_to = 'social_and_curious' AND me.primary_intent IN ('social', 'curious'))
             OR (them.discovery_visible_to = 'same_intent' AND them.primary_intent IS NOT DISTINCT FROM me.primary_intent))
        AND (NOT $9 OR EXISTS (
          SELECT 1 FROM group_members gm1
          JOIN group_members gm2 ON gm1.group_id = gm2.group_id AND gm2.user_id = them.user_id
          WHERE gm1.user_id = $3
        ))
      ORDER BY distance ASC, l.updated_at DESC
      LIMIT $6`,
      [lat, lng, userId, radiusMeters, fuzz, limit, primaryIntent, experienceLevel, inMyGroups]
    );

    const users: NearbyUser[] = result.rows.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      bio: row.bio,
      gender: row.gender,
      sexuality: row.sexuality,
      photosJson: row.photos_json,
      verificationStatus: row.verification_status,
      experienceLevel: row.experience_level,
      isHost: row.is_host,
      role: row.show_as_role || null,
      relationship: row.show_as_relationship || null,
      age: row.age || null,
      distance: Math.round(row.distance),
      lastActive: row.last_active,
      presenceState: row.presence_state || null,
      activeIntents: row.active_intents || [],
      primaryIntent: row.primary_intent || null,
      profileVisibilityTier: row.profile_visibility_tier || 'all',
    }));

    await redis.set(cacheKey, JSON.stringify(users), 'EX', 30);

    return users;
  }

  /** GC-5.4: Pairs (me, them, venue) where both opted in and overlapping check-ins at same venue >= minCount. */
  async getCrossingPaths(userId: string, minCount: number = 2) {
    const hasCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'crossing_paths_visible'`
    );
    if (hasCol.rows.length === 0) return [];

    const result = await query(
      `SELECT vc1.venue_id, vc2.user_id AS other_user_id, COUNT(*)::int AS cnt, v.name AS venue_name
       FROM venue_checkins vc1
       JOIN venue_checkins vc2 ON vc1.venue_id = vc2.venue_id AND vc1.user_id = $1 AND vc2.user_id <> $1
       JOIN user_profiles me ON me.user_id = $1 AND me.crossing_paths_visible = true
       JOIN user_profiles them ON them.user_id = vc2.user_id AND them.crossing_paths_visible = true
       LEFT JOIN venues v ON v.id = vc1.venue_id
       WHERE NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.blocker_id = $1 AND b.blocked_id = vc2.user_id) OR (b.blocker_id = vc2.user_id AND b.blocked_id = $1)
       )
       GROUP BY vc1.venue_id, vc2.user_id, v.name
       HAVING COUNT(*) >= $2
       ORDER BY COUNT(*) DESC`,
      [userId, minCount]
    );
    return result.rows.map((r: { venue_id: string; other_user_id: string; cnt: number; venue_name: string | null }) => ({
      venueId: r.venue_id,
      otherUserId: r.other_user_id,
      count: r.cnt,
      venueName: r.venue_name,
    }));
  }
}
