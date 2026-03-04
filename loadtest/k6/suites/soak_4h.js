/**
 * Soak test: 4h sustained load. Detects memory leaks, slow degradation.
 */
import { sleep } from 'k6';
import { loadSeeds } from '../lib/seeds.js';
import { getMix, selectScenario } from '../lib/mix.js';
import { getThresholds } from '../lib/thresholds.js';
import { discoveryNearby } from '../scenarios/discovery_nearby.js';
import { chatSendRest } from '../scenarios/chat_send_rest.js';
import { venueEvents } from '../scenarios/venue_events.js';
import { adsFeed } from '../scenarios/ads_feed.js';
import { safetyScreenshot } from '../scenarios/safety_panic_stub.js';
import { complianceExport } from '../scenarios/compliance_delete_export.js';
import { subscriptionCheckoutStub } from '../scenarios/subscription_checkout_stub.js';
import { postPresenceState } from '../lib/api.js';

export const options = {
  scenarios: {
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 500 },
        { duration: '4h', target: 500 },
        { duration: '5m', target: 0 },
      ],
      gracefulRampDown: '60s',
      exec: 'runMix',
    },
  },
  thresholds: getThresholds(),
  teardownTimeout: '120s',
};

export function setup() {
  const users = loadSeeds(600, 40.7128, -74.006);
  if (!users || users.length === 0) {
    throw new Error('Seed failed: no users.');
  }
  return { users };
}

export function runMix(data) {
  const users = data.users;
  const u = users[__VU % users.length];
  const token = u && u.accessToken;
  if (!token) {
    sleep(1);
    return;
  }

  const mix = getMix();
  const scenario = selectScenario(mix);

  switch (scenario) {
    case 'discovery':
      discoveryNearby(token);
      break;
    case 'presence':
      postPresenceState(token, ['browsing', 'open_to_chat', 'nearby'][Math.floor(Math.random() * 3)]);
      break;
    case 'chat':
      const t = users[(__VU + 1) % users.length];
      const targetUserId = t && t.userId;
      chatSendRest(token, targetUserId);
      break;
    case 'events':
      venueEvents(token);
      break;
    case 'ads':
      adsFeed(token);
      break;
    case 'safety':
      safetyScreenshot(token);
      break;
    case 'compliance':
      complianceExport(token);
      break;
    case 'subscription':
      subscriptionCheckoutStub(token);
      break;
    default:
      discoveryNearby(token);
  }
  sleep(1 + Math.random() * 2);
}
