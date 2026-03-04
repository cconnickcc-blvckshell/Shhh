/**
 * Test token controller — mints JWT for a seeded user without OTP.
 * Only enabled when TEST_MODE=true or NODE_ENV=test.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';
import { config } from '../../config';

const authService = new AuthService();

function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true' || config.nodeEnv === 'test';
}

export async function mintToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isTestMode()) {
    res.status(404).send();
    return;
  }

  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: { message: 'userId required' } });
      return;
    }
    const tokens = await authService.mintTokenForTest(userId);
    res.json({ data: tokens });
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404) {
      res.status(404).json({ error: { message: 'User not found' } });
      return;
    }
    next(err);
  }
}
