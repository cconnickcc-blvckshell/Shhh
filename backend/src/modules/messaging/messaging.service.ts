import { query } from '../../config/database';
import { getRedis } from '../../config/redis';
import { Message } from './message.model';
import { v4 as uuidv4 } from 'uuid';
import { emitNewMessage, emitToUser } from '../../websocket';
import { InitiationCapService } from './initiation-cap.service';
import { InitiationCapReachedError } from '../../utils/errors';

const IDEMPOTENCY_TTL = 300; // 5 min
const initiationCapService = new InitiationCapService();

export class MessagingService {
  async createConversation(
    participantIds: string[],
    type: 'direct' | 'group' | 'event' = 'direct',
    filterContext?: Record<string, unknown>
  ) {
    if (type === 'direct' && participantIds.length === 2) {
      const existing = await query(
        `SELECT c.id FROM conversations c
         JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
         JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = $2
         WHERE c.type = 'direct'`,
        [participantIds[0], participantIds[1]]
      );
      if (existing.rows.length > 0) {
        return { id: existing.rows[0].id, existing: true };
      }
    }

    // Initiation cap: only for NEW conversations; replies exempt
    const result = await initiationCapService.checkAndIncrement(participantIds[0], filterContext);
    if (!result.allowed) {
      throw new InitiationCapReachedError(
        result.cap,
        result.used,
        result.tierOptions
      );
    }

    const convId = uuidv4();
    await query(
      `INSERT INTO conversations (id, type) VALUES ($1, $2)`,
      [convId, type]
    );

    for (const userId of participantIds) {
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2)`,
        [convId, userId]
      );
    }

    return { id: convId, existing: false };
  }

  async getConversations(userId: string) {
    const hasConsentCols = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'consent_granted_by'`
    );
    const consentCols = hasConsentCols.rows.length > 0
      ? ', c.requires_mutual_consent, c.consent_granted_by'
      : ', NULL AS requires_mutual_consent, NULL AS consent_granted_by';
    const result = await query(
      `SELECT c.id, c.type, c.last_message_at, cp.unread_count,
        (SELECT array_agg(cp2.user_id) FROM conversation_participants cp2
         WHERE cp2.conversation_id = c.id AND cp2.user_id != $1 AND cp2.left_at IS NULL) AS other_user_ids
        ${consentCols}
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL
       ORDER BY c.last_message_at DESC NULLS LAST
       LIMIT 50`,
      [userId]
    );

    const convIds = result.rows.map((r: { id: string }) => r.id);
    const otherUserIds = new Set<string>();
    for (const row of result.rows) {
      const ids = row.other_user_ids as string[] | null;
      if (ids) for (const id of ids) otherUserIds.add(id);
    }

    let displayNames: Record<string, string> = {};
    if (otherUserIds.size > 0) {
      const namesResult = await query(
        `SELECT user_id, display_name FROM user_profiles WHERE user_id = ANY($1)`,
        [Array.from(otherUserIds)]
      );
      for (const r of namesResult.rows) {
        displayNames[r.user_id] = r.display_name || 'Unknown';
      }
    }

    let lastMessages: Record<string, { content: string; contentType: string }> = {};
    if (convIds.length > 0) {
      const agg = await Message.aggregate([
        { $match: { conversationId: { $in: convIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$conversationId', content: { $first: '$content' }, contentType: { $first: { $ifNull: ['$contentType', 'text'] } } } },
      ]).exec();
      for (const m of agg) {
        lastMessages[m._id] = { content: m.content || '', contentType: m.contentType || 'text' };
      }
    }

    return result.rows.map((row: Record<string, unknown>) => {
      const otherIds = (row.other_user_ids as string[] | null) || [];
      const participantNames = otherIds.map((id: string) => displayNames[id] || 'Unknown').filter(Boolean);
      const lastMsg = lastMessages[row.id as string];
      const lastSnippet = lastMsg
        ? (lastMsg.contentType === 'image' ? '📷 Photo' : lastMsg.content.substring(0, 60) + (lastMsg.content.length > 60 ? '…' : ''))
        : null;

      const out: Record<string, unknown> = {
        id: row.id,
        type: row.type,
        lastMessageAt: row.last_message_at,
        unreadCount: row.unread_count,
        participantNames: participantNames.length > 0 ? participantNames : ['Chat'],
        lastMessageSnippet: lastSnippet,
      };
      if (row.consent_granted_by != null) {
        const granted = (row.consent_granted_by as string[]) || [];
        out.consentState = {
          requiresMutualConsent: row.requires_mutual_consent ?? true,
          grantedByMe: granted.includes(userId),
          grantedCount: granted.length,
        };
      }
      return out;
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    contentType: string = 'text',
    ttlSeconds?: number,
    clientMessageId?: string
  ) {
    if (clientMessageId) {
      const redis = getRedis();
      const key = `msg_idem:${conversationId}:${senderId}:${clientMessageId}`;
      const existing = await redis.get(key);
      if (existing) {
        const msg = await Message.findById(existing).lean();
        if (msg) return msg;
      }
    }

    const participant = await query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, senderId]
    );

    if (participant.rows.length === 0) {
      throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
    }

    const conv = await query(
      `SELECT is_archived, default_message_ttl_seconds FROM conversations WHERE id = $1`,
      [conversationId]
    );
    if (conv.rows[0]?.is_archived) {
      throw Object.assign(new Error('Conversation is archived; no new messages'), { statusCode: 403 });
    }

    const effectiveTtl = ttlSeconds ?? conv.rows[0]?.default_message_ttl_seconds ?? undefined;

    const message = new Message({
      conversationId,
      senderId,
      content,
      contentType,
      expiresAt: effectiveTtl ? new Date(Date.now() + effectiveTtl * 1000) : undefined,
    });

    await message.save();

    if (clientMessageId) {
      const redis = getRedis();
      const key = `msg_idem:${conversationId}:${senderId}:${clientMessageId}`;
      await redis.set(key, message._id.toString(), 'EX', IDEMPOTENCY_TTL);
    }

    await query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversationId]
    );

    await query(
      `UPDATE conversation_participants SET unread_count = unread_count + 1
       WHERE conversation_id = $1 AND user_id != $2`,
      [conversationId, senderId]
    );

    emitNewMessage(conversationId, {
      id: message._id,
      conversationId,
      senderId,
      content,
      contentType,
      createdAt: message.createdAt,
      expiresAt: message.expiresAt || null,
    });

    const participants = await query(
      `SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2 AND left_at IS NULL`,
      [conversationId, senderId]
    );
    for (const p of participants.rows) {
      emitToUser(p.user_id, 'notification', {
        type: 'new_message',
        conversationId,
        senderId,
        preview: content.substring(0, 50),
      });
    }

    return message;
  }

  async getMessages(conversationId: string, userId: string, before?: string, limit: number = 50) {
    const participant = await query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participant.rows.length === 0) {
      throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
    }

    const filter: Record<string, unknown> = { conversationId };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    await query(
      `UPDATE conversation_participants SET unread_count = 0
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    return messages;
  }

  async setRetention(
    conversationId: string,
    userId: string,
    mode: 'ephemeral' | 'timed_archive' | 'persistent',
    options?: { archiveAt?: Date; defaultMessageTtlSeconds?: number }
  ) {
    const participant = await query(
      `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );
    if (participant.rows.length === 0) {
      throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
    }

    const archiveAt = options?.archiveAt ?? null;
    const defaultTtl = options?.defaultMessageTtlSeconds ?? null;

    await query(
      `UPDATE conversations SET retention_mode = $1, archive_at = $2, default_message_ttl_seconds = $3
       WHERE id = $4`,
      [mode, archiveAt, defaultTtl, conversationId]
    );
    return { retention_mode: mode, archive_at: archiveAt?.toISOString() ?? null, default_message_ttl_seconds: defaultTtl };
  }

  async processArchiveConversations(): Promise<number> {
    const result = await query(
      `UPDATE conversations SET is_archived = true
       WHERE archive_at IS NOT NULL AND archive_at <= NOW() AND (is_archived = false OR is_archived IS NULL)
       RETURNING id`
    );
    return result.rowCount ?? 0;
  }
}
