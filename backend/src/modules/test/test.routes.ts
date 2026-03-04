/**
 * Test-only routes. Mounted only when TEST_MODE=true or NODE_ENV=test.
 */
import { Router } from 'express';
import { seed } from './seed.controller';

const router = Router();

router.post('/seed', seed);

export default router;
