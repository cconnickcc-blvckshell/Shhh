/**
 * Ads scenario: fetch ad for discover feed.
 */
import { getAdsFeed } from '../lib/api.js';
import { check } from 'k6';
import { errorRate } from '../lib/metrics.js';
import { recordResponse } from '../lib/classifier.js';

export function adsFeed(token) {
  const res = getAdsFeed(token);
  recordResponse('ads_feed', res);
  const ok = check(res, { 'ads 200': (r) => r.status === 200 });
  errorRate.add(!ok);
}
