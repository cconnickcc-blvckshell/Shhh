import { Router } from 'express';
import { z } from 'zod';
import { TonightController } from './tonight.controller';
import { TonightService } from './tonight.service';
import { EventsService } from '../events/events.service';
import { VenuesService } from '../venues/venues.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const eventsService = new EventsService();
const venuesService = new VenuesService();
const tonightService = new TonightService(eventsService, venuesService);
const controller = new TonightController(tonightService);

const querySchema = z.object({
  lat: z.string().refine((v) => !Number.isNaN(parseFloat(v)), 'Must be a number'),
  lng: z.string().refine((v) => !Number.isNaN(parseFloat(v)), 'Must be a number'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  radius: z.string().optional(),
});

router.get('/', authenticate, validate(querySchema, 'query'), controller.getFeed.bind(controller));

export default router;
