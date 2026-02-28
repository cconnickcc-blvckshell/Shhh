import { Platform } from 'react-native';

const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://10.0.2.2:3000';

let authToken = '';

export type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setOnUnauthorized(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

export function setAuthToken(token: string) {
  authToken = token;
  try { if (typeof window !== 'undefined') window.localStorage?.setItem('shhh_token', token); } catch {}
}

export function getAuthToken(): string {
  if (!authToken) {
    try { authToken = (typeof window !== 'undefined' ? window.localStorage?.getItem('shhh_token') : null) || ''; } catch {}
  }
  return authToken;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const authApi = {
  register: (phone: string, displayName: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/register', {
      method: 'POST', body: JSON.stringify({ phone, displayName }),
    }),
  login: (phone: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/login', {
      method: 'POST', body: JSON.stringify({ phone }),
    }),
  refresh: (refreshToken: string) =>
    api<{ data: { accessToken: string; refreshToken: string } }>('/v1/auth/refresh', {
      method: 'POST', body: JSON.stringify({ refreshToken }),
    }),
  logout: () => api('/v1/auth/logout', { method: 'DELETE' }),
};

export const usersApi = {
  getMe: () => api<{ data: any }>('/v1/users/me'),
  updateMe: (data: any) => api<{ data: any }>('/v1/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  like: (id: string) => api<{ data: { matched: boolean } }>(`/v1/users/${id}/like`, { method: 'POST' }),
  pass: (id: string) => api(`/v1/users/${id}/pass`, { method: 'POST' }),
  block: (id: string) => api(`/v1/users/${id}/block`, { method: 'POST' }),
  report: (id: string, reason: string) => api(`/v1/users/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

export const discoverApi = {
  nearby: (lat: number, lng: number, radius?: number, primaryIntent?: string) => {
    let url = `/v1/discover?lat=${lat}&lng=${lng}`;
    if (radius != null) url += `&radius=${radius}`;
    if (primaryIntent) url += `&primaryIntent=${encodeURIComponent(primaryIntent)}`;
    return api<{ data: any[]; count: number }>(url);
  },
  updateLocation: (lat: number, lng: number, isPrecise?: boolean) =>
    api('/v1/discover/location', { method: 'POST', body: JSON.stringify({ lat, lng, isPrecise }) }),
};

export const messagingApi = {
  getConversations: () => api<{ data: any[] }>('/v1/conversations'),
  createConversation: (participantIds: string[]) =>
    api<{ data: { id: string } }>('/v1/conversations', { method: 'POST', body: JSON.stringify({ participantIds }) }),
  getMessages: (convId: string) => api<{ data: any[] }>(`/v1/conversations/${convId}/messages`),
  sendMessage: (convId: string, content: string, contentType?: string, ttlSeconds?: number) =>
    api<{ data: any }>(`/v1/conversations/${convId}/messages`, {
      method: 'POST', body: JSON.stringify({ content, contentType, ttlSeconds }),
    }),
};

export const eventsApi = {
  nearby: (lat: number, lng: number) =>
    api<{ data: any[] }>(`/v1/events/nearby?lat=${lat}&lng=${lng}`),
  create: (data: any) => api<{ data: any }>('/v1/events', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => api<{ data: any }>(`/v1/events/${id}`),
  rsvp: (id: string, status: string) =>
    api<{ data: any }>(`/v1/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
};

export const safetyApi = {
  getContacts: () => api<{ data: any[] }>('/v1/safety/contacts'),
  addContact: (name: string, phone: string, relationship?: string) =>
    api('/v1/safety/contacts', { method: 'POST', body: JSON.stringify({ name, phone, relationship }) }),
  removeContact: (id: string) =>
    api(`/v1/safety/contacts/${id}`, { method: 'DELETE' }),
  checkIn: (type: string, lat?: number, lng?: number) =>
    api('/v1/safety/checkin', { method: 'POST', body: JSON.stringify({ type, lat, lng }) }),
  panic: (lat?: number, lng?: number) =>
    api('/v1/safety/panic', { method: 'POST', body: JSON.stringify({ lat, lng }) }),
};

export const complianceApi = {
  dataExport: () => api<{ data: { message?: string; exportId?: string } }>('/v1/compliance/data-export', { method: 'POST' }),
  requestDeletion: () => api<{ data: { message?: string } }>('/v1/compliance/account-deletion', { method: 'DELETE' }),
};

export const albumsApi = {
  getMyAlbums: () => api<{ data: any[] }>('/v1/media/albums/my'),
  getShared: () => api<{ data: any[] }>('/v1/media/albums/shared'),
  getAlbum: (id: string) => api<{ data: any }>(`/v1/media/albums/${id}`),
  create: (name: string, description?: string, isPrivate?: boolean) =>
    api<{ data: any }>('/v1/media/albums', { method: 'POST', body: JSON.stringify({ name, description, isPrivate }) }),
  share: (albumId: string, userId: string, expiresInHours?: number) =>
    api(`/v1/media/albums/${albumId}/share`, { method: 'POST', body: JSON.stringify({ userId, expiresInHours }) }),
  revokeShare: (albumId: string, userId: string) =>
    api(`/v1/media/albums/${albumId}/share/${userId}`, { method: 'DELETE' }),
};
