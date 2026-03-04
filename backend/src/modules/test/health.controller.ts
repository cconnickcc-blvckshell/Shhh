/**
 * Test health controller — confirms test mode enabled.
 * Only enabled when TEST_MODE=true or NODE_ENV=test.
 */
import { Request, Response } from 'express';
import { config } from '../../config';

function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true' || config.nodeEnv === 'test';
}

export function testHealth(_req: Request, res: Response): void {
  if (!isTestMode()) {
    res.status(404).send();
    return;
  }
  res.json({
    testMode: true,
    version: process.env.npm_package_version || '0.5.0',
    nodeEnv: config.nodeEnv,
  });
}
