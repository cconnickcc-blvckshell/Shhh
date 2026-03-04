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

  async shareAlbum(
    albumId: string,
    ownerId: string,
    target: { type: 'user'; userId: string } | { type: 'persona'; personaId: string } | { type: 'couple'; coupleId: string },
    options?: { canDownload?: boolean; expiresInHours?: number; watermarkMode?: 'off' | 'subtle' | 'invisible'; notifyOnView?: boolean }
  ) {
    const album = await query('SELECT 1 FROM albums WHERE id = $1 AND owner_id = $2', [albumId, ownerId]);
    if (album.rows.length === 0) {
      throw Object.assign(new Error('Album not found or unauthorized'), { statusCode: 403 });
    }

    const expiresAt = options?.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 3600 * 1000)
      : null;
    const canDownload = options?.canDownload ?? false;
    const watermarkMode = options?.watermarkMode ?? 'off';
    const notifyOnView = options?.notifyOnView ?? false;

    const userIds: string[] = [];
    let shareTargetType = 'user';
    let shareTargetId: string | null = null;

    if (target.type === 'user') {
      if (ownerId === target.userId) {
        throw Object.assign(new Error('Cannot share with yourself'), { statusCode: 400 });
      }
      userIds.push(target.userId);
    } else if (target.type === 'persona') {
      const p = await query('SELECT user_id FROM personas WHERE id = $1', [target.personaId]);
      if (p.rows.length === 0) throw Object.assign(new Error('Persona not found'), { statusCode: 404 });
      const uid = p.rows[0].user_id;
      if (ownerId === uid) throw Object.assign(new Error('Cannot share with yourself'), { statusCode: 400 });
      userIds.push(uid);
      shareTargetType = 'persona';
      shareTargetId = target.personaId;
    } else {
      const c = await query('SELECT partner_1_id, partner_2_id FROM couples WHERE id = $1', [target.coupleId]);
      if (c.rows.length === 0) throw Object.assign(new Error('Couple not found'), { statusCode: 404 });
      const { partner_1_id, partner_2_id } = c.rows[0];
      if (partner_1_id && partner_1_id !== ownerId) userIds.push(partner_1_id);
      if (partner_2_id && partner_2_id !== ownerId) userIds.push(partner_2_id);
      shareTargetType = 'couple';
      shareTargetId = target.coupleId;
    }

    const targetType = shareTargetType || 'user';
    for (const uid of userIds) {
      const targetId = shareTargetId || uid;
      await query(
        `INSERT INTO album_shares (album_id, shared_with_user_id, granted_by, can_download, expires_at, share_target_type, share_target_id, watermark_mode, notify_on_view)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (album_id, share_target_type, share_target_id) DO UPDATE SET
           revoked_at = NULL, can_download = $4, expires_at = $5, granted_at = NOW(),
           watermark_mode = $8, notify_on_view = $9`,
        [albumId, uid, ownerId, canDownload, expiresAt, targetType, targetId, watermarkMode, notifyOnView]
      );
    }

    return {
      albumId,
      sharedWith: userIds.length === 1 ? userIds[0] : userIds,
      shareTargetType,
      expiresAt: expiresAt?.toISOString() ?? null,
    };
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
