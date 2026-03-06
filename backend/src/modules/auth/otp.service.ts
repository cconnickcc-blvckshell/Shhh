import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getRedis } from '../../config/redis';
import { logger } from '../../config/logger';
import { config } from '../../config';

const OTP_TTL = 300;
const OTP_SESSION_TTL = 300; // 5 min to complete register/login after verify
const MAX_ATTEMPTS = 5;

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export class OTPService {
  private getTwilioClient() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !from) return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilioModule = require('twilio');
      return { client: twilioModule(sid, token), from };
    } catch {
      return null;
    }
  }

  async sendOTP(phone: string): Promise<{ sent: boolean; devCode?: string }> {
    const redis = getRedis();
    const key = `otp:${phone}`;

    const rateLimitKey = `otp_rate:${phone}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) await redis.expire(rateLimitKey, 900);
    if (attempts > MAX_ATTEMPTS) {
      throw Object.assign(new Error('Too many OTP requests. Try again in 15 minutes.'), { statusCode: 429 });
    }

    const code = generateOTP();
    await redis.set(key, code, 'EX', OTP_TTL);

    const twilio = this.getTwilioClient();
    if (twilio) {
      try {
        await twilio.client.messages.create({
          body: `Your Shhh verification code is: ${code}. It expires in 5 minutes.`,
          from: twilio.from,
          to: phone,
        });
        logger.info({ phone: phone.slice(-4) }, 'OTP sent via Twilio');
        return { sent: true };
      } catch (err) {
        logger.error({ err }, 'Failed to send OTP via Twilio');
        throw Object.assign(new Error('Failed to send verification code'), { statusCode: 500 });
      }
    }

    if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
      logger.info({ phone: phone.slice(-4), code }, 'OTP (dev mode - no Twilio)');
      return { sent: true, devCode: code };
    }

    // Bypass when Twilio not configured: set OTP_DEV_BYPASS=true in env (remove once Twilio is configured)
    if (process.env.OTP_DEV_BYPASS === 'true') {
      logger.warn({ phone: phone.slice(-4), code }, 'OTP bypass (no Twilio) — remove OTP_DEV_BYPASS when Twilio is configured');
      return { sent: true, devCode: code };
    }

    throw Object.assign(new Error('SMS service not configured'), { statusCode: 503 });
  }

  async verifyOTP(phone: string, code: string): Promise<boolean> {
    const redis = getRedis();
    const key = `otp:${phone}`;

    const stored = await redis.get(key);
    if (!stored) {
      throw Object.assign(new Error('Code expired or not found. Request a new one.'), { statusCode: 400 });
    }

    if (stored !== code) {
      throw Object.assign(new Error('Invalid verification code'), { statusCode: 400 });
    }

    await redis.del(key);
    return true;
  }

  /** Create OTP session after successful verify. Required for register/login. Consumed on first use. */
  async createOTPSession(phone: string): Promise<string> {
    const redis = getRedis();
    const sessionToken = uuidv4();
    await redis.set(`otp_session:${sessionToken}`, phone, 'EX', OTP_SESSION_TTL);
    return sessionToken;
  }

  /** Validate OTP session without consuming it; returns phone if valid. */
  async validateOTPSession(sessionToken: string): Promise<string> {
    const redis = getRedis();
    const key = `otp_session:${sessionToken}`;
    const phone = await redis.get(key);
    if (!phone) {
      throw Object.assign(new Error('Session expired or invalid. Please verify your phone again.'), { statusCode: 401 });
    }
    return phone;
  }

  /** Consume OTP session (delete from Redis); returns phone if valid. Throws if invalid/expired. */
  async consumeOTPSession(sessionToken: string): Promise<string> {
    const phone = await this.validateOTPSession(sessionToken);
    const redis = getRedis();
    await redis.del(`otp_session:${sessionToken}`);
    return phone;
  }
}
