import { Request, Response, NextFunction } from 'express';
// Response used by setAdminAuthCookie
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../config/database';
import createError from 'http-errors';

export interface AuthPayload {
  userId: string;
  email?: string;
  tier: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const ADMIN_COOKIE_NAME = 'shhh_admin_token';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.[ADMIN_COOKIE_NAME]) {
    token = req.cookies[ADMIN_COOKIE_NAME];
  }

  if (!token) {
    return next(createError(401, 'Missing or invalid authorization'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(createError(401, 'Invalid or expired token'));
  }
}

/** B.8: Set httpOnly cookie for admin dashboard (when ADMIN_HTTPONLY_COOKIE=true). */
export function setAdminAuthCookie(res: Response, accessToken: string) {
  if (process.env.ADMIN_HTTPONLY_COOKIE !== 'true') return;
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(ADMIN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
}

/** Clear admin auth cookie (for logout). */
export function clearAdminAuthCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' });
}

export function requireTier(minTier: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required'));
    }
    if (req.user.tier < minTier) {
      return next(createError(403, `Verification tier ${minTier} required`));
    }
    next();
  };
}

/** Requires user to be venue owner or active staff for the venue in req.params.id. Use after authenticate. */
export function requireVenueAccess(req: Request, _res: Response, next: NextFunction) {
  const venueId = req.params.id as string;
  const userId = req.user?.userId;
  if (!userId) return next(createError(401, 'Authentication required'));
  void (async () => {
    try {
      const result = await query(
        `SELECT 1 FROM venues WHERE id = $1 AND verified_owner_id = $2
         UNION ALL
         SELECT 1 FROM venue_staff WHERE venue_id = $1 AND user_id = $2 AND is_active = true`,
        [venueId, userId]
      );
      if (!result.rows.length) return next(createError(403, 'Venue access required (owner or staff)'));
      next();
    } catch (err) {
      next(err);
    }
  })();
}

/** Feature names from subscription tiers (e.g. expandedRadius, vault, reveal_l3). */
export type FeatureName = 'anonymousBrowsing' | 'expandedRadius' | 'visibilitySchedule' | 'prioritySafety' | 'unlimitedAlbums' | 'vault' | 'reveal_l3';

/** Creates middleware that requires the user to have the given subscription feature. Uses SubscriptionService. */
export function requireFeature(feature: FeatureName) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required'));
    }
    import('../modules/billing/subscription.service').then(({ SubscriptionService }) => {
      const subscriptionService = new SubscriptionService();
      return subscriptionService.hasFeature(req.user!.userId, feature);
    }).then((hasIt) => {
      if (!hasIt) return next(createError(403, `Feature "${feature}" requires a premium subscription`));
      next();
    }).catch(next);
  };
}
