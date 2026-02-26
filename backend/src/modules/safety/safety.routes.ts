import { Router } from 'express';
import { z } from 'zod';
import { SafetyController } from './safety.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();
const ctrl = new SafetyController();

const addContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(15),
  relationship: z.string().max(50).optional(),
});

const checkInSchema = z.object({
  type: z.enum(['arrived', 'periodic', 'departed']),
  eventId: z.string().uuid().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  nextCheckInMinutes: z.number().positive().optional(),
});

const panicSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

router.get('/contacts', authenticate, ctrl.getContacts);
router.post('/contacts', authenticate, validate(addContactSchema), ctrl.addContact);
router.delete('/contacts/:id', authenticate, ctrl.removeContact);
router.post('/checkin', authenticate, validate(checkInSchema), ctrl.checkIn);
router.post('/panic', authenticate, validate(panicSchema), ctrl.panic);

export default router;
