import { Router } from 'express';
import { z } from 'zod';
import { MessagingController } from './messaging.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';
import { idempotencyMiddleware } from '../../middleware/idempotency';

const router = Router();
const controller = new MessagingController();

const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(20),
  type: z.enum(['direct', 'group', 'event']).optional(),
  filterContext: z.record(z.unknown()).optional(), // For initiation cap per filter view
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  contentType: z.enum(['text', 'image', 'location']).optional(),
  ttlSeconds: z.number().positive().optional(),
  clientMessageId: z.string().uuid().optional(), // Idempotency: same key within 5min returns existing message
});

const retentionSchema = z.object({
  mode: z.enum(['ephemeral', 'timed_archive', 'persistent']),
  archiveAt: z.string().optional(),
  defaultMessageTtlSeconds: z.number().positive().optional(),
});

router.get('/unread-total', authenticate, requireTier(0), controller.getUnreadTotal);
router.get('/', authenticate, requireTier(0), controller.getConversations);
router.post('/', authenticate, requireTier(1), idempotencyMiddleware('conversations'), validate(createConversationSchema), controller.createConversation);
router.put('/:id/retention', authenticate, validate(retentionSchema), controller.setRetention);
router.get('/:id/messages', authenticate, controller.getMessages);
router.post('/:id/messages', authenticate, validate(sendMessageSchema), controller.sendMessage);

export default router;
