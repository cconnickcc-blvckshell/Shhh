import { Router } from 'express';
import { z } from 'zod';
import { GroupsController } from './groups.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const controller = new GroupsController();

const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'invite_only', 'hidden']).optional(),
});

const linkEventSchema = z.object({
  eventId: z.string().uuid(),
});

router.get('/', authenticate, controller.list);
router.post('/', authenticate, requireTier(2), validate(createGroupSchema), controller.create);
router.get('/:id', authenticate, controller.getOne);
router.post('/:id/join', authenticate, controller.join);
router.delete('/:id/leave', authenticate, controller.leave);
router.get('/:id/members', authenticate, controller.getMembers);
router.get('/:id/events', authenticate, controller.getEvents);
router.post('/:id/events', authenticate, validate(linkEventSchema), controller.linkEvent);

export default router;
