import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BlurRevealService } from './blur.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new BlurRevealService();

router.put('/preference', authenticate, validate(z.object({
  blurPhotos: z.boolean(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.setBlurPreference(req.user!.userId, req.body.blurPhotos);
    res.json({ data: { blurPhotos: req.body.blurPhotos } });
  } catch (err) { next(err); }
});

router.post('/reveal', authenticate, validate(z.object({
  toUserId: z.string().uuid(),
  expiresInHours: z.number().positive().optional(),
  level: z.number().int().min(0).max(2).optional(),
  scopeType: z.enum(['global', 'conversation']).optional(),
  scopeId: z.string().uuid().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.revealPhotosTo(req.user!.userId, req.body.toUserId, {
      expiresInHours: req.body.expiresInHours,
      level: req.body.level,
      scopeType: req.body.scopeType,
      scopeId: req.body.scopeId,
    });
    res.json({ data: { revealed: true } });
  } catch (err) { next(err); }
});

router.delete('/reveal/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.revokeReveal(req.user!.userId, req.params.userId as string);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.get('/reveals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reveals = await svc.getMutualReveals(req.user!.userId);
    res.json({ data: reveals, count: reveals.length });
  } catch (err) { next(err); }
});

router.get('/check/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const canSee = await svc.canSeeUnblurred(req.user!.userId, req.params.userId as string);
    res.json({ data: { unblurred: canSee } });
  } catch (err) { next(err); }
});

export default router;
