import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PreferencesService } from './preferences.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const svc = new PreferencesService();

const VALID_GENDERS = ['man', 'woman', 'couple', 'trans_man', 'trans_woman', 'non_binary', 'other'];
const VALID_ROLES = ['top', 'bottom', 'versatile', 'switch', 'dom', 'sub', 'n_a'];
const VALID_RELATIONSHIPS = ['single', 'coupled', 'open', 'poly', 'its_complicated'];
const VALID_EXPERIENCE = ['new', 'curious', 'experienced', 'veteran'];

const updateSchema = z.object({
  showAsRole: z.enum(VALID_ROLES as [string, ...string[]]).nullable().optional(),
  showAsRelationship: z.enum(VALID_RELATIONSHIPS as [string, ...string[]]).nullable().optional(),
  age: z.number().int().min(18).max(99).nullable().optional(),
  seekingGenders: z.array(z.enum(VALID_GENDERS as [string, ...string[]])).nullable().optional(),
  seekingRoles: z.array(z.enum(VALID_ROLES as [string, ...string[]])).nullable().optional(),
  seekingRelationships: z.array(z.enum(VALID_RELATIONSHIPS as [string, ...string[]])).nullable().optional(),
  seekingExperience: z.array(z.enum(VALID_EXPERIENCE as [string, ...string[]])).nullable().optional(),
  seekingAgeMin: z.number().int().min(18).max(99).nullable().optional(),
  seekingAgeMax: z.number().int().min(18).max(99).nullable().optional(),
  seekingVerifiedOnly: z.boolean().optional(),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefs = await svc.getPreferences(req.user!.userId);
    res.json({ data: prefs });
  } catch (err) { next(err); }
});

router.put('/', authenticate, validate(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefs = await svc.updatePreferences(req.user!.userId, req.body);
    res.json({ data: prefs });
  } catch (err) { next(err); }
});

export default router;
