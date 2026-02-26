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
    filters: DiscoveryFilters = {}
  ): Promise<NearbyUser[]> {
    const radiusKm = Math.min(filters.radius || 50, config.geo.maxDiscoveryRadiusKm);
    const radiusMeters = radiusKm * 1000;

    const redis = getRedis();
    const cacheKey = `discover:${userId}:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusKm}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const fuzz = config.geo.defaultFuzzMeters;

    const params: unknown[] = [lat, lng, userId, radiusMeters, fuzz];
    let nextParam = 6;

    let genderClause = '';
    if (filters.gender) {
      genderClause = `AND up.gender = $${nextParam}`;
      params.push(filters.gender);
      nextParam++;
    }

    let expClause = '';
    if (filters.experienceLevel) {
      expClause = `AND up.experience_level = $${nextParam}`;
      params.push(filters.experienceLevel);
      nextParam++;
    }

    let tierClause = '';
    if (filters.minTier) {
      tierClause = `AND u.verification_tier >= $${nextParam}`;
      params.push(filters.minTier);
      nextParam++;
    }

    const result = await query(
      `SELECT
        up.user_id,
        up.display_name,
        up.bio,
        up.gender,
        up.sexuality,
        up.photos_json,
        up.verification_status,
        up.experience_level,
        up.is_host,
        CASE WHEN l.is_precise_mode THEN
          ST_Distance(l.geom_point::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)
        ELSE
          ST_Distance(l.geom_point::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) + (random() * $5 - $5/2)
        END as distance,
        l.updated_at as last_active,
        pr.state as presence_state,
        (SELECT array_agg(flag) FROM intent_flags WHERE user_id = up.user_id AND expires_at > NOW()) as active_intents
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      JOIN locations l ON up.user_id = l.user_id
      LEFT JOIN presence pr ON up.user_id = pr.user_id AND pr.expires_at > NOW()
      WHERE u.is_active = true
        AND u.deleted_at IS NULL
        AND up.user_id != $3
        AND ST_DWithin(
          l.geom_point::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $4
        )
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b.blocker_id = $3 AND b.blocked_id = up.user_id)
             OR (b.blocker_id = up.user_id AND b.blocked_id = $3)
        )
        ${genderClause}
        ${expClause}
        ${tierClause}
      ORDER BY distance ASC, l.updated_at DESC
      LIMIT 50`,
      params
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
      distance: Math.round(row.distance),
      lastActive: row.last_active,
      presenceState: row.presence_state || null,
      activeIntents: row.active_intents || [],
    }));

    await redis.set(cacheKey, JSON.stringify(users), 'EX', 30);

    return users;
  }
}
