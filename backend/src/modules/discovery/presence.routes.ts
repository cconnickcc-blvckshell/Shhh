import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PresenceService } from './presence.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new PresenceService();

const setState = z.object({
  state: z.enum(['invisible', 'nearby', 'browsing', 'at_venue', 'at_event', 'open_to_chat', 'paused']),
  venueId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  decayMinutes: z.number().positive().max(480).optional(),
});

router.post('/state', authenticate, validate(setState), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.setPresence(req.user!.userId, req.body.state, req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const presence = await svc.getPresence(req.user!.userId);
    res.json({ data: presence });
  } catch (err) { next(err); }
});

router.post('/reaffirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.reaffirm(req.user!.userId);
    if (!result) { res.json({ data: { state: 'invisible', message: 'No active presence to reaffirm' } }); return; }
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.delete('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.goInvisible(req.user!.userId);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.get('/venue/:venueId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await svc.getActiveAtVenue(req.params.venueId as string);
    res.json({ data: users, count: users.length });
  } catch (err) { next(err); }
});

export default router;
