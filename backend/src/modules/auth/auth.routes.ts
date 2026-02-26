import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
const controller = new AuthController();

const registerSchema = z.object({
  phone: z.string().min(10).max(15),
  displayName: z.string().min(2).max(50),
});

const loginSchema = z.object({
  phone: z.string().min(10).max(15),
});

const refreshSchema = z.object({
  refreshToken: z.string().uuid(),
});

router.post('/register', authRateLimiter, validate(registerSchema), controller.register);
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);
router.delete('/logout', authenticate, controller.logout);

export default router;
