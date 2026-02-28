import { Router } from 'express';
import { z } from 'zod';
import { VenuesController } from './venues.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const ctrl = new VenuesController();

const createVenueSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.enum(['club', 'hotel', 'private_residence', 'resort', 'other']).optional(),
  capacity: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  venueType: z.enum(['physical', 'promoter', 'series']).optional(),
});

const nearbyQuerySchema = z.object({
  lat: z.string().refine(v => !isNaN(parseFloat(v))),
  lng: z.string().refine(v => !isNaN(parseFloat(v))),
  radius: z.string().optional(),
});

const verifiedSafeSchema = z.object({
  checklistJson: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
}).optional();

router.get('/nearby', authenticate, validate(nearbyQuerySchema, 'query'), ctrl.getNearby);
router.get('/geofence-check', authenticate, validate(nearbyQuerySchema, 'query'), ctrl.checkGeofences);
router.post('/', authenticate, requireTier(2), validate(createVenueSchema), ctrl.create);
router.get('/:id', authenticate, ctrl.getOne);
router.put('/:id', authenticate, ctrl.update);
router.put('/:id/verified-safe', authenticate, validate(verifiedSafeSchema), ctrl.setVerifiedSafe);

export default router;
