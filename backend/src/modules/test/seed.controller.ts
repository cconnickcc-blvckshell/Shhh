/**
 * Test seed controller — creates deterministic users for load tests.
 * Only enabled when TEST_MODE=true or NODE_ENV=test.
 */
import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { hashPhone } from '../../utils/hash';
import { AuthService } from '../auth/auth.service';
import { config } from '../../config';

const authService = new AuthService();

function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true' || config.nodeEnv === 'test';
}

export async function seed(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isTestMode()) {
    res.status(404).send();
    return;
  }

  try {
    const { count = 100, lat = 40.7128, lng = -74.006 } = req.body as { count?: number; lat?: number; lng?: number };
    const n = Math.min(Math.max(1, Math.floor(count)), 5000);
    const users: Array<{ userId: string; accessToken: string; refreshToken: string; phone: string }> = [];

    const runId = Date.now().toString(36).slice(-6);
    for (let i = 0; i < n; i++) {
      const phone = `+1555${runId}${i.toString().padStart(6, '0')}`.slice(0, 15);
      const displayName = `LoadUser${i}`;

      const phoneHash = hashPhone(phone);
      const existing = await query('SELECT id FROM users WHERE phone_hash = $1', [phoneHash]);

      let userId: string;
      if (existing.rows.length > 0) {
        const result = await authService.loginWithPhone(phone);
        users.push({
          userId: result.userId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          phone,
        });
        userId = result.userId;
      } else {
        const result = await authService.registerWithPhone(phone, displayName);
        users.push({
          userId: result.userId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          phone,
        });
        userId = result.userId;
      }

      const jitterLat = lat + (Math.random() - 0.5) * 0.02;
      const jitterLng = lng + (Math.random() - 0.5) * 0.02;
      await query(
        `INSERT INTO locations (user_id, geom_point, updated_at) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), NOW())
         ON CONFLICT (user_id) DO UPDATE SET geom_point = ST_SetSRID(ST_MakePoint($2, $3), 4326), updated_at = NOW()`,
        [userId, jitterLng, jitterLat]
      );
    }

    res.json({ data: { users } });
  } catch (err) {
    next(err);
  }
}
