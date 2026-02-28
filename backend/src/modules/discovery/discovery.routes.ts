import { Router } from 'express';
import { z } from 'zod';
import { DiscoveryController } from './discovery.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new DiscoveryController();

const discoverQuerySchema = z.object({
  lat: z.string().refine((v) => !isNaN(parseFloat(v)), 'Must be a number'),
  lng: z.string().refine((v) => !isNaN(parseFloat(v)), 'Must be a number'),
  radius: z.string().optional(),
  gender: z.string().optional(),
  experienceLevel: z.string().optional(),
  minTier: z.string().optional(),
  venueId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
});

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isPrecise: z.boolean().optional(),
});

router.get('/', authenticate, validate(discoverQuerySchema, 'query'), controller.discover);
router.post('/location', authenticate, validate(updateLocationSchema), controller.updateLocation);

export default router;
