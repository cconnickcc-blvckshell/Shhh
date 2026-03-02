import { Message } from './message.model';
import { query } from '../../config/database';

export class EphemeralService {
  async sendDisappearingMessage(
    conversationId: string, senderId: string, content: string,
    ttlSeconds: number, contentType: string = 'text'
  ) {
    const participant = await query(
      `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
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
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });
    await message.save();

    await query('UPDATE conversations SET last_message_at = NOW() WHERE id = $1', [conversationId]);

    return message;
  }

  async sendViewOnceMessage(conversationId: string, senderId: string, content: string, contentType: string = 'image') {
    const participant = await query(
      `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
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
      isEncrypted: true,
      expiresAt: new Date(Date.now() + 86400 * 1000),
    });
    await message.save();

    return message;
  }

  async markAsViewed(messageId: string, userId: string) {
    const msg = await Message.findById(messageId);
    if (!msg) throw Object.assign(new Error('Message not found'), { statusCode: 404 });

    const alreadyRead = msg.readBy?.some(r => r.userId === userId);
    if (alreadyRead) {
      throw Object.assign(new Error('Already viewed'), { statusCode: 409 });
    }

    msg.readBy = msg.readBy || [];
    msg.readBy.push({ userId, readAt: new Date() });

    const participants = await query(
      'SELECT COUNT(*) as cnt FROM conversation_participants WHERE conversation_id = $1 AND left_at IS NULL',
      [msg.conversationId]
    );
    const participantCount = parseInt(participants.rows[0].cnt);

    if (msg.readBy.length >= participantCount - 1) {
      msg.expiresAt = new Date(Date.now() + 5000);
    }

    await msg.save();
    return { viewedBy: msg.readBy.length, autoDeleteIn: msg.expiresAt };
  }
}
