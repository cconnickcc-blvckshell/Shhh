/**
 * Safety scenario: screenshot event (light). Panic is stubbed in test.
 */
import { postScreenshot } from '../lib/api.js';
import { check } from 'k6';
import { errorRate } from '../lib/metrics.js';

export function safetyScreenshot(token) {
  const res = postScreenshot(token);
  const ok = check(res, { 'screenshot 200/201/204': (r) => r.status >= 200 && r.status < 300 });
  errorRate.add(!ok);
}
