import { query } from '../../config/database';
import { getRedis } from '../../config/redis';
import { logger } from '../../config/logger';

const PUSH_COALESCE_SEC = 30;

export class PushService {
  async registerToken(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
    await query(
      `INSERT INTO push_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO UPDATE SET
         is_active = true, platform = $3, updated_at = NOW()`,
      [userId, token, platform]
    );
  }

  async unregisterToken(userId: string, token: string) {
    await query(
      `UPDATE push_tokens SET is_active = false WHERE user_id = $1 AND token = $2`,
      [userId, token]
    );
  }

  async getActiveTokens(userId: string) {
    const result = await query(
      `SELECT token, platform FROM push_tokens WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    return result.rows;
  }

  /** Whether user has neutral (stealth) notifications — no explicit content in title/body. */
  async getStealthPreference(userId: string): Promise<boolean> {
    const prefs = await this.getNotificationPrefs(userId);
    return !!prefs.neutral_notifications;
  }

  /** Notification preferences from preferences_json. Defaults: push on. */
  async getNotificationPrefs(userId: string): Promise<{
    push_messages?: boolean;
    push_whispers?: boolean;
    push_likes?: boolean;
    neutral_notifications?: boolean;
  }> {
    const r = await query(
      `SELECT preferences_json FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    const prefs = (r.rows[0]?.preferences_json as Record<string, unknown> | undefined) || {};
    return {
      push_messages: prefs.push_messages !== false,
      push_whispers: prefs.push_whispers !== false,
      push_likes: prefs.push_likes !== false,
      neutral_notifications: prefs.neutral_notifications === true,
    };
  }

  /** Whether to send push when someone likes your profile (Wave 4). */
  async shouldPushLikes(userId: string): Promise<boolean> {
    const prefs = await this.getNotificationPrefs(userId);
    return !!prefs.push_likes;
  }

  /** Whether to send push for new messages. */
  async shouldPushMessages(userId: string): Promise<boolean> {
    const prefs = await this.getNotificationPrefs(userId);
    return !!prefs.push_messages;
  }

  /** Whether to send push for whispers. */
  async shouldPushWhispers(userId: string): Promise<boolean> {
    const prefs = await this.getNotificationPrefs(userId);
    return !!prefs.push_whispers;
  }

  /** Throttle message pushes: max 1 per user per PUSH_COALESCE_SEC to avoid spam. */
  async sendPush(userId: string, title: string, body: string, data?: Record<string, string>) {
    const tokens = await this.getActiveTokens(userId);
    if (tokens.length === 0) return;

    const redis = getRedis();
    const throttleKey = `push:throttle:${userId}`;
    const exists = await redis.set(throttleKey, '1', 'EX', PUSH_COALESCE_SEC, 'NX');
    if (!exists) return;

    const expoTokens = tokens.filter(t => t.token.startsWith('ExponentPushToken'));
    if (expoTokens.length === 0) {
      logger.debug({ userId, tokenCount: tokens.length }, 'No Expo push tokens found');
      return;
    }

    let displayTitle = title;
    let displayBody = body;
    try {
      const useNeutral = await this.getStealthPreference(userId);
      if (useNeutral) {
        displayTitle = 'Notification';
        displayBody = 'You have a new notification';
      }
    } catch {
      // ignore
    }

    try {
      const messages = expoTokens.map(t => ({
        to: t.token,
        title: displayTitle,
        body: displayBody,
        data: data || {},
        sound: 'default' as const,
        priority: 'high' as const,
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        logger.error({ status: response.status }, 'Expo push send failed');
      }
    } catch (err) {
      logger.error({ err }, 'Push notification error');
    }
  }

  async sendToMultiple(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    await Promise.all(userIds.map(id => this.sendPush(id, title, body, data)));
  }
}
