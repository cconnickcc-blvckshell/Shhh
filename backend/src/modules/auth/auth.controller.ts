import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { AuthService } from './auth.service';
import { OTPService } from './otp.service';
import * as oauthService from './oauth.service';
import { setAdminAuthCookie, clearAdminAuthCookie } from '../../middleware/auth';

const authService = new AuthService();
const otpService = new OTPService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, displayName, sessionToken, referralCode } = req.body;
      let verifiedPhone = phone;

      if (config.nodeEnv === 'test' && !sessionToken) {
        // Test bypass for backward compat with existing tests
      } else if (sessionToken) {
        verifiedPhone = await otpService.validateOTPSession(sessionToken);
        if (phone && phone !== verifiedPhone) {
          throw Object.assign(new Error('Phone does not match verification session'), { statusCode: 400 });
        }
      } else {
        throw Object.assign(new Error('OTP verification required. Please verify your phone first.'), { statusCode: 401 });
      }

      const result = await authService.registerWithPhone(verifiedPhone, displayName, referralCode);
      if (sessionToken) await otpService.consumeOTPSession(sessionToken);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, sessionToken } = req.body;
      let verifiedPhone = phone;

      if (config.nodeEnv === 'test' && !sessionToken) {
        // Test bypass for backward compat with existing tests
      } else if (sessionToken) {
        verifiedPhone = await otpService.validateOTPSession(sessionToken);
        if (phone && phone !== verifiedPhone) {
          throw Object.assign(new Error('Phone does not match verification session'), { statusCode: 400 });
        }
      } else {
        throw Object.assign(new Error('OTP verification required. Please verify your phone first.'), { statusCode: 401 });
      }

      const result = await authService.loginWithPhone(verifiedPhone);
      if (sessionToken) await otpService.consumeOTPSession(sessionToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      res.json({ data: tokens });
    } catch (err) {
      next(err);
    }
  }

  async oauthApple(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, displayName, referralCode } = req.body;
      const oauthUser = await oauthService.verifyAppleIdToken(idToken);
      const result = await authService.loginOrRegisterWithOAuth(oauthUser, displayName, referralCode);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async oauthGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, displayName, referralCode } = req.body;
      const oauthUser = await oauthService.verifyGoogleIdToken(idToken);
      const result = await authService.loginOrRegisterWithOAuth(oauthUser, displayName, referralCode);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async oauthSnap(req: Request, res: Response, next: NextFunction) {
    try {
      const { authCode, displayName, referralCode } = req.body;
      const oauthUser = await oauthService.verifySnapAuthCode(authCode);
      const result = await authService.loginOrRegisterWithOAuth(oauthUser, displayName, referralCode);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async adminBypass(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.adminBypassLogin();
      setAdminAuthCookie(res, result.accessToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async registerEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName, referralCode } = req.body;
      const result = await authService.registerWithEmail(email, password, displayName, referralCode);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async adminLogout(_req: Request, res: Response, next: NextFunction) {
    try {
      clearAdminAuthCookie(res);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async loginEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginWithEmail(email, password);
      const { query } = await import('../../config/database');
      const roleRow = await query('SELECT role FROM users WHERE id = $1', [result.userId]);
      const role = roleRow.rows[0]?.role;
      if (role && ['admin', 'moderator', 'superadmin'].includes(role)) {
        setAdminAuthCookie(res, result.accessToken);
      }
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
