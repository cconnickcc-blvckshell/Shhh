/**
 * Test-only routes. Mounted only when TEST_MODE=true or NODE_ENV=test.
 * Never enabled in production.
 */
import { Router } from 'express';
import { seed } from './seed.controller';
import { reset } from './reset.controller';
import { mintToken } from './token.controller';
import { testHealth } from './health.controller';

const router = Router();

router.get('/health', testHealth);
router.post('/reset', reset);
router.post('/seed', seed);
router.post('/token', mintToken);

export default router;
