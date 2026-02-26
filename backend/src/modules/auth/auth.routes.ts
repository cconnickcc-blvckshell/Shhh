import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller';
import { OTPService } from './otp.service';
import { PushService } from './push.service';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
const controller = new AuthController();
const otpService = new OTPService();
const pushService = new PushService();

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

const sendCodeSchema = z.object({
  phone: z.string().min(10).max(15),
});

const verifyCodeSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

router.post('/phone/send-code', authRateLimiter, validate(sendCodeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await otpService.sendOTP(req.body.phone);
    res.json({ data: { sent: result.sent, ...(result.devCode ? { devCode: result.devCode } : {}) } });
  } catch (err) { next(err); }
});

router.post('/phone/verify', authRateLimiter, validate(verifyCodeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await otpService.verifyOTP(req.body.phone, req.body.code);
    res.json({ data: { verified: true } });
  } catch (err) { next(err); }
});

router.post('/push-token', authenticate, validate(z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pushService.registerToken(req.user!.userId, req.body.token, req.body.platform);
    res.json({ data: { registered: true } });
  } catch (err) { next(err); }
});

router.delete('/push-token', authenticate, validate(z.object({
  token: z.string().min(1),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pushService.unregisterToken(req.user!.userId, req.body.token);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/register', authRateLimiter, validate(registerSchema), controller.register);
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);
router.delete('/logout', authenticate, controller.logout);

export default router;
