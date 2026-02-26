import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { E2EEService } from './e2ee.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new E2EEService();

router.post('/keys/register', authenticate, validate(z.object({
  publicKey: z.string().min(10),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.registerPublicKey(req.user!.userId, req.body.publicKey);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/keys/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await svc.getPublicKey(req.params.userId as string);
    if (!key) { res.status(404).json({ error: { message: 'No public key found' } }); return; }
    res.json({ data: key });
  } catch (err) { next(err); }
});

router.get('/keys/:userId/bundle', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundle = await svc.getKeyBundle(req.params.userId as string);
    if (!bundle) { res.status(404).json({ error: { message: 'No key bundle available' } }); return; }
    res.json({ data: bundle });
  } catch (err) { next(err); }
});

router.post('/keys/prekeys', authenticate, validate(z.object({
  prekeys: z.array(z.string().min(10)).min(1).max(100),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.uploadPrekeys(req.user!.userId, req.body.prekeys);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/keys/conversation', authenticate, validate(z.object({
  conversationId: z.string().uuid(),
  encryptedKey: z.string().min(10),
  version: z.number().int().positive().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.storeConversationKey(req.body.conversationId, req.user!.userId, req.body.encryptedKey, req.body.version);
    res.json({ data: { stored: true } });
  } catch (err) { next(err); }
});

router.get('/keys/conversation/:conversationId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await svc.getConversationKey(req.params.conversationId as string, req.user!.userId);
    if (!key) { res.status(404).json({ error: { message: 'No conversation key found' } }); return; }
    res.json({ data: key });
  } catch (err) { next(err); }
});

export default router;
