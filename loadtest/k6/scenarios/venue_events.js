/**
 * Venue/Events scenario: list nearby events, optionally get venue detail.
 */
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';
import { authHeaders } from '../lib/auth.js';
import { getEventsNearby } from '../lib/api.js';
import { errorRate } from '../lib/metrics.js';

export function venueEvents(token) {
  const res = getEventsNearby(token);
  const ok = check(res, { 'events 200': (r) => r.status === 200 });
  errorRate.add(!ok);

  if (ok) {
    try {
      const events = res.json('data') || res.json() || [];
      const arr = Array.isArray(events) ? events : (events.events || []);
      const first = arr[0];
      if (first && first.venueId) {
        http.get(`${BASE_URL}/v1/venues/${first.venueId}`, {
          headers: authHeaders(token),
          tags: { name: 'venue_detail' },
        });
      }
    } catch (_) {}
  }
}
