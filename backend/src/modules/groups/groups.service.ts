import { query } from '../../config/database';

export class GroupsService {
  async create(userId: string, data: { name: string; description?: string; visibility?: 'public' | 'invite_only' | 'hidden' }) {
    const result = await query(
      `INSERT INTO groups (name, description, visibility, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.description || null, data.visibility || 'public', userId]
    );
    const group = result.rows[0];
    await query(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [group.id, userId]);
    return group;
  }

  async list(options?: { userId?: string }) {
    const where = options?.userId
      ? `WHERE g.visibility = 'public' OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $1)`
      : `WHERE g.visibility = 'public'`;
    const params = options?.userId ? [options.userId] : [];
    const result = await query(
      `SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS member_count
       FROM groups g ${where}
       ORDER BY g.created_at DESC`,
      params
    );
    return result.rows;
  }

  async getOne(groupId: string, userId?: string) {
    const result = await query(
      `SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS member_count,
              EXISTS (SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = $2) AS is_member
       FROM groups g WHERE g.id = $1`,
      [groupId, userId || null]
    );
    const row = result.rows[0];
    if (!row) return null;
    if (row.visibility === 'hidden' && (!userId || !row.is_member)) return null;
    if (row.visibility === 'invite_only' && (!userId || !row.is_member)) return null;
    return row;
  }

  async join(groupId: string, userId: string) {
    const group = await this.getOne(groupId, userId);
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    if (group.visibility === 'invite_only') throw Object.assign(new Error('Group is invite-only'), { statusCode: 403 });
    await query(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [groupId, userId]);
    return this.getOne(groupId, userId);
  }

  async leave(groupId: string, userId: string) {
    const group = await this.getOne(groupId, userId);
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    await query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [groupId, userId]);
    return { left: true };
  }

  /** Privacy-safe: count + optional persona tiles (no user ids). */
  async getMembers(groupId: string, userId: string) {
    const group = await this.getOne(groupId, userId);
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    const result = await query(
      `SELECT COUNT(*)::int AS total,
              (SELECT json_agg(json_build_object('personaType', p.type, 'personaDisplayName', p.display_name))
               FROM group_members gm
               LEFT JOIN personas p ON p.user_id = gm.user_id AND p.is_active = true
               WHERE gm.group_id = $1) AS members_preview
       FROM group_members WHERE group_id = $1`,
      [groupId]
    );
    const row = result.rows[0];
    return { total: row?.total || 0, membersPreview: row?.members_preview || [] };
  }

  /** Events linked to this group (upcoming). */
  async getEvents(groupId: string, userId: string) {
    const group = await this.getOne(groupId, userId);
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    const result = await query(
      `SELECT e.id, e.title, e.starts_at, e.ends_at, e.type, e.vibe_tag, v.name AS venue_name,
              (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going')::int AS attendee_count
       FROM group_events ge
       JOIN events e ON e.id = ge.event_id
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE ge.group_id = $1 AND e.status IN ('upcoming', 'active') AND e.starts_at > NOW()
       ORDER BY e.starts_at ASC`,
      [groupId]
    );
    return result.rows;
  }

  /** Link an event to a group (creator or group creator). */
  async linkEvent(groupId: string, eventId: string, userId: string) {
    const group = await this.getOne(groupId, userId);
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    const isCreator = group.created_by === userId;
    const eventHost = await query(`SELECT host_user_id FROM events WHERE id = $1`, [eventId]);
    if (eventHost.rows.length === 0) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    if (!isCreator && eventHost.rows[0].host_user_id !== userId)
      throw Object.assign(new Error('Only group creator or event host can link'), { statusCode: 403 });
    await query(`INSERT INTO group_events (group_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [groupId, eventId]);
    return { linked: true };
  }

  async getMyGroupIds(userId: string): Promise<string[]> {
    const result = await query(`SELECT group_id FROM group_members WHERE user_id = $1`, [userId]);
    return result.rows.map((r: { group_id: string }) => r.group_id);
  }
}
