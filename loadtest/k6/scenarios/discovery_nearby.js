/**
 * Discovery scenario: update location + GET discover.
 */
import { getDiscover, postLocation } from '../lib/api.js';
import { errorRate, discoverDuration } from '../lib/metrics.js';
import { check } from 'k6';

const CENTER_LAT = 40.7128;
const CENTER_LNG = -74.006;

export function discoveryNearby(token) {
  const lat = CENTER_LAT + (Math.random() - 0.5) * 0.05;
  const lng = CENTER_LNG + (Math.random() - 0.5) * 0.05;

  postLocation(token, lat, lng);

  const res = getDiscover(token, lat, lng, 50);
  const ok = check(res, { 'discover 200': (r) => r.status === 200 });
  errorRate.add(!ok);
  discoverDuration.add(res.timings.duration);
  return ok;
}
