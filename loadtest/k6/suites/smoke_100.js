/**
 * Tier A: PR gate. 100 VUs, 2–5 min. Catches regressions.
 */
import { sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { loadSeeds } from '../lib/seeds.js';
import { getMix, selectScenario } from '../lib/mix.js';
import { getThresholds } from '../lib/thresholds.js';
import { discoveryNearby } from '../scenarios/discovery_nearby.js';
import { chatSendRest } from '../scenarios/chat_send_rest.js';
import { chatWsConnect } from '../scenarios/chat_ws_send.js';
import { venueEvents } from '../scenarios/venue_events.js';
import { adsFeed } from '../scenarios/ads_feed.js';
import { safetyScreenshot } from '../scenarios/safety_panic_stub.js';
import { complianceExport } from '../scenarios/compliance_delete_export.js';
import { subscriptionCheckoutStub } from '../scenarios/subscription_checkout_stub.js';
import { postPresenceState } from '../lib/api.js';
import { recordResponse } from '../lib/classifier.js';

export const options = {
  scenarios: {
    smoke: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'runMix',
    },
  },
  thresholds: getThresholds(),
  teardownTimeout: '30s',
};

export function setup() {
  const users = loadSeeds(150, 40.7128, -74.006);
  if (!users || users.length === 0) {
    throw new Error('Seed failed: no users. Ensure TEST_MODE=true and backend /v1/test/seed is available.');
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
    case 'presence': {
      const presRes = postPresenceState(token, ['browsing', 'open_to_chat', 'nearby'][Math.floor(Math.random() * 3)]);
      recordResponse('presence', presRes);
      break;
    }
    case 'chat':
      if (__ITER % 3 === 0) {
        chatWsConnect(token);
      } else {
        const t = users[(__VU + 1) % users.length];
        const targetUserId = t && t.userId;
        chatSendRest(token, targetUserId);
      }
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
  sleep(0.5 + Math.random());
}

/**
 * Extract tagged metric counts. k6 stores tagged submetrics as separate entries:
 * "http_status_by_endpoint{endpoint=discover,status=200}". Parent metric has values.count/rate.
 */
function extractTaggedCounts(metrics, metricPrefix) {
  const byKey = {};
  if (!metrics) return byKey;
  for (const [fullKey, metric] of Object.entries(metrics)) {
    if (fullKey.indexOf(metricPrefix) !== 0 || fullKey.indexOf('{') === -1) continue;
    const tagPart = fullKey.slice(fullKey.indexOf('{'));
    const vals = metric && metric.values ? metric.values : null;
    let count = 0;
    if (vals && typeof vals.count === 'number') count = vals.count;
    else if (typeof vals === 'number') count = vals;
    else if (vals && typeof vals === 'object' && !Array.isArray(vals)) count = vals.count || vals.rate || 0;
    if (count <= 0) continue;
    const epMatch = tagPart.match(/endpoint[=:]([^,}]+)/);
    const statusMatch = tagPart.match(/status[=:]([^,}]+)/);
    const classMatch = tagPart.match(/error_class[=:]([^,}]+)/);
    const ep = epMatch ? epMatch[1] : 'unknown';
    const tag2 = statusMatch ? statusMatch[1] : (classMatch ? classMatch[1] : '?');
    const k = ep + '|' + tag2;
    byKey[k] = (byKey[k] || 0) + count;
  }
  return byKey;
}

/**
 * Print status histograms per endpoint and error class summary.
 */
export function handleSummary(data) {
  const lines = [];
  lines.push('');
  lines.push('=== STATUS HISTOGRAMS BY ENDPOINT ===');

  const metrics = data.metrics || {};
  const statusCounts = extractTaggedCounts(metrics, 'http_status_by_endpoint');

  if (Object.keys(statusCounts).length > 0) {
    const byEndpoint = {};
    for (const [k, count] of Object.entries(statusCounts)) {
      const [ep, status] = k.split('|');
      if (!byEndpoint[ep]) byEndpoint[ep] = {};
      byEndpoint[ep][status] = (byEndpoint[ep][status] || 0) + count;
    }
    for (const [ep, statuses] of Object.entries(byEndpoint)) {
      const sorted = Object.entries(statuses).sort(function (a, b) { return b[1] - a[1]; });
      const parts = sorted.map(function (s) { return s[0] + ':' + s[1]; });
      lines.push('  ' + ep + ': ' + parts.join(', '));
    }
  } else {
    const sampleKeys = Object.keys(metrics || {}).filter(function (k) { return k.indexOf('http_status') !== -1; }).slice(0, 5);
    lines.push('  (no tagged submetrics; sample keys: ' + (sampleKeys.length ? sampleKeys.join(', ') : 'none') + ')');
  }

  lines.push('');
  lines.push('=== ERROR CLASS BY ENDPOINT (non-2xx) ===');

  const errorCounts = extractTaggedCounts(metrics, 'error_class_by_endpoint');

  if (Object.keys(errorCounts).length > 0) {
    const byEndpoint = {};
    for (const [k, count] of Object.entries(errorCounts)) {
      const [ep, errClass] = k.split('|');
      if (!byEndpoint[ep]) byEndpoint[ep] = {};
      byEndpoint[ep][errClass] = (byEndpoint[ep][errClass] || 0) + count;
    }
    for (const [ep, classes] of Object.entries(byEndpoint)) {
      const sorted = Object.entries(classes).sort(function (a, b) { return b[1] - a[1]; });
      const parts = sorted.map(function (c) { return c[0] + ':' + c[1]; });
      lines.push('  ' + ep + ': ' + parts.join(', '));
    }
  } else {
    lines.push('  (no error class data)');
  }

  lines.push('');
  lines.push('=== PER-ENDPOINT SUMMARY (pass rate, top status codes) ===');

  if (Object.keys(statusCounts).length > 0) {
    const byEndpoint = {};
    for (const [k, count] of Object.entries(statusCounts)) {
      const [ep, status] = k.split('|');
      if (!byEndpoint[ep]) byEndpoint[ep] = {};
      byEndpoint[ep][status] = (byEndpoint[ep][status] || 0) + count;
    }
    const hints = { 401: 'auth missing', 403: 'auth denied/tier', 404: 'not found', 409: 'conflict', 422: 'validation', 429: 'rate limit', 500: 'server error' };
    for (const [ep, statuses] of Object.entries(byEndpoint)) {
      const total = Object.values(statuses).reduce(function (a, b) { return a + b; }, 0);
      const success = Object.entries(statuses).filter(function (s) { const c = parseInt(s[0], 10); return c >= 200 && c < 300; }).reduce(function (a, s) { return a + s[1]; }, 0);
      const pct = total > 0 ? (100 * success / total).toFixed(1) : '0';
      const top3 = Object.entries(statuses).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3);
      const topStr = top3.map(function (s) { const h = hints[s[0]] ? ' (' + hints[s[0]] + ')' : ''; return s[0] + ':' + s[1] + h; }).join(', ');
      const flag = parseFloat(pct) < 80 ? ' <<<' : '';
      lines.push('  ' + ep + ': ' + success + '/' + total + ' (' + pct + '% pass) | top: ' + topStr + flag);
    }
  }

  lines.push('');
  lines.push('=== FAILURE PATTERN (endpoints by fail rate, likely cause) ===');

  if (Object.keys(statusCounts).length > 0) {
    const byEndpoint = {};
    for (const [k, count] of Object.entries(statusCounts)) {
      const [ep, status] = k.split('|');
      if (!byEndpoint[ep]) byEndpoint[ep] = { total: 0, success: 0, topStatus: {} };
      byEndpoint[ep].total += count;
      if (parseInt(status, 10) >= 200 && parseInt(status, 10) < 300) byEndpoint[ep].success += count;
      byEndpoint[ep].topStatus[status] = (byEndpoint[ep].topStatus[status] || 0) + count;
    }
    const sorted = Object.entries(byEndpoint)
      .map(function (e) { return { ep: e[0], failRate: 1 - e[1].success / Math.max(1, e[1].total), total: e[1].total, top: e[1].topStatus }; })
      .filter(function (x) { return x.failRate > 0; })
      .sort(function (a, b) { return b.failRate - a.failRate; });
    for (let i = 0; i < sorted.length; i++) {
      const x = sorted[i];
      const topCode = Object.entries(x.top).sort(function (a, b) { return b[1] - a[1]; })[0];
      const code = topCode ? topCode[0] : '?';
      let cause = 'unknown';
      if (code === '401' || code === '403') cause = 'auth/tier gate';
      else if (code === '429') cause = 'rate limit';
      else if (code === '422' || code === '400') cause = 'validation/schema';
      else if (code === '409') cause = 'conflict/duplicate';
      else if (code === '500') cause = 'server error';
      lines.push('  ' + (i + 1) + '. ' + x.ep + ': ' + (100 * x.failRate).toFixed(0) + '% fail (n=' + x.total + '), top ' + code + ' -> ' + cause);
    }
    if (sorted.length === 0) lines.push('  (all endpoints passing)');
  }

  lines.push('');

  const summary = textSummary(data, { indent: ' ', enableColors: true });
  return {
    stdout: summary + lines.join('\n'),
    'loadtest/reports/smoke-summary.txt': lines.join('\n'),
  };
}
