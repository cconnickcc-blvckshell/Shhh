import crypto from 'crypto';

const PEPPER = process.env.PHONE_HASH_PEPPER || 'shhh-dev-pepper-change-in-production';

export function hashPhone(phone: string): string {
  return crypto.createHmac('sha256', PEPPER).update(phone).digest('hex');
}

export function hashEmail(email: string): string {
  return crypto.createHmac('sha256', PEPPER).update(email.toLowerCase()).digest('hex');
}

export function hashGeneric(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
