/**
 * Response classification for k6 load tests.
 * Records status codes per endpoint and error class for end-of-run diagnostics.
 */
import { Counter } from 'k6/metrics';

const statusCounter = new Counter('http_status_by_endpoint');
const errorClassCounter = new Counter('error_class_by_endpoint');

const SAMPLE_LOG_MAX_PER_VU = 1;
const SAMPLE_LOG_VUS = 10;
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
 * Central fail-sample: log first N failures per endpoint from VUs 1–10.
 * Call from every scenario that makes HTTP requests.
 *
 * @param {string} endpoint - e.g. 'create_conversation', 'discover'
 * @param {object} res - k6 response { status, body, headers }
 * @param {object} meta - optional { idempotencyKey, requestId }
 */
export function failSample(endpoint, res, meta) {
  const status = res && res.status ? res.status : 0;
  const errClass = classifyStatus(status);
  if (errClass === 'ok') return;

  if (__VU >= 1 && __VU <= SAMPLE_LOG_VUS) {
    const key = endpoint + ':' + status + ':vu' + __VU;
    const n = (sampleLogCount[key] || 0) + 1;
    sampleLogCount[key] = n;
    if (n <= SAMPLE_LOG_MAX_PER_VU) {
      const body = res && res.body ? truncate(res.body, 500) : '';
      const reqId = (res && res.headers && res.headers['X-Request-Id']) || (meta && meta.requestId) || '';
      const idem = (meta && meta.idempotencyKey) || '';
      console.warn('[FAIL SAMPLE] ' + endpoint + ' status=' + status + ' (' + errClass + ') vu=' + __VU + ' idemKey=' + idem + ' x-request-id=' + reqId + ' body=' + body);
    }
  }
}

/**
 * Record a response for status histogram and error classification.
 * Calls failSample for non-2xx. Use recordResponse for all endpoints.
 *
 * @param {string} endpoint - Endpoint name
 * @param {object} res - k6 HTTP response { status, body }
 * @param {object} meta - optional { idempotencyKey } for create calls
 */
export function recordResponse(endpoint, res, meta) {
  const status = res && res.status ? res.status : 0;
  const errClass = classifyStatus(status);

  statusCounter.add(1, { endpoint, status: String(status) });
  if (errClass !== 'ok') {
    errorClassCounter.add(1, { endpoint, error_class: errClass });
    failSample(endpoint, res, meta);
  }
}
