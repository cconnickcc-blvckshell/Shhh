import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { WhisperService } from './whisper.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new WhisperService();

router.post('/', authenticate, validate(z.object({
  toUserId: z.string().uuid(),
  message: z.string().min(1).max(100),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.sendWhisper(req.user!.userId, req.body.toUserId, req.body.message);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

router.get('/inbox', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const whispers = await svc.getMyWhispers(req.user!.userId);
    res.json({ data: whispers, count: whispers.length });
  } catch (err) { next(err); }
});

router.get('/sent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const whispers = await svc.getSentWhispers(req.user!.userId);
    res.json({ data: whispers, count: whispers.length });
  } catch (err) { next(err); }
});

router.post('/:id/respond', authenticate, validate(z.object({
  response: z.string().min(1).max(100),
  reveal: z.boolean().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.respondToWhisper(req.params.id as string, req.user!.userId, req.body.response, req.body.reveal);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/:id/seen', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.markSeen(req.params.id as string, req.user!.userId);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/:id/ignore', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.ignoreWhisper(req.params.id as string, req.user!.userId);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
