import { Platform } from 'react-native';

const envApiUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
const API_BASE = envApiUrl
  ? (process.env.EXPO_PUBLIC_API_URL as string).replace(/\/$/, '')
  : Platform.OS === 'web'
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
  /** Check if current user can see target user's unblurred photos. Single source for blur decision. */
  canSeeUnblurred: (targetUserId: string) =>
    api<{ data: { unblurred: boolean } }>(`/v1/photos/check/${targetUserId}`),
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
  getMyHosted: () => api<{ data: any[]; count: number }>('/v1/events/my'),
  create: (data: any) => api<{ data: any }>('/v1/events', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => api<{ data: any }>(`/v1/events/${id}`),
  rsvp: (id: string, status: string) =>
    api<{ data: any }>(`/v1/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  setDoorCode: (id: string, code: string, expiresAt?: string) =>
    api<{ data: any }>(`/v1/events/${id}/door-code`, { method: 'PUT', body: JSON.stringify({ code, expiresAt }) }),
};

export const venuesApi = {
  getMyVenues: () => api<{ data: any[]; count: number }>('/v1/venues/my'),
  getDashboard: (venueId: string) => api<{ data: any }>(`/v1/venues/${venueId}/dashboard`),
  getAnalytics: (venueId: string, days = 30) => api<{ data: any[] }>(`/v1/venues/${venueId}/analytics?days=${days}`),
  getStaff: (venueId: string) => api<{ data: any[] }>(`/v1/venues/${venueId}/staff`),
  get: (id: string) => api<{ data: any }>(`/v1/venues/${id}`),
  create: (data: { name: string; description?: string; lat: number; lng: number; type?: string; capacity?: number; amenities?: string[] }) =>
    api<{ data: any }>('/v1/venues', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (venueId: string, data: Record<string, unknown>) =>
    api<{ data: any }>(`/v1/venues/${venueId}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
  createSpecial: (venueId: string, data: { title: string; description?: string; dayOfWeek?: number; startTime?: string; endTime?: string; isRecurring?: boolean }) =>
    api<{ data: any }>(`/v1/venues/${venueId}/specials`, { method: 'POST', body: JSON.stringify(data) }),
  inviteStaff: (venueId: string, userId: string, role: string) =>
    api<{ data: any }>(`/v1/venues/${venueId}/staff`, { method: 'POST', body: JSON.stringify({ userId, role }) }),
  removeStaff: (venueId: string, staffId: string) =>
    api(`/v1/venues/${venueId}/staff/${staffId}`, { method: 'DELETE' }),
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

export const couplesApi = {
  getMe: () => api<{ data: any }>('/v1/couples/me'),
  create: () => api<{ data: { inviteCode: string } }>('/v1/couples', { method: 'POST', body: JSON.stringify({}) }),
  link: (inviteCode: string) => api('/v1/couples/link', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  requestDissolution: () => api('/v1/couples/dissolve', { method: 'POST', body: JSON.stringify({}) }),
  confirmDissolution: () => api<{ data: { dissolved?: boolean; confirmations?: number; required?: number; cooldownExpires?: string } }>('/v1/couples/confirm-dissolution', { method: 'POST', body: JSON.stringify({}) }),
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
