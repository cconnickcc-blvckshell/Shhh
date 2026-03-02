import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ChatSessionService } from './session.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new ChatSessionService();

router.post('/session', authenticate, validate(z.object({
  participantIds: z.array(z.string().uuid()).min(1),
  ttlHours: z.number().positive().max(168).optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await svc.createSessionChat(
      [req.user!.userId, ...req.body.participantIds],
      req.body.ttlHours || 24
    );
    res.status(201).json({ data: session });
  } catch (err) { next(err); }
});

router.post('/:id/consent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.grantConsent(req.params.id as string, req.user!.userId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/panic-wipe', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.panicWipe(req.user!.userId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
