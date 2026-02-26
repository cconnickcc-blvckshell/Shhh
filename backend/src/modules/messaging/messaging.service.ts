import { query } from '../../config/database';
import { Message } from './message.model';
import { v4 as uuidv4 } from 'uuid';

export class MessagingService {
  async createConversation(participantIds: string[], type: 'direct' | 'group' | 'event' = 'direct') {
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
    const result = await query(
      `SELECT c.id, c.type, c.last_message_at, cp.unread_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL
       ORDER BY c.last_message_at DESC NULLS LAST
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    contentType: string = 'text',
    ttlSeconds?: number
  ) {
    const participant = await query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, senderId]
    );

    if (participant.rows.length === 0) {
      throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
    }

    const message = new Message({
      conversationId,
      senderId,
      content,
      contentType,
      expiresAt: ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : undefined,
    });

    await message.save();

    await query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversationId]
    );

    await query(
      `UPDATE conversation_participants SET unread_count = unread_count + 1
       WHERE conversation_id = $1 AND user_id != $2`,
      [conversationId, senderId]
    );

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
}
