/**
 * k6 load test configuration.
 * Tier A (CI): 100 VUs. Tier B (nightly): 1000–5000. Tier C (AWS): 10000–100000.
 */
export const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
export const WS_URL = __ENV.WS_URL || (BASE_URL.replace(/^http/, 'ws'));
export const TIER = __ENV.LOAD_TIER || 'smoke';
export const SEED_FILE = __ENV.SEED_FILE || '';

export const TIER_CONFIG = {
  smoke: { vus: 100, duration: '2m', rampUp: '30s' },
  baseline: { vus: 1000, duration: '10m', rampUp: '2m' },
  stress: { vus: 5000, duration: '15m', rampUp: '3m' },
  stress_10k: { vus: 10000, duration: '30m', rampUp: '5m' },
  extreme: { vus: 100000, duration: '60m', rampUp: '10m' },
  soak: { vus: 500, duration: '4h', rampUp: '5m' },
};

export function getTierOptions() {
  const c = TIER_CONFIG[TIER] || TIER_CONFIG.smoke;
  return {
    vus: c.vus,
    duration: c.duration,
    rampUp: c.rampUp,
  };
}
