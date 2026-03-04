/**
 * WebSocket scenario: connect with auth. Measures connection time.
 * Full Socket.IO message delivery would require a custom client.
 */
import { connectSocketIO } from '../lib/ws.js';
import { wsConnectDuration, wsDeliveryRate } from '../lib/metrics.js';

export function chatWsConnect(token) {
  const { ok, duration } = connectSocketIO(token);
  wsConnectDuration.add(duration);
  wsDeliveryRate.add(ok ? 1 : 0);
}
