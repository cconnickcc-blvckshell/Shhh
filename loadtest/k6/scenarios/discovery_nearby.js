/**
 * Discovery scenario: update location + GET discover.
 */
import { getDiscover, postLocation } from '../lib/api.js';
import { errorRate, discoverDuration } from '../lib/metrics.js';
import { recordResponse } from '../lib/classifier.js';
import { check } from 'k6';

const CENTER_LAT = 40.7128;
const CENTER_LNG = -74.006;

export function discoveryNearby(token) {
  const lat = CENTER_LAT + (Math.random() - 0.5) * 0.05;
  const lng = CENTER_LNG + (Math.random() - 0.5) * 0.05;

  const locRes = postLocation(token, lat, lng);
  recordResponse('location', locRes);

  const res = getDiscover(token, lat, lng, 50);
  recordResponse('discover', res);
  const ok = check(res, { 'discover 200/203/204': (r) => r.status === 200 || r.status === 203 || r.status === 204 });
  errorRate.add(!ok);
  discoverDuration.add(res.timings.duration);
  return ok;
}
