/**
 * Maps API error messages to user-friendly copy.
 * Human tone: "We couldn't send that" not "Error: invalid request".
 * Backend returns { error: { message: string } }; we parse message for known patterns.
 * @see docs/E2E_CAPABILITY_AUDIT_REPORT.md §4.2, IMPROVEMENTS_LEDGER C.13
 */

const PATTERNS: Array<{ pattern: RegExp | string; message: string }> = [
  { pattern: /rate limit|too many requests/i, message: 'Too many attempts. Please wait a few minutes and try again.' },
  { pattern: /verification tier|tier \d+ required/i, message: 'Verification required. Complete your profile verification to continue.' },
  { pattern: /feature.*premium|subscription required/i, message: 'This feature requires a premium subscription.' },
  { pattern: /invalid.*otp|otp.*invalid|wrong.*code/i, message: 'Invalid verification code. Please try again.' },
  { pattern: /session.*token|sessionToken|otp.*verify/i, message: 'Please verify your phone number first, then try again.' },
  { pattern: /venue access|owner or staff/i, message: 'You don\'t have permission to manage this venue.' },
  { pattern: /authentication required|invalid.*token|expired/i, message: 'Your session expired. Please sign in again.' },
  { pattern: /network|fetch|failed to fetch|connection refused|econnrefused|econnreset/i, message: 'Connection error. Check your internet and try again.' },
  { pattern: /blocked|block/i, message: 'This action isn\'t available.' },
  { pattern: /forbidden|403/i, message: 'You don\'t have permission to do that.' },
  { pattern: /unauthorized|401/i, message: 'Please sign in again.' },
  { pattern: /timeout|timed out/i, message: 'Request timed out. Tap to try again.' },
  { pattern: /invalid request|bad request|400/i, message: 'Something went wrong. Please try again.' },
  { pattern: /whisper.*expired|expired.*whisper/i, message: 'This whisper has expired.' },
  { pattern: /profile.*not found|user.*not found/i, message: 'This profile is no longer available.' },
  { pattern: /conversation.*not found|not found.*conversation/i, message: 'This conversation is no longer available.' },
  { pattern: /event.*not found|not found.*event|cancelled/i, message: 'This event is no longer available.' },
  { pattern: /not found|404/i, message: 'This item is no longer available.' },
  { pattern: /server error|500|internal/i, message: 'We\'re having a moment. Please try again in a bit.' },
];

export function mapApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Something went wrong');
  if (!raw || raw === 'Something went wrong') return 'Something went wrong. Please try again.';

  const lower = raw.toLowerCase();
  for (const { pattern, message } of PATTERNS) {
    if (typeof pattern === 'string' && lower.includes(pattern.toLowerCase())) return message;
    if (pattern instanceof RegExp && pattern.test(raw)) return message;
  }

  return raw;
}
