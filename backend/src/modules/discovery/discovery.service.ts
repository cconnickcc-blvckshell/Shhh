import { query } from '../../config/database';
import { getRedis } from '../../config/redis';
import { config } from '../../config';

export interface DiscoveryFilters {
  radius?: number;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  experienceLevel?: string;
  isHost?: boolean;
  minTier?: number;
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
}

export class DiscoveryService {
  async updateLocation(userId: string, lat: number, lng: number, isPrecise: boolean) {
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

    const redis = getRedis();
    const cacheKey = `discover:${userId}:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusKm}:${limit}`;
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
        CASE WHEN l.is_precise_mode THEN
          ST_Distance(l.geom_point::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)
        ELSE
          ST_Distance(l.geom_point::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) + (random() * $5 - $5/2)
        END as distance,
        l.updated_at as last_active,
        pr.state as presence_state,
        (SELECT array_agg(flag) FROM intent_flags WHERE user_id = them.user_id AND expires_at > NOW()) as active_intents
      FROM user_profiles them
      JOIN users u ON them.user_id = u.id
      JOIN locations l ON them.user_id = l.user_id
      LEFT JOIN presence pr ON them.user_id = pr.user_id AND pr.expires_at > NOW()
      -- Cross-reference with MY profile for bidirectional matching
      CROSS JOIN user_profiles me
      WHERE me.user_id = $3
        AND u.is_active = true
        AND u.deleted_at IS NULL
        AND them.user_id != $3
        -- Proximity filter
        AND ST_DWithin(
          l.geom_point::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $4
        )
        -- Block filter
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b.blocker_id = $3 AND b.blocked_id = them.user_id)
             OR (b.blocker_id = them.user_id AND b.blocked_id = $3)
        )
        -- ========================================
        -- BIDIRECTIONAL PREFERENCE MATCHING
        -- ========================================
        -- MY preferences match THEIR profile
        AND (me.seeking_genders IS NULL OR them.gender = ANY(me.seeking_genders))
        AND (me.seeking_roles IS NULL OR them.show_as_role = ANY(me.seeking_roles))
        AND (me.seeking_relationships IS NULL OR them.show_as_relationship = ANY(me.seeking_relationships))
        AND (me.seeking_experience IS NULL OR them.experience_level = ANY(me.seeking_experience))
        AND (me.seeking_age_min IS NULL OR them.age IS NULL OR them.age >= me.seeking_age_min)
        AND (me.seeking_age_max IS NULL OR them.age IS NULL OR them.age <= me.seeking_age_max)
        AND (me.seeking_verified_only = false OR u.verification_tier >= 1)
        -- THEIR preferences match MY profile (bidirectional!)
        AND (them.seeking_genders IS NULL OR me.gender = ANY(them.seeking_genders))
        AND (them.seeking_roles IS NULL OR me.show_as_role = ANY(them.seeking_roles))
        AND (them.seeking_relationships IS NULL OR me.show_as_relationship = ANY(them.seeking_relationships))
        AND (them.seeking_experience IS NULL OR me.experience_level = ANY(them.seeking_experience))
        AND (them.seeking_age_min IS NULL OR me.age IS NULL OR me.age >= them.seeking_age_min)
        AND (them.seeking_age_max IS NULL OR me.age IS NULL OR me.age <= them.seeking_age_max)
      ORDER BY distance ASC, l.updated_at DESC
      LIMIT $6`,
      [lat, lng, userId, radiusMeters, fuzz, limit]
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
    }));

    await redis.set(cacheKey, JSON.stringify(users), 'EX', 30);

    return users;
  }
}
