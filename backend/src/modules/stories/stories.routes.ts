import { Router } from 'express';
import { z } from 'zod';
import { StoriesController } from './stories.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new StoriesController();

const createStorySchema = z.object({
  mediaId: z.string().uuid(),
  venueId: z.string().uuid().optional(),
  ttlHours: z.number().min(1).max(168).optional(),
});

const nearbyQuerySchema = z.object({
  lat: z.string().refine((v) => !isNaN(parseFloat(v)), 'Must be a number'),
  lng: z.string().refine((v) => !isNaN(parseFloat(v)), 'Must be a number'),
  radius: z.string().optional(),
  limit: z.string().optional(),
});

router.post('/', authenticate, validate(createStorySchema), controller.create);
router.get('/nearby', authenticate, validate(nearbyQuerySchema, 'query'), controller.getNearby);
router.get('/:id/view', authenticate, controller.view);
router.get('/:id/viewers', authenticate, controller.getViewers);

export default router;
