const API_BASE = 'http://localhost:3000';

let authToken = '';

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('admin_token', token);
}

export function getToken(): string {
  if (!authToken) {
    authToken = localStorage.getItem('admin_token') || '';
  }
  return authToken;
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
  login: (phone: string) => api<{ data: { accessToken: string; userId: string } }>('/v1/auth/login', { method: 'POST', body: JSON.stringify({ phone }) }),
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
