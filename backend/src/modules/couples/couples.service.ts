import crypto from 'crypto';
import { query } from '../../config/database';

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

const COOLDOWN_DAYS = 7;

export class CouplesService {
  async createCouple(userId: string) {
    const existing = await query(
      `SELECT id FROM couples
       WHERE (partner_1_id = $1 OR partner_2_id = $1)
         AND status IN ('pending', 'active')`,
      [userId]
    );
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('Already in a couple'), { statusCode: 409 });
    }

    const inviteCode = generateInviteCode();
    const result = await query(
      `INSERT INTO couples (partner_1_id, invite_code_hash, status)
       VALUES ($1, $2, 'pending') RETURNING id, created_at`,
      [userId, hashValue(inviteCode)]
    );

    return { coupleId: result.rows[0].id, inviteCode };
  }

  async linkPartner(userId: string, inviteCode: string) {
    const codeHash = hashValue(inviteCode);
    const couple = await query(
      `SELECT id, partner_1_id FROM couples
       WHERE invite_code_hash = $1 AND status = 'pending' AND partner_2_id IS NULL`,
      [codeHash]
    );

    if (couple.rows.length === 0) {
      throw Object.assign(new Error('Invalid or expired invite code'), { statusCode: 404 });
    }

    if (couple.rows[0].partner_1_id === userId) {
      throw Object.assign(new Error('Cannot link with yourself'), { statusCode: 400 });
    }

    const existingCouple = await query(
      `SELECT id FROM couples
       WHERE (partner_1_id = $1 OR partner_2_id = $1) AND status IN ('pending', 'active')`,
      [userId]
    );
    if (existingCouple.rows.length > 0) {
      throw Object.assign(new Error('Already in a couple'), { statusCode: 409 });
    }

    const result = await query(
      `UPDATE couples SET partner_2_id = $1, status = 'active', verified_at = NOW(), invite_code_hash = NULL, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [userId, couple.rows[0].id]
    );

    return result.rows[0];
  }

  async getMyCouple(userId: string) {
    const result = await query(
      `SELECT c.*,
        p1.display_name as partner_1_name,
        p2.display_name as partner_2_name
       FROM couples c
       LEFT JOIN user_profiles p1 ON c.partner_1_id = p1.user_id
       LEFT JOIN user_profiles p2 ON c.partner_2_id = p2.user_id
       WHERE (c.partner_1_id = $1 OR c.partner_2_id = $1)
         AND c.status IN ('pending', 'active')`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async requestDissolution(userId: string, reason?: string) {
    const couple = await this.getMyCouple(userId);
    if (!couple) {
      throw Object.assign(new Error('Not in a couple'), { statusCode: 404 });
    }

    if (couple.dissolution_requested_at) {
      throw Object.assign(new Error('Dissolution already requested'), { statusCode: 409 });
    }

    const cooldownExpires = new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

    await query(
      `UPDATE couples SET
        dissolution_requested_at = NOW(),
        dissolution_confirmed_by = ARRAY[$1::uuid],
        cooldown_expires_at = $2,
        dissolution_reason = $3,
        updated_at = NOW()
       WHERE id = $4`,
      [userId, cooldownExpires, reason || null, couple.id]
    );

    return { cooldownExpires: cooldownExpires.toISOString(), coupleId: couple.id };
  }

  async confirmDissolution(userId: string) {
    const couple = await this.getMyCouple(userId);
    if (!couple) {
      throw Object.assign(new Error('Not in a couple'), { statusCode: 404 });
    }

    if (!couple.dissolution_requested_at) {
      throw Object.assign(new Error('No dissolution requested'), { statusCode: 400 });
    }

    const confirmedBy: string[] = couple.dissolution_confirmed_by || [];
    if (confirmedBy.includes(userId)) {
      throw Object.assign(new Error('Already confirmed'), { statusCode: 409 });
    }

    confirmedBy.push(userId);

    if (confirmedBy.length >= 2 && new Date() >= new Date(couple.cooldown_expires_at)) {
      await query(
        `UPDATE couples SET status = 'dissolved', dissolution_confirmed_by = $1, updated_at = NOW()
         WHERE id = $2`,
        [confirmedBy, couple.id]
      );
      return { dissolved: true };
    }

    await query(
      `UPDATE couples SET dissolution_confirmed_by = $1, updated_at = NOW() WHERE id = $2`,
      [confirmedBy, couple.id]
    );

    return {
      dissolved: false,
      confirmations: confirmedBy.length,
      required: 2,
      cooldownExpires: couple.cooldown_expires_at,
    };
  }
}
