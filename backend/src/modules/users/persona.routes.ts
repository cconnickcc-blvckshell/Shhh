import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PersonaService } from './persona.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new PersonaService();

const createSchema = z.object({
  type: z.enum(['solo', 'couple', 'anonymous', 'traveler']),
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  kinks: z.array(z.string()).optional(),
  blurPhotos: z.boolean().optional(),
  linkedPartnerId: z.string().uuid().optional(),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const personas = await svc.getMyPersonas(req.user!.userId);
    res.json({ data: personas, count: personas.length });
  } catch (err) { next(err); }
});

router.get('/active', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const persona = await svc.getActivePersona(req.user!.userId);
    res.json({ data: persona });
  } catch (err) { next(err); }
});

router.post('/', authenticate, validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const persona = await svc.createPersona(req.user!.userId, req.body.type, req.body.displayName, req.body);
    res.status(201).json({ data: persona });
  } catch (err) { next(err); }
});

router.post('/:id/activate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const persona = await svc.switchPersona(req.user!.userId, req.params.id as string);
    res.json({ data: persona });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const persona = await svc.updatePersona(req.user!.userId, req.params.id as string, req.body);
    res.json({ data: persona });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deletePersona(req.user!.userId, req.params.id as string);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
