import { OAuth2Client } from 'google-auth-library';
import JwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';

export type OAuthProvider = 'apple' | 'google' | 'snapchat';

export interface OAuthUser {
  provider: OAuthProvider;
  providerUserId: string;
  email?: string;
  displayName?: string;
}

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const appleJwks = process.env.APPLE_CLIENT_ID
  ? JwksRsa({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      rateLimit: true,
    })
  : null;

export async function verifyGoogleIdToken(idToken: string): Promise<OAuthUser> {
  if (!googleClient) {
    throw Object.assign(new Error('Google OAuth not configured'), { statusCode: 503 });
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 });
  }
  return {
    provider: 'google',
    providerUserId: payload.sub,
    email: payload.email,
    displayName: payload.name ?? payload.given_name ?? undefined,
  };
}

export async function verifyAppleIdToken(idToken: string): Promise<OAuthUser> {
  if (!appleJwks) {
    throw Object.assign(new Error('Apple OAuth not configured'), { statusCode: 503 });
  }
  const decoded = jwt.decode(idToken, { complete: true }) as jwt.Jwt | null;
  if (!decoded?.header?.kid) {
    throw Object.assign(new Error('Invalid Apple token'), { statusCode: 401 });
  }
  const key = await appleJwks.getSigningKey(decoded.header.kid);
  const publicKey = key.getPublicKey();
  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: process.env.APPLE_CLIENT_ID,
    issuer: 'https://appleid.apple.com',
  }) as { sub: string; email?: string };
  return {
    provider: 'apple',
    providerUserId: payload.sub,
    email: payload.email,
    displayName: undefined, // Apple only sends name on first auth
  };
}

export async function verifySnapAuthCode(authCode: string): Promise<OAuthUser> {
  const clientId = process.env.SNAP_CLIENT_ID;
  const clientSecret = process.env.SNAP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw Object.assign(new Error('Snapchat OAuth not configured'), { statusCode: 503 });
  }
  const redirectUri = process.env.SNAP_REDIRECT_URI || 'https://shhh.app/oauth/snap/callback';
  const res = await fetch('https://accounts.snapchat.com/accounts/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw Object.assign(new Error(`Snapchat token exchange failed: ${err}`), { statusCode: 401 });
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw Object.assign(new Error('Invalid Snapchat response'), { statusCode: 401 });
  }
  const userRes = await fetch('https://api.snapchat.com/v1/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (!userRes.ok) {
    throw Object.assign(new Error('Failed to fetch Snapchat user'), { statusCode: 401 });
  }
  const userData = (await userRes.json()) as { id?: string; display_name?: string };
  if (!userData.id) {
    throw Object.assign(new Error('Invalid Snapchat user data'), { statusCode: 401 });
  }
  return {
    provider: 'snapchat',
    providerUserId: userData.id,
    displayName: userData.display_name,
  };
}
