import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { ReferralService } from './referral.service';

const router = Router();
const referralService = new ReferralService();

/** GET /v1/referrals/me — My code and referred count (Wave 5) */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await referralService.getMyReferrals(req.user!.userId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
