import { Router } from 'express';
import { z } from 'zod';
import { EventsController } from './events.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const controller = new EventsController();

const vibeTagEnum = z.enum(['social_mix', 'lifestyle', 'kink', 'couples_only', 'newbie_friendly']);

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  venueId: z.string().uuid().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  type: z.enum(['party', 'club_night', 'hotel_takeover', 'travel_meetup']).optional(),
  capacity: z.number().positive().optional(),
  isPrivate: z.boolean().optional(),
  vibeTag: vibeTagEnum.optional(),
});

const rsvpSchema = z.object({
  status: z.enum(['going', 'maybe', 'declined']),
});

const nearbyQuerySchema = z.object({
  lat: z.string().refine((v) => !isNaN(parseFloat(v)), 'Must be a number'),
  lng: z.string().refine((v) => !isNaN(parseFloat(v)), 'Must be a number'),
  radius: z.string().optional(),
  vibe: vibeTagEnum.optional(),
});

router.get('/nearby', authenticate, validate(nearbyQuerySchema, 'query'), controller.getNearby);
router.post('/', authenticate, requireTier(2), validate(createEventSchema), controller.create);
router.get('/:id', authenticate, controller.getOne);
router.get('/:id/attendees', authenticate, controller.getAttendees);
router.get('/:id/chat-rooms', authenticate, controller.getChatRooms);
router.post('/:id/rsvp', authenticate, validate(rsvpSchema), controller.rsvp);
router.post('/:id/checkin', authenticate, controller.checkIn);

export default router;
