/**
 * WebSocket helpers for k6.
 * Note: Socket.IO uses a custom protocol; k6's native ws supports raw WebSocket.
 * We use the Socket.IO transport URL for connection tests. Full message delivery
 * testing may require a custom Socket.IO client or separate tooling.
 */
import ws from 'k6/ws';
import { WS_URL } from './config.js';

/**
 * Connect to Socket.IO WebSocket transport. Measures connection establishment.
 * Socket.IO handshake: /socket.io/?EIO=4&transport=websocket
 */
export function connectSocketIO(token) {
  const base = WS_URL.replace(/\/$/, '').replace(/^ws/, 'ws');
  const url = `${base}/socket.io/?EIO=4&transport=websocket`;
  const start = Date.now();
  let ok = false;
  ws.connect(url, {
    headers: { Authorization: `Bearer ${token}` },
  }, (socket) => {
    ok = socket != null;
    if (socket) {
      socket.setTimeout(() => socket.close(), 2000);
    }
  });
  return { ok, duration: Date.now() - start };
}
