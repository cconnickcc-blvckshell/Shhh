import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { query } from '../../config/database';
import { AuthPayload } from '../../middleware/auth';
import { hashPhone, hashGeneric, hashEmail } from '../../utils/hash';
import type { OAuthUser } from './oauth.service';

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

  async registerWithEmail(email: string, password: string, displayName: string) {
    const emailHash = hashEmail(email);
    const existing = await query('SELECT id FROM users WHERE email_hash = $1', [emailHash]);
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    const passwordHash = await this.hashPassword(password);
    const result = await query(
      `INSERT INTO users (phone_hash, email_hash, password_hash, verification_tier) VALUES (NULL, $1, $2, 0) RETURNING id`,
      [emailHash, passwordHash]
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

  async loginWithEmail(email: string, password: string) {
    const emailHash = hashEmail(email);
    const result = await query(
      'SELECT id, verification_tier, password_hash FROM users WHERE email_hash = $1 AND is_active = true AND deleted_at IS NULL',
      [emailHash]
    );
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }
    const valid = await this.verifyPassword(user.password_hash, password);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

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

  async loginOrRegisterWithOAuth(oauthUser: OAuthUser, displayName?: string) {
    const { provider, providerUserId, email, displayName: oauthDisplayName } = oauthUser;
    const name = displayName ?? oauthDisplayName ?? 'User';

    const existing = await query(
      `SELECT oa.user_id, u.verification_tier FROM oauth_accounts oa
       JOIN users u ON u.id = oa.user_id
       WHERE oa.provider = $1 AND oa.provider_user_id = $2 AND u.is_active = true AND u.deleted_at IS NULL`,
      [provider, providerUserId]
    );

    if (existing.rows.length > 0) {
      const { user_id: userId, verification_tier: tier } = existing.rows[0];
      await query(
        `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'user.login', 'account')`,
        [userId]
      );
      const tokens = await this.generateTokens(userId, tier);
      return { userId, ...tokens };
    }

    const emailHash = email ? hashEmail(email) : null;
    const result = await query(
      `INSERT INTO users (phone_hash, verification_tier) VALUES (NULL, 0) RETURNING id`,
      []
    );
    const userId = result.rows[0].id;

    await query(
      `INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)`,
      [userId, name]
    );

    await query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email_hash, display_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, provider, providerUserId, emailHash, oauthDisplayName ?? name]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'user.registered', 'account')`,
      [userId]
    );

    const tokens = await this.generateTokens(userId, 0);
    return { userId, ...tokens };
  }

  async logout(userId: string) {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'user.logout', 'account')`,
      [userId]
    );
  }

  /** Test-only bypass: NODE_ENV=test only. Never enabled in development or production. */
  async adminBypassLogin() {
    const bypassAllowed = config.nodeEnv === 'test';
    if (!bypassAllowed) {
      throw Object.assign(
        new Error('Admin bypass not enabled.'),
        { statusCode: 403 }
      );
    }
    const result = await query(
      `SELECT id, verification_tier FROM users
       WHERE role IN ('admin', 'moderator', 'superadmin') AND is_active = true AND deleted_at IS NULL
       ORDER BY CASE role WHEN 'superadmin' THEN 3 WHEN 'admin' THEN 2 WHEN 'moderator' THEN 1 ELSE 0 END DESC
       LIMIT 1`,
      []
    );
    if (result.rows.length === 0) {
      throw Object.assign(new Error('No admin user found. Run seed first.'), { statusCode: 404 });
    }
    const { id: userId, verification_tier: tier } = result.rows[0];
    const tokens = await this.generateTokens(userId, tier);
    return { userId, ...tokens };
  }

  /** Test-only: mint JWT for a user by ID without OTP. Used by load test harness. */
  async mintTokenForTest(userId: string) {
    const result = await query(
      'SELECT verification_tier FROM users WHERE id = $1 AND is_active = true AND deleted_at IS NULL',
      [userId]
    );
    if (result.rows.length === 0) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    return this.generateTokens(userId, result.rows[0].verification_tier);
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
