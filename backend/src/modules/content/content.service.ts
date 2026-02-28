import { query } from '../../config/database';

export interface ContentSlot {
  key: string;
  title: string | null;
  bodyMd: string | null;
  link: string | null;
  locale: string;
}

export class ContentService {
  async getByKeys(keys: string[], locale: string = 'en'): Promise<ContentSlot[]> {
    if (keys.length === 0) return [];
    const result = await query(
      `SELECT key, title, body_md, link, locale FROM content_slots
       WHERE key = ANY($1) AND (locale = $2 OR locale = 'en') ORDER BY key`,
      [keys, locale]
    );
    const byKey = new Map(result.rows.map((r) => [r.key, r]));
    return keys.filter((k) => byKey.has(k)).map((k) => {
      const r = byKey.get(k)!;
      return { key: r.key, title: r.title, bodyMd: r.body_md, link: r.link, locale: r.locale };
    });
  }

  async getByKey(key: string, locale: string = 'en'): Promise<ContentSlot | null> {
    const rows = await this.getByKeys([key], locale);
    return rows[0] ?? null;
  }
}
