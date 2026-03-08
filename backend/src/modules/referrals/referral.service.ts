import { query } from '../../config/database';
import crypto from 'crypto';

const CODE_LENGTH = 8;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,1,I to avoid confusion

function generateCode(): string {
  let code = '';
  const bytes = crypto.randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  }
  return code;
}

export class ReferralService {
  /** Get or create user's referral code. Returns 8-char alphanumeric. */
  async getOrCreateCode(userId: string): Promise<string> {
    const existing = await query(
      `SELECT code FROM referral_codes WHERE user_id = $1`,
      [userId]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].code;
    }

    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      const inserted = await query(
        `INSERT INTO referral_codes (user_id, code) VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING RETURNING code`,
        [userId, code]
      );
      if (inserted.rows.length > 0) return inserted.rows[0].code;
      attempts++;
    } while (attempts < 5);

    throw Object.assign(new Error('Failed to generate unique referral code'), { statusCode: 500 });
  }

  /** Resolve referral code to referrer user_id. Returns null if invalid. */
  async resolveCode(code: string): Promise<string | null> {
    if (!code || code.length < 4) return null;
    const normalized = code.toUpperCase().trim();
    const r = await query(
      `SELECT user_id FROM referral_codes WHERE code = $1`,
      [normalized]
    );
    return r.rows[0]?.user_id ?? null;
  }

  /** Record that referredUserId was referred by referrerId. Idempotent. */
  async recordReferral(referrerId: string, referredUserId: string): Promise<void> {
    if (referrerId === referredUserId) return;
    await query(
      `INSERT INTO referrals (referrer_id, referred_user_id) VALUES ($1, $2)
       ON CONFLICT (referred_user_id) DO NOTHING`,
      [referrerId, referredUserId]
    );
  }

  /** Get my referral stats: code, count of referred users. */
  async getMyReferrals(userId: string): Promise<{ code: string; referredCount: number }> {
    const code = await this.getOrCreateCode(userId);
    const countResult = await query(
      `SELECT COUNT(*)::int as cnt FROM referrals WHERE referrer_id = $1`,
      [userId]
    );
    return {
      code,
      referredCount: countResult.rows[0]?.cnt ?? 0,
    };
  }
}
