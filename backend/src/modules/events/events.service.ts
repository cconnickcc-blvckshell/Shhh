import { query } from '../../config/database';

export class EventsService {
  async createEvent(hostUserId: string, data: {
    title: string;
    description?: string;
    venueId?: string;
    startsAt: string;
    endsAt: string;
    type?: string;
    capacity?: number;
    isPrivate?: boolean;
  }) {
    const result = await query(
      `INSERT INTO events (host_user_id, venue_id, title, description, starts_at, ends_at, type, capacity, is_private)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        hostUserId,
        data.venueId || null,
        data.title,
        data.description || null,
        data.startsAt,
        data.endsAt,
        data.type || 'party',
        data.capacity || null,
        data.isPrivate || false,
      ]
    );

    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, 'going')`,
      [result.rows[0].id, hostUserId]
    );

    return result.rows[0];
  }

  async getNearbyEvents(lat: number, lng: number, radiusKm: number = 50) {
    const result = await query(
      `SELECT e.*, v.name as venue_name, v.lat as venue_lat, v.lng as venue_lng,
              COUNT(er.user_id) FILTER (WHERE er.status = 'going') as attendee_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN event_rsvps er ON e.id = er.event_id
       WHERE e.status IN ('upcoming', 'active')
         AND e.starts_at > NOW()
         AND (v.id IS NULL OR (
           ST_DWithin(
             ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
             ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
             $3
           )
         ))
       GROUP BY e.id, v.name, v.lat, v.lng
       ORDER BY e.starts_at ASC
       LIMIT 50`,
      [lat, lng, radiusKm * 1000]
    );
    return result.rows;
  }

  async getEvent(eventId: string) {
    const result = await query(
      `SELECT e.*, v.name as venue_name,
              COUNT(er.user_id) FILTER (WHERE er.status = 'going') as attendee_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN event_rsvps er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id, v.name`,
      [eventId]
    );
    return result.rows[0] || null;
  }

  async rsvp(eventId: string, userId: string, status: string) {
    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3`,
      [eventId, userId, status]
    );
    return this.getEvent(eventId);
  }

  async checkIn(eventId: string, userId: string) {
    await query(
      `UPDATE event_rsvps SET status = 'checked_in', arrived_at = NOW()
       WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
  }
}
