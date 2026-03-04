/**
 * Traffic mix: baseline user behavior distribution.
 * Override via env LOAD_MIX_* (e.g. LOAD_MIX_DISCOVERY=50).
 */
export const BASELINE_MIX = {
  discovery: 0.40,
  presence: 0.20,
  chat: 0.15,
  events: 0.10,
  ads: 0.05,
  safety: 0.05,
  compliance: 0.03,
  subscription: 0.02,
};

export function getMix() {
  const mix = Object.assign({}, BASELINE_MIX);
  const discovery = __ENV.LOAD_MIX_DISCOVERY;
  if (discovery) mix.discovery = parseFloat(discovery) / 100;
  const presence = __ENV.LOAD_MIX_PRESENCE;
  if (presence) mix.presence = parseFloat(presence) / 100;
  const chat = __ENV.LOAD_MIX_CHAT;
  if (chat) mix.chat = parseFloat(chat) / 100;
  const events = __ENV.LOAD_MIX_EVENTS;
  if (events) mix.events = parseFloat(events) / 100;
  const ads = __ENV.LOAD_MIX_ADS;
  if (ads) mix.ads = parseFloat(ads) / 100;
  const safety = __ENV.LOAD_MIX_SAFETY;
  if (safety) mix.safety = parseFloat(safety) / 100;
  const compliance = __ENV.LOAD_MIX_COMPLIANCE;
  if (compliance) mix.compliance = parseFloat(compliance) / 100;
  const subscription = __ENV.LOAD_MIX_SUBSCRIPTION;
  if (subscription) mix.subscription = parseFloat(subscription) / 100;
  return mix;
}

function weightedChoice(mix) {
  const r = Math.random();
  let acc = 0;
  for (const [k, v] of Object.entries(mix)) {
    acc += v;
    if (r < acc) return k;
  }
  return 'discovery';
}

export function selectScenario(mix) {
  return weightedChoice(mix);
}
