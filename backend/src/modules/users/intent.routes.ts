import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IntentService } from './intent.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new IntentService();

const setIntentSchema = z.object({
  flag: z.enum([
    'open_tonight', 'traveling', 'hosting', 'at_event',
    'looking_for_friends', 'looking_for_more', 'just_browsing',
    'new_in_town', 'couples_only', 'single_friendly',
  ]),
  expiresInHours: z.number().positive().max(48).optional(),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intents = await svc.getMyIntents(req.user!.userId);
    res.json({ data: intents });
  } catch (err) { next(err); }
});

router.post('/', authenticate, validate(setIntentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.setIntent(req.user!.userId, req.body.flag, req.body.expiresInHours || 8);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.delete('/:flag', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.removeIntent(req.user!.userId, req.params.flag as any);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
