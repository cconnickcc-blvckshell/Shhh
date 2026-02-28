import { query } from '../../config/database';

export type PersonaType = 'solo' | 'couple' | 'anonymous' | 'traveler';

export class PersonaService {
  async createPersona(userId: string, type: PersonaType, displayName: string, options?: {
    bio?: string; kinks?: string[]; blurPhotos?: boolean; linkedPartnerId?: string; expiresAt?: string; isBurn?: boolean;
  }) {
    const subCheck = await query(
      `SELECT persona_slots FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const maxSlots = subCheck.rows[0]?.persona_slots || 1;

    const existing = await query(`SELECT COUNT(*) as cnt FROM personas WHERE user_id = $1`, [userId]);
    if (parseInt(existing.rows[0].cnt) >= maxSlots) {
      throw Object.assign(new Error(`Maximum ${maxSlots} persona(s) allowed. Upgrade for more.`), { statusCode: 403 });
    }

    const hasExpires = await query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'expires_at'`);
    const hasBurn = await query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'is_burn'`);
    const cols = ['user_id', 'type', 'display_name', 'bio', 'kinks', 'blur_photos', 'linked_partner_id'];
    const vals: unknown[] = [userId, type, displayName, options?.bio || '', options?.kinks || [], options?.blurPhotos || false, options?.linkedPartnerId || null];
    if (hasExpires.rows.length > 0) { cols.push('expires_at'); vals.push(options?.expiresAt || null); }
    if (hasBurn.rows.length > 0) { cols.push('is_burn'); vals.push(options?.isBurn ?? false); }
    const result = await query(
      `INSERT INTO personas (${cols.join(', ')}) VALUES (${vals.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
      vals
    );
    return result.rows[0];
  }

  async getMyPersonas(userId: string) {
    const result = await query(
      `SELECT p.*, m.storage_path as avatar_url
       FROM personas p LEFT JOIN media m ON p.avatar_media_id = m.id
       WHERE p.user_id = $1 ORDER BY p.created_at ASC`,
      [userId]
    );
    return result.rows;
  }

  async switchPersona(userId: string, personaId: string) {
    const hasExpires = await query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'expires_at'`);
    const expiresFilter = hasExpires.rows.length > 0 ? ' AND (expires_at IS NULL OR expires_at > NOW())' : '';
    const existing = await query(`SELECT id FROM personas WHERE id = $1 AND user_id = $2${expiresFilter}`, [personaId, userId]);
    if (existing.rows.length === 0) {
      throw Object.assign(new Error('Persona not found or expired'), { statusCode: 404 });
    }
    await query(`UPDATE personas SET is_active = false WHERE user_id = $1`, [userId]);
    const result = await query(
      `UPDATE personas SET is_active = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [personaId, userId]
    );
    return result.rows[0];
  }

  async getActivePersona(userId: string) {
    const hasExpires = await query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'expires_at'`);
    const expiresFilter = hasExpires.rows.length > 0 ? ' AND (p.expires_at IS NULL OR p.expires_at > NOW())' : '';
    const result = await query(
      `SELECT p.*, m.storage_path as avatar_url
       FROM personas p LEFT JOIN media m ON p.avatar_media_id = m.id
       WHERE p.user_id = $1 AND p.is_active = true${expiresFilter}`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async updatePersona(userId: string, personaId: string, data: Record<string, unknown>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const allowed: Record<string, string> = {
      displayName: 'display_name', bio: 'bio', kinks: 'kinks',
      blurPhotos: 'blur_photos', photosJson: 'photos_json', preferencesJson: 'preferences_json',
      expiresAt: 'expires_at', isBurn: 'is_burn',
    };

    for (const [key, col] of Object.entries(allowed)) {
      if (data[key] !== undefined) {
        if (key === 'kinks') { fields.push(`${col} = $${idx}::text[]`); }
        else if (key === 'photosJson' || key === 'preferencesJson') { fields.push(`${col} = $${idx}::jsonb`); values.push(JSON.stringify(data[key])); idx++; continue; }
        else { fields.push(`${col} = $${idx}`); }
        values.push(data[key]);
        idx++;
      }
    }

    if (fields.length === 0) return this.getActivePersona(userId);
    fields.push('updated_at = NOW()');
    values.push(personaId, userId);

    await query(`UPDATE personas SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1}`, values);
    return this.getActivePersona(userId);
  }

  async deletePersona(userId: string, personaId: string) {
    const active = await query(`SELECT is_active FROM personas WHERE id = $1 AND user_id = $2`, [personaId, userId]);
    if (active.rows[0]?.is_active) {
      throw Object.assign(new Error('Cannot delete active persona. Switch first.'), { statusCode: 400 });
    }
    await query(`DELETE FROM personas WHERE id = $1 AND user_id = $2`, [personaId, userId]);
  }
}
