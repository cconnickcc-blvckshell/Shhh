import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { query } from '../../config/database';
import { AuthPayload } from '../../middleware/auth';
import { hashPhone, hashGeneric } from '../../utils/hash';

function hashValue(value: string): string {
  return hashGeneric(value);
}

export class AuthService {
  async registerWithPhone(phone: string, displayName: string) {
    const phoneHash = hashPhone(phone);

    const existing = await query('SELECT id FROM users WHERE phone_hash = $1', [phoneHash]);
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('Phone number already registered'), { statusCode: 409 });
    }

    const result = await query(
      `INSERT INTO users (phone_hash, verification_tier) VALUES ($1, 0) RETURNING id, created_at`,
      [phoneHash]
    );
    const userId = result.rows[0].id;

    await query(
      `INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)`,
      [userId, displayName]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'user.registered', 'account')`,
      [userId]
    );

    const tokens = await this.generateTokens(userId, 0);
    return { userId, ...tokens };
  }

  async loginWithPhone(phone: string) {
    const phoneHash = hashPhone(phone);

    const result = await query(
      'SELECT id, verification_tier FROM users WHERE phone_hash = $1 AND is_active = true AND deleted_at IS NULL',
      [phoneHash]
    );
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const user = result.rows[0];
    const tokens = await this.generateTokens(user.id, user.verification_tier);

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'user.login', 'account')`,
      [user.id]
    );

    return { userId: user.id, ...tokens };
  }

  async refreshToken(refreshTokenStr: string) {
    const tokenHash = hashValue(refreshTokenStr);

    const result = await query(
      `SELECT rt.id, rt.user_id, u.verification_tier
       FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    const { id: oldTokenId, user_id: userId, verification_tier: tier } = result.rows[0];

    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [oldTokenId]);

    return this.generateTokens(userId, tier);
  }

  async logout(userId: string) {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'user.logout', 'account')`,
      [userId]
    );
  }

  private async generateTokens(userId: string, tier: number) {
    const payload: AuthPayload = { userId, tier };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry as string,
    } as jwt.SignOptions);

    const refreshToken = uuidv4();
    const refreshHash = hashValue(refreshToken);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, refreshHash]
    );

    return { accessToken, refreshToken };
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(_hash: string, _password: string): Promise<boolean> {
    return argon2.verify(_hash, _password);
  }
}
