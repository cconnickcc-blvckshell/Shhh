import { Platform } from 'react-native';

const envApiUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
export const API_BASE = envApiUrl
  ? (process.env.EXPO_PUBLIC_API_URL as string).replace(/\/$/, '')
  : Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';

let authToken = '';
let refreshTokenValue = '';
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

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

export function setRefreshToken(token: string) {
  refreshTokenValue = token;
  try { if (typeof window !== 'undefined') window.localStorage?.setItem('shhh_refresh_token', token); } catch {}
}

export function getRefreshToken(): string {
  if (!refreshTokenValue) {
    try { refreshTokenValue = (typeof window !== 'undefined' ? window.localStorage?.getItem('shhh_refresh_token') : null) || ''; } catch {}
  }
  return refreshTokenValue;
}

export function clearTokens() {
  authToken = '';
  refreshTokenValue = '';
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('shhh_token');
      window.localStorage?.removeItem('shhh_refresh_token');
    }
  } catch {}
}

async function refreshAccessToken(): Promise<string> {
  const rt = getRefreshToken();
  if (!rt) throw new Error('No refresh token');

  if (isRefreshing) {
    return new Promise((resolve, reject) => { refreshQueue.push({ resolve, reject }); });
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const body = await res.json();
    const newAccess = body.data?.accessToken || body.accessToken;
    const newRefresh = body.data?.refreshToken || body.refreshToken;
    if (!newAccess) throw new Error('No access token in refresh response');
    setAuthToken(newAccess);
    if (newRefresh) setRefreshToken(newRefresh);
    refreshQueue.forEach(q => q.resolve(newAccess));
    return newAccess;
  } catch (err) {
    refreshQueue.forEach(q => q.reject(err as Error));
    throw err;
  } finally {
    isRefreshing = false;
    refreshQueue = [];
  }
}

export function getMediaUrl(storagePath: string): string {
  const path = storagePath?.startsWith('/') ? storagePath : `/${storagePath}`;
  return `${API_BASE}/uploads${path}`;
}

/**
 * Returns thumbnail URL for discovery grid when storage follows convention:
 * /photos/hash.jpg -> /photos/thumbs/thumb_hash.jpg
 * Returns null for non-matching paths (e.g. external URLs).
 */
export function getThumbnailUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const p = storagePath.startsWith('/') ? storagePath : `/${storagePath}`;
  const match = p.match(/^\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const [, category, filename] = match;
  const stem = filename.replace(/\.[^.]+$/, '');
  if (!stem) return null;
  return `${API_BASE}/uploads/${category}/thumbs/thumb_${stem}.jpg`;
}

export interface ApiError extends Error {
  code?: string;
  cap?: number;
  used?: number;
  tierOptions?: string[];
}

export async function api<T = any>(path: string, options: RequestInit = {}, _skipRefresh = false): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !_skipRefresh && !path.startsWith('/v1/auth/') && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return api<T>(path, options, true);
    } catch {
      if (onUnauthorized) onUnauthorized();
      const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(body.error?.message || 'Session expired');
    }
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized && !path.startsWith('/v1/auth/')) {
      onUnauthorized();
    }
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const errMsg = body.error?.message || `Request failed: ${res.status}`;
    const err = new Error(errMsg) as ApiError;
    if (body.error?.code) err.code = body.error.code;
    if (body.error?.cap != null) err.cap = body.error.cap;
    if (body.error?.used != null) err.used = body.error.used;
    if (body.error?.tierOptions) err.tierOptions = body.error.tierOptions;
    throw err;
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const authApi = {
  registerEmail: (email: string, password: string, displayName: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/email/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),
  loginEmail: (email: string, password: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (phone: string, displayName: string, sessionToken?: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/register', {
      method: 'POST', body: JSON.stringify({ phone, displayName, ...(sessionToken && { sessionToken }) }),
    }),
  login: (phone: string, sessionToken?: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/login', {
      method: 'POST', body: JSON.stringify({ phone, ...(sessionToken && { sessionToken }) }),
    }),
  oauthApple: (idToken: string, displayName?: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/oauth/apple', {
      method: 'POST', body: JSON.stringify({ idToken, ...(displayName && { displayName }) }),
    }),
  oauthGoogle: (idToken: string, displayName?: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/oauth/google', {
      method: 'POST', body: JSON.stringify({ idToken, ...(displayName && { displayName }) }),
    }),
  oauthSnap: (authCode: string, displayName?: string) =>
    api<{ data: { userId: string; accessToken: string; refreshToken: string } }>('/v1/auth/oauth/snap', {
      method: 'POST', body: JSON.stringify({ authCode, ...(displayName && { displayName }) }),
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
    return api<{ data: any[]; count: number; discoveryCap?: number }>(url);
  },
  crossingPaths: (minCount?: number) => {
    const url = minCount != null ? `/v1/discover/crossing-paths?minCount=${minCount}` : '/v1/discover/crossing-paths';
    return api<{ data: Array<{ venueId: string; otherUserId: string; count: number; venueName: string | null }> }>(url);
  },
  updateLocation: (lat: number, lng: number, isPrecise?: boolean) =>
    api('/v1/discover/location', { method: 'POST', body: JSON.stringify({ lat, lng, isPrecise }) }),
};

export const messagingApi = {
  getConversations: () => api<{ data: any[] }>('/v1/conversations'),
  createConversation: (participantIds: string[], filterContext?: Record<string, unknown>) =>
    api<{ data: { id: string } }>('/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantIds, ...(filterContext && Object.keys(filterContext).length > 0 && { filterContext }) }),
    }),
  getMessages: (convId: string) => api<{ data: any[] }>(`/v1/conversations/${convId}/messages`),
  sendMessage: (convId: string, content: string, contentType?: string, ttlSeconds?: number) =>
    api<{ data: any }>(`/v1/conversations/${convId}/messages`, {
      method: 'POST', body: JSON.stringify({ content, contentType, ttlSeconds }),
    }),
};

export const eventsApi = {
  nearby: (lat: number, lng: number, radius?: number, vibe?: string) => {
    let url = `/v1/events/nearby?lat=${lat}&lng=${lng}`;
    if (radius != null) url += `&radius=${radius}`;
    if (vibe) url += `&vibe=${encodeURIComponent(vibe)}`;
    return api<{ data: any[] }>(url);
  },
  thisWeek: (lat: number, lng: number, radius?: number, vibe?: string) => {
    let url = `/v1/events/this-week?lat=${lat}&lng=${lng}`;
    if (radius != null) url += `&radius=${radius}`;
    if (vibe) url += `&vibe=${encodeURIComponent(vibe)}`;
    return api<{ data: any[] }>(url);
  },
  getMyHosted: () => api<{ data: any[]; count: number }>('/v1/events/my'),
  create: (data: any) => api<{ data: any }>('/v1/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api<{ data: any }>(`/v1/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  get: (id: string) => api<{ data: any }>(`/v1/events/${id}`),
  rsvp: (id: string, status: string) =>
    api<{ data: any }>(`/v1/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  setDoorCode: (id: string, code: string, expiresAt?: string) =>
    api<{ data: any }>(`/v1/events/${id}/door-code`, { method: 'PUT', body: JSON.stringify({ code, expiresAt }) }),
};

export const venuesApi = {
  getNearby: (lat: number, lng: number, radius?: number) => {
    let url = `/v1/venues/nearby?lat=${lat}&lng=${lng}`;
    if (radius != null) url += `&radius=${radius}`;
    return api<{ data: any[]; count: number }>(url);
  },
  getMyVenues: () => api<{ data: any[]; count: number }>('/v1/venues/my'),
  getDashboard: (venueId: string) => api<{ data: any }>(`/v1/venues/${venueId}/dashboard`),
  getAnalytics: (venueId: string, days = 30) => api<{ data: any[] }>(`/v1/venues/${venueId}/analytics?days=${days}`),
  getStaff: (venueId: string) => api<{ data: any[] }>(`/v1/venues/${venueId}/staff`),
  get: (id: string) => api<{ data: any }>(`/v1/venues/${id}`),
  getGrid: (venueId: string) => api<{ data: any[]; count: number }>(`/v1/venues/${venueId}/grid`),
  getStories: (venueId: string) => api<{ data: any[]; count: number }>(`/v1/venues/${venueId}/stories`),
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
  venueDistress: (venueId: string) =>
    api<{ data: { recorded: boolean; staffNotified: number } }>('/v1/safety/venue-distress', {
      method: 'POST',
      body: JSON.stringify({ venueId }),
    }),
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

export const storiesApi = {
  nearby: (lat: number, lng: number, radius?: number) => {
    let url = `/v1/stories/nearby?lat=${lat}&lng=${lng}`;
    if (radius != null) url += `&radius=${radius}`;
    return api<{ data: any[]; count: number }>(url);
  },
  get: (id: string) => api<{ data: any }>(`/v1/stories/${id}`),
  create: (mediaId: string, venueId?: string, ttlHours?: number) =>
    api<{ data: any }>('/v1/stories', {
      method: 'POST',
      body: JSON.stringify({ mediaId, ...(venueId && { venueId }), ...(ttlHours && { ttlHours }) }),
    }),
  view: (id: string) => api<{ data: { viewed: boolean } }>(`/v1/stories/${id}/view`),
};

export const tonightApi = {
  getFeed: (lat: number, lng: number, date?: string, radius?: number) => {
    let url = `/v1/tonight?lat=${lat}&lng=${lng}`;
    if (date) url += `&date=${date}`;
    if (radius != null) url += `&radius=${radius}`;
    return api<{ data: { events: any[]; venues: any[]; date: string } }>(url);
  },
};

export const adsApi = {
  getFeed: (lat?: number, lng?: number) => {
    let url = '/v1/ads/feed';
    if (lat != null && lng != null) url += `?lat=${lat}&lng=${lng}`;
    return api<{ data: any | null }>(url);
  },
  recordImpression: (id: string, surface?: string) =>
    api(`/v1/ads/${id}/impression`, { method: 'POST', body: JSON.stringify({ surface: surface || 'discover_feed' }) }),
  tap: (id: string) => api(`/v1/ads/${id}/tap`, { method: 'POST' }),
  dismiss: (id: string) => api(`/v1/ads/${id}/dismiss`, { method: 'POST' }),
};

export const contentApi = {
  getGuides: () => api<{ data: { key: string; title: string | null; bodyMd: string | null; link: string | null; locale: string } }>('/v1/content/guides'),
  getNorms: () => api<{ data: { key: string; title: string | null; bodyMd: string | null; link: string | null; locale: string } }>('/v1/content/norms'),
};

export const groupsApi = {
  list: () => api<{ data: any[] }>('/v1/groups'),
  get: (id: string) => api<{ data: any }>(`/v1/groups/${id}`),
  join: (id: string) => api(`/v1/groups/${id}/join`, { method: 'POST' }),
  leave: (id: string) => api(`/v1/groups/${id}/leave`, { method: 'DELETE' }),
  getEvents: (id: string) => api<{ data: any[] }>(`/v1/groups/${id}/events`),
};

export const albumsApi = {
  getMyAlbums: () => api<{ data: any[] }>('/v1/media/albums/my'),
  getShared: () => api<{ data: any[] }>('/v1/media/albums/shared'),
  getAlbum: (id: string) => api<{ data: any }>(`/v1/media/albums/${id}`),
  create: (name: string, description?: string, isPrivate?: boolean) =>
    api<{ data: any }>('/v1/media/albums', { method: 'POST', body: JSON.stringify({ name, description, isPrivate }) }),
  share: (albumId: string, opts: { userId: string; expiresInHours?: number; watermarkMode?: 'off' | 'subtle' | 'invisible'; notifyOnView?: boolean }) =>
    api(`/v1/media/albums/${albumId}/share`, { method: 'POST', body: JSON.stringify(opts) }),
  revokeShare: (albumId: string, userId: string) =>
    api(`/v1/media/albums/${albumId}/share/${userId}`, { method: 'DELETE' }),
};
