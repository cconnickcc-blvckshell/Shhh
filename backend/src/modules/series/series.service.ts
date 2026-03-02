import { query } from '../../config/database';

export class SeriesService {
  async getSeries(seriesId: string) {
    const result = await query(
      `SELECT s.*, v.name as venue_name
       FROM event_series s
       LEFT JOIN venues v ON s.venue_id = v.id
       WHERE s.id = $1`,
      [seriesId]
    );
    return result.rows[0] || null;
  }

  /** Upcoming events for this series (starts_at > NOW(), same visibility applies via events). */
  async getUpcomingEvents(seriesId: string, limit: number = 20) {
    const hasCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'series_id'`
    );
    if (hasCol.rows.length === 0) return [];
    const result = await query(
      `SELECT e.id, e.title, e.starts_at, e.ends_at, e.type, e.capacity, e.venue_id,
              v.name as venue_name, v.lat as venue_lat, v.lng as venue_lng,
              (SELECT COUNT(*) FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going')::int as attendee_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.series_id = $1 AND e.status IN ('upcoming', 'active') AND e.starts_at > NOW()
       ORDER BY e.starts_at ASC LIMIT $2`,
      [seriesId, limit]
    );
    return result.rows;
  }

  async follow(userId: string, seriesId: string) {
    await query(
      `INSERT INTO user_series_follows (user_id, series_id) VALUES ($1, $2) ON CONFLICT (user_id, series_id) DO NOTHING`,
      [userId, seriesId]
    );
    return this.getSeries(seriesId);
  }

  async unfollow(userId: string, seriesId: string) {
    await query(`DELETE FROM user_series_follows WHERE user_id = $1 AND series_id = $2`, [userId, seriesId]);
    return { unfollowed: true };
  }

  async isFollowing(userId: string, seriesId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM user_series_follows WHERE user_id = $1 AND series_id = $2`,
      [userId, seriesId]
    );
    return result.rows.length > 0;
  }

  async createSeries(hostUserId: string, data: { name: string; venueId?: string; recurrenceRule?: string }) {
    const result = await query(
      `INSERT INTO event_series (name, venue_id, host_user_id, recurrence_rule)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.venueId || null, hostUserId, data.recurrenceRule || null]
    );
    return result.rows[0];
  }
}
