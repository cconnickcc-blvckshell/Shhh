# Shhh — Feature Flags & Kill Switches

> **Purpose:** Document configurable toggles that control behavior at runtime.  
> **Audience:** DevOps, product, support.

---

## 1. Ads Global Kill Switch

| Location | Type | Purpose |
|----------|------|---------|
| `ad_controls` table, `id='global'` | DB | When `value.enabled` is `false`, no ads are served to any user. |

### Schema

```sql
-- ad_controls (id, value JSONB, updated_at)
-- value: { "enabled": true, "density_multiplier": 1.0 }
```

### Toggle

```sql
-- Disable all ads
UPDATE ad_controls SET value = jsonb_set(value, '{enabled}', 'false') WHERE id = 'global';

-- Re-enable
UPDATE ad_controls SET value = jsonb_set(value, '{enabled}', 'true') WHERE id = 'global';
```

### Code

`backend/src/modules/ads/ad.service.ts`:

```typescript
const globalControl = await query(`SELECT value FROM ad_controls WHERE id = 'global'`);
if (!globalControl.rows[0]?.value?.enabled) return null;
```

---

## 2. Ad Cadence (Per-Surface)

| Location | Type | Purpose |
|----------|------|---------|
| `ad_cadence_rules` table | DB | Per-surface enable/disable and max per 24h. |

### Schema

```sql
-- ad_cadence_rules (surface, max_per_24h, min_gap_minutes, skip_first_open, skip_during_intents, is_enabled)
-- Surfaces: discover_feed, chat_list, post_event, venue_page
```

### Disable a surface

```sql
UPDATE ad_cadence_rules SET is_enabled = false WHERE surface = 'chat_list';
```

---

## 3. Other Toggles

| Feature | Location | Notes |
|---------|----------|-------|
| Premium (no ads) | `subscriptions` table | User with active non-free tier gets no ads. |
| Discovery cap | `config.geo.discoveryCapFree`, `discoveryCapPremium` | Env vars; no runtime toggle. |
| Auth rate limit | `rateLimiter.ts` | 5/15m prod, 50 dev; env-driven. |

---

## 4. Future Considerations

- No feature-flag service (LaunchDarkly, etc.) integrated.
- No per-user or per-cohort flags.
- Kill switches are DB-only; no circuit breaker in code if DB fails.
