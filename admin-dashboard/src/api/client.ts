const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

let authToken = '';

const TOKEN_KEY = 'admin_token';

function getStorage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  authToken = token;
  getStorage()?.setItem(TOKEN_KEY, token);
}

export function getToken(): string {
  if (!authToken) {
    authToken = getStorage()?.getItem(TOKEN_KEY) || '';
  }
  return authToken;
}

export function clearToken() {
  authToken = '';
  getStorage()?.removeItem(TOKEN_KEY);
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const msg = err?.error?.message || err?.message || res.statusText || 'Request failed';
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const adminApi = {
  sendCode: (phone: string) => api<{ data: { sent: boolean; devCode?: string } }>('/v1/auth/phone/send-code', { method: 'POST', body: JSON.stringify({ phone }) }),
  verify: (phone: string, code: string) => api<{ data: { verified: boolean; sessionToken?: string } }>('/v1/auth/phone/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  login: (phone: string, sessionToken?: string) => api<{ data: { accessToken: string; userId: string } }>('/v1/auth/login', { method: 'POST', body: JSON.stringify({ phone, ...(sessionToken && { sessionToken }) }) }),
  /** Email/password login. User must have admin or moderator role for dashboard access. */
  loginEmail: (email: string, password: string) => api<{ data: { accessToken: string; userId: string } }>('/v1/auth/email/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  /** Dev bypass: one-click login when OTP_DEV_BYPASS=true on backend. No phone/OTP required. */
  bypassLogin: () => api<{ data: { accessToken: string; userId: string } }>('/v1/auth/admin-bypass', { method: 'POST', body: JSON.stringify({}) }),
  adminLogout: () => api('/v1/auth/admin-logout', { method: 'POST', body: JSON.stringify({}) }),
  getHealth: () => api<{ status: string; version: string; modules: string[] }>('/health'),

  // Dashboard
  getOverview: () => api<{ data: any }>('/v1/admin/overview'),
  getStats: () => api<{ data: any }>('/v1/admin/stats'),

  // Users
  listUsers: (page = 1, filter?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filter) params.set('filter', filter);
    return api<{ data: any }>(`/v1/admin/users/list?${params.toString()}`);
  },
  searchUsers: (q: string, page = 1) => api<{ data: any }>(`/v1/admin/users/search?q=${encodeURIComponent(q)}&page=${page}`),
  getUserDetail: (id: string) => api<{ data: any }>(`/v1/admin/users/${id}`),
  setUserRole: (id: string, role: string) => api(`/v1/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
  toggleUserActive: (id: string, active: boolean) => api(`/v1/admin/users/${id}/toggle-active`, { method: 'POST', body: JSON.stringify({ active }) }),
  setUserTier: (id: string, tier: number) => api(`/v1/admin/users/${id}/set-tier`, { method: 'POST', body: JSON.stringify({ tier }) }),
  banUser: (id: string, reason: string) => api(`/v1/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Revenue
  getRevenue: () => api<{ data: any }>('/v1/admin/revenue'),
  getRevenueHistory: (days = 30) => api<{ data: any }>(`/v1/admin/revenue/history?days=${days}`),

  // Venues
  listVenues: () => api<{ data: any[] }>('/v1/admin/venues/list'),

  // Ads
  listAds: () => api<{ data: any[] }>('/v1/admin/ads/list'),
  toggleAd: (id: string, active: boolean) => api(`/v1/admin/ads/${id}/toggle`, { method: 'POST', body: JSON.stringify({ active }) }),

  // Events
  listEvents: () => api<{ data: any[] }>('/v1/admin/events/list'),

  // Reports & Moderation
  getReports: (status = 'pending') => api<{ data: any[]; count: number }>(`/v1/admin/reports?status=${status}`),
  resolveReport: (id: string, status: string, notes?: string) => api(`/v1/admin/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  getQueue: (type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    const q = params.toString();
    return api<{ data: any[] }>(`/v1/admin/moderation${q ? `?${q}` : ''}`);
  },
  getResolvedModeration: () => api<{ data: any[] }>('/v1/admin/moderation/resolved'),
  resolveModeration: (id: string, status: 'approved' | 'rejected') => api(`/v1/admin/moderation/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status }) }),

  // Safety
  getSafetyAlerts: () => api<{ data: any }>('/v1/admin/safety/alerts'),

  // Map / Geo
  getPresenceGeo: () => api<{ data: Array<{ userId: string; lat: number; lng: number; lastSeen: string; presenceState?: string }> }>('/v1/admin/presence/geo'),
  getStatsCities: () => api<{ data: Array<{ lat: number; lng: number; activeCount: number; newThisWeek: number }> }>('/v1/admin/stats/cities'),
  getTrustScoreDistribution: () => api<{ data: { bucket_0_20: number; bucket_21_40: number; bucket_41_60: number; bucket_61_80: number; bucket_81_100: number; no_score: number } }>('/v1/admin/stats/trust-scores'),
  getConversionFunnel: () => api<{ data: { signups: number; verified: number; hasLiked: number; hasMessaged: number; hasWhispered: number; hasRsvpd: number } }>('/v1/admin/analytics/funnel'),
  getActivityFeed: (limit = 30) => api<{ data: Array<{ id: string; userId: string; action: string; displayName: string; createdAt: string; metadata: Record<string, unknown> }> }>(`/v1/admin/activity-feed?limit=${limit}`),

  // Audit
  getAuditLogs: (limit = 100) => api<{ data: any[] }>(`/v1/admin/audit-logs?limit=${limit}`),

  // Settings
  getAdSettings: () => api<{ data: any[] }>('/v1/admin/settings/ads'),
  updateAdSetting: (id: string, value: any) => api(`/v1/admin/settings/ads/${id}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};
