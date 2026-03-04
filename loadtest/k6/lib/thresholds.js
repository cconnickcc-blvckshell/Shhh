/**
 * Per-tier SLO thresholds. Pipeline fails when any threshold is breached.
 */
import { TIER } from './config.js';

const BASE = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  errors: ['rate<0.01'],
};

const SMOKE = Object.assign({}, BASE, {
  http_req_duration: ['p(95)<500', 'p(99)<750'],
  'http_req_duration{name:discover}': ['p(95)<500'],
  'http_req_duration{name:chat_send}': ['p(95)<500'],
});

const BASELINE = Object.assign({}, BASE, {
  http_req_duration: ['p(95)<750', 'p(99)<1500'],
  'http_req_duration{name:discover}': ['p(95)<750'],
  'http_req_duration{name:chat_send}': ['p(95)<750'],
});

const STRESS = {
  http_req_failed: ['rate<0.02'],
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  errors: ['rate<0.02'],
};

const SOAK = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<750'],
  errors: ['rate<0.01'],
};

export function getThresholds() {
  switch (TIER) {
    case 'smoke': return SMOKE;
    case 'baseline': return BASELINE;
    case 'stress':
    case 'stress_10k': return STRESS;
    case 'soak': return SOAK;
    default: return SMOKE;
  }
}
