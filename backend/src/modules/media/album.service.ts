import { query } from '../../config/database';

export class AlbumService {
  async createAlbum(ownerId: string, name: string, description?: string, isPrivate: boolean = true) {
    const result = await query(
      `INSERT INTO albums (owner_id, name, description, is_private)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ownerId, name, description || null, isPrivate]
    );
    return result.rows[0];
  }

  async getMyAlbums(userId: string) {
    const result = await query(
      `SELECT a.*, COUNT(am.media_id) as media_count
       FROM albums a
       LEFT JOIN album_media am ON a.id = am.album_id
       WHERE a.owner_id = $1
       GROUP BY a.id
       ORDER BY a.updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getAlbum(albumId: string, requesterId: string) {
    const album = await query('SELECT * FROM albums WHERE id = $1', [albumId]);
    if (album.rows.length === 0) return null;

    const a = album.rows[0];

    if (a.owner_id === requesterId) {
      const media = await this.getAlbumMedia(albumId);
      const shares = await this.getAlbumShares(albumId);
      return { ...a, media, shares };
    }

    if (a.is_private) {
      const access = await query(
        `SELECT 1 FROM album_shares WHERE album_id = $1 AND shared_with_user_id = $2 AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [albumId, requesterId]
      );
      if (access.rows.length === 0) return null;
    }

    const media = await this.getAlbumMedia(albumId);
    return { ...a, media };
  }

  async getSharedWithMe(userId: string) {
    const result = await query(
      `SELECT a.*, s.granted_at, s.can_download, s.expires_at as share_expires_at,
              p.display_name as owner_name, COUNT(am.media_id) as media_count
       FROM album_shares s
       JOIN albums a ON s.album_id = a.id
       JOIN user_profiles p ON a.owner_id = p.user_id
       LEFT JOIN album_media am ON a.id = am.album_id
       WHERE s.shared_with_user_id = $1 AND s.revoked_at IS NULL
         AND (s.expires_at IS NULL OR s.expires_at > NOW())
       GROUP BY a.id, s.granted_at, s.can_download, s.expires_at, p.display_name
       ORDER BY s.granted_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async addMediaToAlbum(albumId: string, mediaId: string, ownerId: string) {
    const album = await query('SELECT 1 FROM albums WHERE id = $1 AND owner_id = $2', [albumId, ownerId]);
    if (album.rows.length === 0) {
      throw Object.assign(new Error('Album not found or unauthorized'), { statusCode: 403 });
    }

    const media = await query('SELECT 1 FROM media WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [mediaId, ownerId]);
    if (media.rows.length === 0) {
      throw Object.assign(new Error('Media not found'), { statusCode: 404 });
    }

    const maxSort = await query('SELECT MAX(sort_order) as max_sort FROM album_media WHERE album_id = $1', [albumId]);
    const nextSort = (maxSort.rows[0].max_sort || 0) + 1;

    await query(
      `INSERT INTO album_media (album_id, media_id, sort_order)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [albumId, mediaId, nextSort]
    );

    await query('UPDATE albums SET updated_at = NOW() WHERE id = $1', [albumId]);
  }

  async removeMediaFromAlbum(albumId: string, mediaId: string, ownerId: string) {
    const album = await query('SELECT 1 FROM albums WHERE id = $1 AND owner_id = $2', [albumId, ownerId]);
    if (album.rows.length === 0) {
      throw Object.assign(new Error('Album not found or unauthorized'), { statusCode: 403 });
    }
    await query('DELETE FROM album_media WHERE album_id = $1 AND media_id = $2', [albumId, mediaId]);
  }

  async shareAlbum(albumId: string, ownerId: string, targetUserId: string, options?: { canDownload?: boolean; expiresInHours?: number }) {
    const album = await query('SELECT 1 FROM albums WHERE id = $1 AND owner_id = $2', [albumId, ownerId]);
    if (album.rows.length === 0) {
      throw Object.assign(new Error('Album not found or unauthorized'), { statusCode: 403 });
    }

    if (ownerId === targetUserId) {
      throw Object.assign(new Error('Cannot share with yourself'), { statusCode: 400 });
    }

    const expiresAt = options?.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 3600 * 1000)
      : null;

    await query(
      `INSERT INTO album_shares (album_id, shared_with_user_id, granted_by, can_download, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (album_id, shared_with_user_id) DO UPDATE SET
         revoked_at = NULL, can_download = $4, expires_at = $5, granted_at = NOW()`,
      [albumId, targetUserId, ownerId, options?.canDownload || false, expiresAt]
    );

    return { albumId, sharedWith: targetUserId, expiresAt: expiresAt?.toISOString() || null };
  }

  async revokeAlbumShare(albumId: string, ownerId: string, targetUserId: string) {
    const album = await query('SELECT 1 FROM albums WHERE id = $1 AND owner_id = $2', [albumId, ownerId]);
    if (album.rows.length === 0) {
      throw Object.assign(new Error('Album not found or unauthorized'), { statusCode: 403 });
    }

    await query(
      `UPDATE album_shares SET revoked_at = NOW() WHERE album_id = $1 AND shared_with_user_id = $2`,
      [albumId, targetUserId]
    );
  }

  async deleteAlbum(albumId: string, ownerId: string) {
    await query('DELETE FROM albums WHERE id = $1 AND owner_id = $2', [albumId, ownerId]);
  }

  private async getAlbumMedia(albumId: string) {
    const result = await query(
      `SELECT m.id, m.storage_path, m.mime_type, m.metadata_json, am.sort_order
       FROM album_media am
       JOIN media m ON am.media_id = m.id
       WHERE am.album_id = $1 AND m.deleted_at IS NULL
       ORDER BY am.sort_order ASC`,
      [albumId]
    );
    return result.rows;
  }

  private async getAlbumShares(albumId: string) {
    const result = await query(
      `SELECT s.shared_with_user_id, p.display_name, s.can_download, s.expires_at, s.granted_at
       FROM album_shares s
       JOIN user_profiles p ON s.shared_with_user_id = p.user_id
       WHERE s.album_id = $1 AND s.revoked_at IS NULL`,
      [albumId]
    );
    return result.rows;
  }
}
