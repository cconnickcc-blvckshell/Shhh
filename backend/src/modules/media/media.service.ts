import { query } from '../../config/database';
import { StorageService } from './storage.service';
import { BlurRevealService } from '../users/blur.service';

const storage = new StorageService();
const blurSvc = new BlurRevealService();

export class MediaService {
  async uploadMedia(
    userId: string,
    file: Express.Multer.File,
    category: 'photos' | 'albums' | 'messages',
    options?: { expiresInSeconds?: number; isNsfw?: boolean }
  ) {
    const stored = await storage.storeFile(file, category);
    const expiresAt = options?.expiresInSeconds
      ? new Date(Date.now() + options.expiresInSeconds * 1000)
      : null;

    const result = await query(
      `INSERT INTO media (user_id, filename, original_name, mime_type, size_bytes, storage_path, is_nsfw, moderation_status, expires_at, metadata_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at`,
      [
        userId, stored.filename, file.originalname, stored.mimeType,
        stored.sizeBytes, stored.storagePath, options?.isNsfw || false,
        'auto_approved', expiresAt,
        JSON.stringify({ thumbnailPath: stored.thumbnailPath || null }),
      ]
    );

    return {
      id: result.rows[0].id,
      url: stored.storagePath,
      thumbnailUrl: stored.thumbnailPath || null,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      expiresAt: expiresAt?.toISOString() || null,
    };
  }

  async getMedia(mediaId: string, requesterId: string) {
    const result = await query(
      `SELECT m.*, am.album_id
       FROM media m
       LEFT JOIN album_media am ON m.id = am.media_id
       WHERE m.id = $1 AND m.deleted_at IS NULL
         AND (m.expires_at IS NULL OR m.expires_at > NOW())`,
      [mediaId]
    );

    if (result.rows.length === 0) return null;

    const media = result.rows[0];

    if (media.user_id === requesterId) return media;

    if (media.album_id) {
      const access = await query(
        `SELECT 1 FROM album_shares WHERE album_id = $1 AND shared_with_user_id = $2 AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [media.album_id, requesterId]
      );
      if (access.rows.length > 0) return media;
    }

    const canSee = await blurSvc.canSeeUnblurred(requesterId, media.user_id);
    if (!canSee) return null;
    return media;
  }

  async deleteMedia(mediaId: string, userId: string) {
    const media = await query(
      'SELECT storage_path FROM media WHERE id = $1 AND user_id = $2',
      [mediaId, userId]
    );
    if (media.rows.length === 0) return false;

    await storage.deleteFile(media.rows[0].storage_path);
    await query('UPDATE media SET deleted_at = NOW() WHERE id = $1', [mediaId]);
    return true;
  }

  async getUserMedia(userId: string) {
    const result = await query(
      `SELECT id, filename, mime_type, storage_path, metadata_json, created_at
       FROM media WHERE user_id = $1 AND deleted_at IS NULL AND expires_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async cleanupExpired() {
    const expired = await query(
      `SELECT id, storage_path FROM media WHERE expires_at < NOW() AND deleted_at IS NULL`
    );
    for (const row of expired.rows) {
      await storage.deleteFile(row.storage_path);
    }
    await query(`UPDATE media SET deleted_at = NOW() WHERE expires_at < NOW() AND deleted_at IS NULL`);
    return expired.rows.length;
  }

  async trackView(mediaId: string, viewerId: string, durationMs?: number) {
    await query(
      `INSERT INTO media_view_tracking (media_id, viewer_id, view_duration_ms)
       VALUES ($1, $2, $3)
       ON CONFLICT (media_id, viewer_id) DO UPDATE SET viewed_at = NOW(), view_duration_ms = $3`,
      [mediaId, viewerId, durationMs || null]
    );

    const media = await query('SELECT user_id, expires_at FROM media WHERE id = $1', [mediaId]);
    if (media.rows.length > 0 && media.rows[0].expires_at) {
      const viewCount = await query(
        'SELECT COUNT(*) as cnt FROM media_view_tracking WHERE media_id = $1',
        [mediaId]
      );
      return { viewCount: parseInt(viewCount.rows[0].cnt) };
    }
    return { viewCount: 0 };
  }
}
