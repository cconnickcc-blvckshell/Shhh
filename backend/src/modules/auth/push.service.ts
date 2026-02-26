import { query } from '../../config/database';
import { logger } from '../../config/logger';

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

  async sendPush(userId: string, title: string, body: string, data?: Record<string, string>) {
    const tokens = await this.getActiveTokens(userId);
    if (tokens.length === 0) return;

    const expoTokens = tokens.filter(t => t.token.startsWith('ExponentPushToken'));
    if (expoTokens.length === 0) {
      logger.debug({ userId, tokenCount: tokens.length }, 'No Expo push tokens found');
      return;
    }

    try {
      const messages = expoTokens.map(t => ({
        to: t.token,
        title,
        body,
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
