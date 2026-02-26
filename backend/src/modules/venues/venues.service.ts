import { query } from '../../config/database';

export class VenuesService {
  async createVenue(ownerId: string, data: {
    name: string; description?: string; lat: number; lng: number;
    type?: string; capacity?: number; amenities?: string[];
  }) {
    const result = await query(
      `INSERT INTO venues (name, description, verified_owner_id, lat, lng, type, capacity, amenities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.name, data.description || null, ownerId, data.lat, data.lng,
       data.type || 'club', data.capacity || null, data.amenities || []]
    );

    await query(
      `INSERT INTO moderation_queue (type, target_id, target_type, priority)
       VALUES ('venue_verification', $1, 'venue', 1)`,
      [result.rows[0].id]
    );

    return result.rows[0];
  }

  async getVenue(venueId: string) {
    const result = await query(
      `SELECT v.*, p.display_name as owner_name
       FROM venues v LEFT JOIN user_profiles p ON v.verified_owner_id = p.user_id
       WHERE v.id = $1`, [venueId]
    );
    return result.rows[0] || null;
  }

  async getNearbyVenues(lat: number, lng: number, radiusKm: number = 50) {
    const result = await query(
      `SELECT v.*, ST_Distance(
         ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
         ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
       ) as distance_meters
       FROM venues v
       WHERE v.is_active = true
         AND ST_DWithin(
           ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $3
         )
       ORDER BY distance_meters ASC LIMIT 50`,
      [lat, lng, radiusKm * 1000]
    );
    return result.rows;
  }

  async updateVenue(venueId: string, ownerId: string, data: Record<string, unknown>) {
    const venue = await query('SELECT id FROM venues WHERE id = $1 AND verified_owner_id = $2', [venueId, ownerId]);
    if (venue.rows.length === 0) {
      throw Object.assign(new Error('Venue not found or unauthorized'), { statusCode: 403 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const allowed: Record<string, string> = { name: 'name', description: 'description', capacity: 'capacity', amenities: 'amenities', hoursJson: 'hours_json' };
    for (const [key, col] of Object.entries(allowed)) {
      if (data[key] !== undefined) {
        if (key === 'hoursJson') {
          fields.push(`${col} = $${idx}::jsonb`);
          values.push(JSON.stringify(data[key]));
        } else if (key === 'amenities') {
          fields.push(`${col} = $${idx}::text[]`);
          values.push(data[key]);
        } else {
          fields.push(`${col} = $${idx}`);
          values.push(data[key]);
        }
        idx++;
      }
    }

    if (fields.length === 0) return this.getVenue(venueId);
    fields.push('updated_at = NOW()');
    values.push(venueId);

    await query(`UPDATE venues SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.getVenue(venueId);
  }

  async createGeofence(venueId: string, polygon: number[][]) {
    const coordStr = polygon.map(p => `${p[0]} ${p[1]}`).join(', ');
    const first = polygon[0];
    const closed = coordStr + `, ${first[0]} ${first[1]}`;

    const result = await query(
      `INSERT INTO geofences (venue_id, name, geom_polygon)
       VALUES ($1, (SELECT name FROM venues WHERE id = $1),
               ST_SetSRID(ST_GeomFromText('POLYGON((${closed}))'), 4326))
       RETURNING id`,
      [venueId]
    );
    return result.rows[0];
  }

  async checkGeofences(lat: number, lng: number) {
    const result = await query(
      `SELECT g.id, g.name, g.venue_id, v.name as venue_name
       FROM geofences g
       JOIN venues v ON g.venue_id = v.id
       WHERE g.is_active = true
         AND ST_Contains(g.geom_polygon, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
      [lng, lat]
    );
    return result.rows;
  }
}
