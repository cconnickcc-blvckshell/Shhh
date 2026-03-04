/**
 * Subscription checkout stub: creates session (stubbed in test).
 */
import { postCheckoutSession } from '../lib/api.js';
import { check } from 'k6';
import { errorRate } from '../lib/metrics.js';

export function subscriptionCheckoutStub(token) {
  const res = postCheckoutSession(token, 'discreet');
  const ok = check(res, { 'checkout 200/201': (r) => r.status === 200 || r.status === 201 });
  errorRate.add(!ok);
}
