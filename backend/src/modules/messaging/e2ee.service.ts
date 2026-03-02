import { query } from '../../config/database';
import { logger } from '../../config/logger';

export class E2EEService {
  async registerPublicKey(userId: string, publicKey: string) {
    const fingerprint = publicKey.slice(0, 16) + '...' + publicKey.slice(-8);

    await query(
      `INSERT INTO user_keys (user_id, public_key, key_fingerprint)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         public_key = $2, key_fingerprint = $3, rotated_at = NOW()`,
      [userId, publicKey, fingerprint]
    );

    logger.info({ userId, fingerprint }, 'Public key registered');
    return { fingerprint };
  }

  async getPublicKey(userId: string) {
    const result = await query(
      `SELECT public_key, key_fingerprint, algorithm, created_at, rotated_at
       FROM user_keys WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async uploadPrekeys(userId: string, prekeys: string[]) {
    for (const pk of prekeys) {
      await query(
        `INSERT INTO prekey_bundles (user_id, prekey_public) VALUES ($1, $2)`,
        [userId, pk]
      );
    }
    return { uploaded: prekeys.length };
  }

  async claimPrekey(userId: string) {
    const result = await query(
      `UPDATE prekey_bundles SET is_used = true
       WHERE id = (
         SELECT id FROM prekey_bundles WHERE user_id = $1 AND is_used = false
         ORDER BY created_at ASC LIMIT 1
       ) RETURNING prekey_public`,
      [userId]
    );
    return result.rows[0]?.prekey_public || null;
  }

  async storeConversationKey(conversationId: string, userId: string, encryptedKey: string, version: number = 1) {
    await query(
      `INSERT INTO conversation_keys (conversation_id, user_id, encrypted_key, key_version)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (conversation_id, user_id) DO UPDATE SET
         encrypted_key = $3, key_version = $4`,
      [conversationId, userId, encryptedKey, version]
    );
  }

  async getConversationKey(conversationId: string, userId: string) {
    const result = await query(
      `SELECT encrypted_key, key_version FROM conversation_keys
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    return result.rows[0] || null;
  }

  async getKeyBundle(userId: string) {
    const [identity, prekey] = await Promise.all([
      this.getPublicKey(userId),
      this.claimPrekey(userId),
    ]);

    if (!identity) return null;

    return {
      identityKey: identity.public_key,
      prekey,
      fingerprint: identity.key_fingerprint,
    };
  }
}
