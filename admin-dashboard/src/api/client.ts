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
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const adminApi = {
  sendCode: (phone: string) => api<{ data: { sent: boolean; devCode?: string } }>('/v1/auth/phone/send-code', { method: 'POST', body: JSON.stringify({ phone }) }),
  verify: (phone: string, code: string) => api<{ data: { verified: boolean; sessionToken?: string } }>('/v1/auth/phone/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  login: (phone: string, sessionToken?: string) => api<{ data: { accessToken: string; userId: string } }>('/v1/auth/login', { method: 'POST', body: JSON.stringify({ phone, ...(sessionToken && { sessionToken }) }) }),
  getHealth: () => api<{ status: string; version: string; modules: string[] }>('/health'),

  // Dashboard
  getOverview: () => api<{ data: any }>('/v1/admin/overview'),
  getStats: () => api<{ data: any }>('/v1/admin/stats'),

  // Users
  listUsers: (page = 1, filter?: string) => api<{ data: any }>(`/v1/admin/users/list?page=${page}${filter ? `&filter=${filter}` : ''}`),
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
  getQueue: (type?: string) => api<{ data: any[] }>(`/v1/admin/moderation${type ? `?type=${type}` : ''}`),

  // Safety
  getSafetyAlerts: () => api<{ data: any }>('/v1/admin/safety/alerts'),

  // Audit
  getAuditLogs: (limit = 100) => api<{ data: any[] }>(`/v1/admin/audit-logs?limit=${limit}`),

  // Settings
  getAdSettings: () => api<{ data: any[] }>('/v1/admin/settings/ads'),
  updateAdSetting: (id: string, value: any) => api(`/v1/admin/settings/ads/${id}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};
