import { query } from '../../config/database';

export interface UserPreferences {
  showAsRole: string | null;
  showAsRelationship: string | null;
  age: number | null;
  seekingGenders: string[] | null;
  seekingRoles: string[] | null;
  seekingRelationships: string[] | null;
  seekingExperience: string[] | null;
  seekingAgeMin: number | null;
  seekingAgeMax: number | null;
  seekingVerifiedOnly: boolean;
}

export class PreferencesService {
  async getPreferences(userId: string): Promise<UserPreferences> {
    const result = await query(
      `SELECT show_as_role, show_as_relationship, age,
              seeking_genders, seeking_roles, seeking_relationships,
              seeking_experience, seeking_age_min, seeking_age_max,
              seeking_verified_only
       FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        showAsRole: null, showAsRelationship: null, age: null,
        seekingGenders: null, seekingRoles: null, seekingRelationships: null,
        seekingExperience: null, seekingAgeMin: null, seekingAgeMax: null,
        seekingVerifiedOnly: false,
      };
    }

    const r = result.rows[0];
    return {
      showAsRole: r.show_as_role,
      showAsRelationship: r.show_as_relationship,
      age: r.age,
      seekingGenders: r.seeking_genders,
      seekingRoles: r.seeking_roles,
      seekingRelationships: r.seeking_relationships,
      seekingExperience: r.seeking_experience,
      seekingAgeMin: r.seeking_age_min,
      seekingAgeMax: r.seeking_age_max,
      seekingVerifiedOnly: r.seeking_verified_only || false,
    };
  }

  async updatePreferences(userId: string, prefs: Partial<UserPreferences>) {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      showAsRole: 'show_as_role',
      showAsRelationship: 'show_as_relationship',
      age: 'age',
      seekingGenders: 'seeking_genders',
      seekingRoles: 'seeking_roles',
      seekingRelationships: 'seeking_relationships',
      seekingExperience: 'seeking_experience',
      seekingAgeMin: 'seeking_age_min',
      seekingAgeMax: 'seeking_age_max',
      seekingVerifiedOnly: 'seeking_verified_only',
    };

    for (const [key, col] of Object.entries(map)) {
      if (prefs[key as keyof UserPreferences] !== undefined) {
        const val = prefs[key as keyof UserPreferences];
        if (Array.isArray(val)) {
          updates.push(`${col} = $${idx}::text[]`);
        } else {
          updates.push(`${col} = $${idx}`);
        }
        values.push(val);
        idx++;
      }
    }

    if (updates.length === 0) return this.getPreferences(userId);

    values.push(userId);
    await query(
      `UPDATE user_profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
      values
    );

    return this.getPreferences(userId);
  }
}
