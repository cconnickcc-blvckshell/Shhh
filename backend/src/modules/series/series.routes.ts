import { Router } from 'express';
import { z } from 'zod';
import { SeriesController } from './series.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const controller = new SeriesController();

const createSeriesSchema = z.object({
  name: z.string().min(2).max(200),
  venueId: z.string().uuid().optional(),
  recurrenceRule: z.string().max(500).optional(),
});

router.post('/', authenticate, requireTier(2), validate(createSeriesSchema), controller.create.bind(controller));
router.get('/:id', authenticate, controller.getOne.bind(controller));
router.get('/:id/upcoming', authenticate, controller.getUpcoming.bind(controller));
router.post('/:id/follow', authenticate, controller.follow.bind(controller));
router.delete('/:id/follow', authenticate, controller.unfollow.bind(controller));

export default router;
