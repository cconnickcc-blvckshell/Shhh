/**
 * API helpers for k6 scenarios.
 */
import http from 'k6/http';
import { BASE_URL } from './config.js';
import { authHeaders } from './auth.js';

const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;

export function getDiscover(token, lat = DEFAULT_LAT, lng = DEFAULT_LNG, radius = 50) {
  return http.get(
    `${BASE_URL}/v1/discover?lat=${lat}&lng=${lng}&radius=${radius}`,
    { headers: authHeaders(token), tags: { name: 'discover' } }
  );
}

export function postLocation(token, lat, lng) {
  return http.post(
    `${BASE_URL}/v1/discover/location`,
    JSON.stringify({ lat, lng }),
    { headers: authHeaders(token), tags: { name: 'location' } }
  );
}

export function getPresence(token) {
  return http.get(`${BASE_URL}/v1/presence`, {
    headers: authHeaders(token),
    tags: { name: 'presence_get' },
  });
}

export function postPresenceState(token, state = 'browsing') {
  return http.post(
    `${BASE_URL}/v1/presence/state`,
    JSON.stringify({ state }),
    { headers: authHeaders(token), tags: { name: 'presence_post' } }
  );
}

export function getConversations(token) {
  return http.get(`${BASE_URL}/v1/conversations`, {
    headers: authHeaders(token),
    tags: { name: 'conversations' },
  });
}

export function postMessage(token, conversationId, content) {
  return http.post(
    `${BASE_URL}/v1/conversations/${conversationId}/messages`,
    JSON.stringify({ content }),
    { headers: authHeaders(token), tags: { name: 'chat_send' } }
  );
}

export function getEventsNearby(token, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  return http.get(
    `${BASE_URL}/v1/events/nearby?lat=${lat}&lng=${lng}`,
    { headers: authHeaders(token), tags: { name: 'events_nearby' } }
  );
}

export function getVenue(token, venueId) {
  return http.get(`${BASE_URL}/v1/venues/${venueId}`, {
    headers: authHeaders(token),
    tags: { name: 'venue_detail' },
  });
}

export function postScreenshot(token) {
  return http.post(
    `${BASE_URL}/v1/safety/screenshot`,
    JSON.stringify({}),
    { headers: authHeaders(token), tags: { name: 'screenshot' } }
  );
}

export function postDataExport(token) {
  return http.post(
    `${BASE_URL}/v1/compliance/data-export`,
    JSON.stringify({}),
    { headers: authHeaders(token), tags: { name: 'compliance_export' } }
  );
}

export function postCheckoutSession(token, tier = 'discreet') {
  return http.post(
    `${BASE_URL}/v1/billing/checkout`,
    JSON.stringify({ tier }),
    { headers: authHeaders(token), tags: { name: 'checkout_stub' } }
  );
}

export function getAdsFeed(token, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  return http.get(
    `${BASE_URL}/v1/ads/feed?lat=${lat}&lng=${lng}`,
    { headers: authHeaders(token), tags: { name: 'ads_feed' } }
  );
}

export function getHealth() {
  return http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });
}
