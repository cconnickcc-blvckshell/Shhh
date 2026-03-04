/**
 * Response classification for k6 load tests.
 * Records status codes per endpoint and error class for end-of-run diagnostics.
 */
import { Counter } from 'k6/metrics';

const statusCounter = new Counter('http_status_by_endpoint');
const errorClassCounter = new Counter('error_class_by_endpoint');

const SAMPLE_LOG_MAX = 5;
const SAMPLE_LOG_MAX_CREATE = 10;
const sampleLogCount = {};

/**
 * Classify HTTP status into error class for diagnostics.
 */
export function classifyStatus(status) {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 401 || status === 403) return 'auth_denied';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 400) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status === 203) return 'tier_gate_or_partial';
  if (status >= 500) return 'server_error';
  return 'other';
}

function truncate(str, len) {
  if (!str || typeof str !== 'string') return '';
  str = str.replace(/\s+/g, ' ').trim();
  return str.length <= len ? str : str.substring(0, len) + '...';
}

/**
 * Record a response for status histogram and error classification.
 * From VU 1, logs first 5 failures per endpoint+status (status + body snippet).
 * Call after each HTTP request in scenarios.
 *
 * @param {string} endpoint - Endpoint name (e.g. 'discover', 'create_conversation', 'checkout')
 * @param {object} res - k6 HTTP response { status, body }
 */
export function recordResponse(endpoint, res) {
  const status = res && res.status ? res.status : 0;
  const errClass = classifyStatus(status);

  statusCounter.add(1, { endpoint, status: String(status) });
  if (errClass !== 'ok') {
    errorClassCounter.add(1, { endpoint, error_class: errClass });
    if (__VU === 1) {
      const key = endpoint + ':' + status;
      const n = (sampleLogCount[key] || 0) + 1;
      sampleLogCount[key] = n;
      const maxLog = endpoint === 'create_conversation' ? SAMPLE_LOG_MAX_CREATE : SAMPLE_LOG_MAX;
      if (n <= maxLog) {
        const body = res && res.body ? truncate(res.body, 200) : '';
        console.warn('[FAIL SAMPLE] ' + endpoint + ' status=' + status + ' (' + errClass + ') body=' + body);
      }
    }
  }
}
