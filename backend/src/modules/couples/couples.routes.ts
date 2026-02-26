import { Router } from 'express';
import { z } from 'zod';
import { CouplesController } from './couples.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const ctrl = new CouplesController();

router.post('/', authenticate, ctrl.create);
router.get('/me', authenticate, ctrl.getMyCouple);
router.post('/link', authenticate, validate(z.object({ inviteCode: z.string().length(8) })), ctrl.link);
router.post('/dissolve', authenticate, validate(z.object({ reason: z.string().max(500).optional() })), ctrl.requestDissolution);
router.post('/confirm-dissolution', authenticate, ctrl.confirmDissolution);

export default router;
