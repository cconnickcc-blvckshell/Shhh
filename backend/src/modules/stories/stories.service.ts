import { query } from '../../config/database';

const DEFAULT_TTL_HOURS = 24;

export class StoriesService {
  async create(userId: string, mediaId: string, options?: { venueId?: string; ttlHours?: number }) {
    const ttlHours = options?.ttlHours ?? DEFAULT_TTL_HOURS;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const result = await query(
      `INSERT INTO stories (user_id, venue_id, media_id, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, options?.venueId || null, mediaId, expiresAt]
    );
    return result.rows[0];
  }

  async getNearby(lat: number, lng: number, radiusKm: number = 50, limit: number = 30) {
    const radiusM = radiusKm * 1000;
    const result = await query(
      `SELECT s.*, s.user_id as author_id, v.name as venue_name,
              (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id)::int as view_count
       FROM stories s
       LEFT JOIN venues v ON s.venue_id = v.id
       LEFT JOIN locations l ON l.user_id = s.user_id
       WHERE s.expires_at > NOW()
         AND (
           (s.venue_id IS NOT NULL AND v.id IS NOT NULL AND ST_DWithin(
             ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
             ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
             $3
           ))
           OR
           (s.venue_id IS NULL AND l.user_id IS NOT NULL AND ST_DWithin(
             l.geom_point::geography,
             ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
             $3
           ))
         )
       ORDER BY s.created_at DESC LIMIT $4`,
      [lat, lng, radiusM, limit]
    );
    return result.rows;
  }

  async getByVenue(venueId: string) {
    const result = await query(
      `SELECT s.*, s.user_id as author_id,
              (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id)::int as view_count
       FROM stories s
       WHERE s.venue_id = $1 AND s.expires_at > NOW()
       ORDER BY s.created_at DESC`,
      [venueId]
    );
    return result.rows;
  }

  async recordView(storyId: string, viewerId: string) {
    await query(
      `INSERT INTO story_views (story_id, viewer_id) VALUES ($1, $2) ON CONFLICT (story_id, viewer_id) DO NOTHING`,
      [storyId, viewerId]
    );
  }

  async getViewers(storyId: string, authorId: string) {
    const result = await query(
      `SELECT sv.viewer_id, sv.viewed_at, up.display_name
       FROM story_views sv
       JOIN user_profiles up ON sv.viewer_id = up.user_id
       JOIN stories s ON s.id = sv.story_id
       WHERE s.id = $1 AND s.user_id = $2
       ORDER BY sv.viewed_at DESC`,
      [storyId, authorId]
    );
    return result.rows;
  }

  async getStory(storyId: string) {
    const result = await query(
      `SELECT s.*, v.name as venue_name FROM stories s LEFT JOIN venues v ON s.venue_id = v.id WHERE s.id = $1 AND s.expires_at > NOW()`,
      [storyId]
    );
    return result.rows[0] || null;
  }
}
