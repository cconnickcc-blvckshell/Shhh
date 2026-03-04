/**
 * Panic notification service — sends SMS and push to emergency contacts when panic is triggered.
 * Uses Twilio for SMS; Expo push for Shhh users. Graceful degradation when providers not configured.
 */
import { logger } from '../../config/logger';
import { hashPhone } from '../../utils/hash';
import { query } from '../../config/database';
import { PushService } from '../auth/push.service';

const pushService = new PushService();

function getTwilioClient(): { client: { messages: { create: (opts: { body: string; from: string; to: string }) => Promise<unknown> } }; from: string } | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    return { client: twilio(sid, token), from };
  } catch {
    return null;
  }
}

/** Normalize phone for E.164 (Twilio requires +countrycode). */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && phone.startsWith('+1')) return `+1${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.startsWith('+') ? phone : `+${digits}`;
}

/** Find Shhh user ID by phone (hash match). */
async function findUserIdByPhone(phone: string): Promise<string | null> {
  const phoneHash = hashPhone(phone);
  const result = await query(
    `SELECT id FROM users WHERE phone_hash = $1 AND is_active = true AND deleted_at IS NULL`,
    [phoneHash]
  );
  return result.rows[0]?.id ?? null;
}

export interface PanicNotifyResult {
  smsSent: number;
  pushSent: number;
  contactsNotified: number;
  errors: string[];
}

/**
 * Notify emergency contacts when user triggers panic.
 * Sends SMS to each contact with phone; sends push to contacts who are Shhh users.
 */
export async function notifyEmergencyContacts(
  userId: string,
  userName: string,
  contacts: Array<{ id: string; name: string; phone: string | null }>,
  lat?: number,
  lng?: number
): Promise<PanicNotifyResult> {
  const result: PanicNotifyResult = { smsSent: 0, pushSent: 0, contactsNotified: 0, errors: [] };
  const notifiedContactIds = new Set<string>();

  const locationStr = lat != null && lng != null
    ? ` Location: https://www.google.com/maps?q=${lat},${lng}`
    : '';

  const smsBody = `[Shhh Emergency] ${userName} has triggered an emergency alert. Please check on them.${locationStr}`;
  const pushTitle = 'Emergency Alert';
  const pushBody = `${userName} has triggered an emergency alert. Please check on them.`;

  const twilio = getTwilioClient();

  for (const contact of contacts) {
    if (!contact.phone) continue;

    const normalized = normalizePhone(contact.phone);

    // SMS
    if (twilio) {
      try {
        await twilio.client.messages.create({
          body: smsBody,
          from: twilio.from,
          to: normalized,
        });
        result.smsSent++;
        notifiedContactIds.add(contact.id);
        logger.info({ contactId: contact.id, phoneLast4: normalized.slice(-4) }, 'Panic SMS sent');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`SMS to ${contact.name}: ${msg}`);
        logger.error({ err, contactId: contact.id }, 'Panic SMS failed');
      }
    }

    // Push (if contact is Shhh user)
    try {
      const contactUserId = await findUserIdByPhone(contact.phone);
      if (contactUserId) {
        await pushService.sendPush(contactUserId, pushTitle, pushBody, {
          type: 'panic',
          userId,
          lat: lat?.toString() ?? '',
          lng: lng?.toString() ?? '',
        });
        result.pushSent++;
        notifiedContactIds.add(contact.id);
        logger.info({ contactUserId }, 'Panic push sent');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Push to ${contact.name}: ${msg}`);
      logger.error({ err, contactId: contact.id }, 'Panic push failed');
    }
  }

  result.contactsNotified = notifiedContactIds.size;
  return result;
}
