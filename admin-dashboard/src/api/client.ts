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
  getStats: () => api<{ data: { moderation: Record<string, number>; users: Record<string, number>; reports: Record<string, number> } }>('/v1/admin/stats'),
  getQueue: (type?: string) => api<{ data: unknown[]; count: number }>(`/v1/admin/moderation${type ? `?type=${type}` : ''}`),
  getReports: (status = 'pending') => api<{ data: unknown[]; count: number }>(`/v1/admin/reports?status=${status}`),
  resolveReport: (id: string, status: string) => api(`/v1/admin/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status }) }),
  getUserDetail: (id: string) => api<{ data: unknown }>(`/v1/admin/users/${id}`),
  banUser: (id: string, reason: string) => api(`/v1/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getAuditLogs: (limit = 50) => api<{ data: unknown[] }>(`/v1/admin/audit-logs?limit=${limit}`),
  getHealth: () => api<{ status: string; version: string; modules: string[] }>('/health'),
};
