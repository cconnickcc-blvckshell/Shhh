import { query } from '../../config/database';

export class VenuesService {
  async createVenue(ownerId: string, data: {
    name: string; description?: string; lat: number; lng: number;
    type?: string; capacity?: number; amenities?: string[];
    venueType?: 'physical' | 'promoter' | 'series';
  }) {
    const hasVenueType = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'venue_type'`
    );
    const cols = hasVenueType.rows.length > 0
      ? 'name, description, verified_owner_id, lat, lng, type, capacity, amenities, venue_type'
      : 'name, description, verified_owner_id, lat, lng, type, capacity, amenities';
    const vals = hasVenueType.rows.length > 0
      ? [data.name, data.description || null, ownerId, data.lat, data.lng, data.type || 'club', data.capacity || null, data.amenities || [], data.venueType || 'physical']
      : [data.name, data.description || null, ownerId, data.lat, data.lng, data.type || 'club', data.capacity || null, data.amenities || []];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query(
      `INSERT INTO venues (${cols}) VALUES (${placeholders}) RETURNING *`,
      vals
    );

    await query(
      `INSERT INTO moderation_queue (type, target_id, target_type, priority)
       VALUES ('venue_verification', $1, 'venue', 1)`,
      [result.rows[0].id]
    );

    return result.rows[0];
  }

  /** Venues the user owns or is staff of (for venue-enabled accounts). */
  async getMyVenues(userId: string) {
    const result = await query(
      `SELECT DISTINCT v.id, v.name, v.description, v.tagline, v.lat, v.lng, v.type, v.capacity,
              v.cover_photo_url, v.verified_owner_id, v.is_active, v.verified_safe_at, v.updated_at,
              p.display_name as owner_name,
              CASE WHEN v.verified_owner_id = $1 THEN 'owner' ELSE 'staff' END as my_role
       FROM venues v
       LEFT JOIN user_profiles p ON v.verified_owner_id = p.user_id
       LEFT JOIN venue_staff vs ON v.id = vs.venue_id AND vs.user_id = $1 AND vs.is_active = true
       WHERE v.verified_owner_id = $1 OR vs.id IS NOT NULL`,
      [userId]
    );
    return result.rows.map((r: Record<string, unknown>) => ({
      ...this._withVerifiedSafe(r),
      myRole: r.my_role,
    }));
  }

  async getVenue(venueId: string) {
    const result = await query(
      `SELECT v.*, p.display_name as owner_name
       FROM venues v LEFT JOIN user_profiles p ON v.verified_owner_id = p.user_id
       WHERE v.id = $1`, [venueId]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return this._withVerifiedSafe(row);
  }

  /** Add verifiedSafe boolean for API (true when verified_safe_at is set). */
  private _withVerifiedSafe(row: Record<string, unknown>): Record<string, unknown> & { verifiedSafe: boolean } {
    const verifiedSafe = row.verified_safe_at != null;
    return { ...row, verifiedSafe };
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
    return result.rows.map((r: Record<string, unknown>) => this._withVerifiedSafe(r));
  }

  /** Self-attest "verified safe" checklist (venue owner only). Sets verified_safe_at and optional metadata. */
  async setVerifiedSafe(venueId: string, ownerId: string, metadata?: Record<string, unknown>) {
    const auth = await query('SELECT id FROM venues WHERE id = $1 AND verified_owner_id = $2', [venueId, ownerId]);
    if (auth.rows.length === 0) {
      throw Object.assign(new Error('Venue not found or unauthorized'), { statusCode: 403 });
    }
    const hasCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'verified_safe_at'`
    );
    if (hasCol.rows.length === 0) {
      throw Object.assign(new Error('Verified safe feature not available'), { statusCode: 501 });
    }
    await query(
      `UPDATE venues SET verified_safe_at = NOW(), verified_safe_metadata = $2 WHERE id = $1 AND verified_owner_id = $3`,
      [venueId, metadata ? JSON.stringify(metadata) : '{}', ownerId]
    );
    return this.getVenue(venueId);
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
