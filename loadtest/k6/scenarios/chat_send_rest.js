/**
 * Chat scenario: list conversations, create if needed, send message via REST.
 */
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';
import { authHeaders } from '../lib/auth.js';
import { getConversations, postMessage } from '../lib/api.js';
import { errorRate, chatSendDuration } from '../lib/metrics.js';
import { recordResponse } from '../lib/classifier.js';

export function chatSendRest(token, targetUserId) {
  const listRes = getConversations(token);
  recordResponse('conversations', listRes);
  if (!check(listRes, { 'conversations 200': (r) => r.status === 200 })) {
    errorRate.add(1);
    return;
  }

  let conversationId = null;
  try {
    const convos = listRes.json('data') || listRes.json() || [];
    const arr = Array.isArray(convos) ? convos : (convos.conversations || []);
    const existing = arr.find((c) => (c.participantIds && c.participantIds.includes(targetUserId)) || c.otherUserId === targetUserId);
    if (existing) conversationId = existing.id || existing.conversationId;
  } catch (_) {}

  if (!conversationId && targetUserId) {
    const createRes = http.post(
      `${BASE_URL}/v1/conversations`,
      JSON.stringify({ participantIds: [targetUserId] }),
      { headers: authHeaders(token), tags: { name: 'create_conversation' } }
    );
    recordResponse('create_conversation', createRes);
    if (check(createRes, { 'create 201': (r) => r.status === 201 })) {
      conversationId = createRes.json('data.id') || createRes.json('data.conversationId');
    }
  }

  if (!conversationId) {
    errorRate.add(0);
    return;
  }

  const msgRes = postMessage(token, conversationId, `Load test msg ${Date.now()}`);
  recordResponse('post_message', msgRes);
  const ok = check(msgRes, { 'message 201': (r) => r.status === 201 });
  errorRate.add(!ok);
  chatSendDuration.add(msgRes.timings.duration);
}
