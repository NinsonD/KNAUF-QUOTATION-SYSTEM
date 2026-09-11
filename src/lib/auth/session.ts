import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthUser, UserRole } from './permissions';

const SESSION_COOKIE = 'alnamariq_session';
const SESSION_SECRET = process.env.AUTH_SECRET || 'alnamariq-knauf-secret-auth-key-2026';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  exp: number;
}

/**
 * Sign a session payload using HMAC SHA-256
 */
export function signSession(user: AuthUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    exp,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8')
    );

    if (Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to get currently authenticated user from incoming cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      avatarUrl: payload.avatarUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Set HTTP-only session cookie on a NextResponse
 */
export function setAuthCookie(res: NextResponse, user: AuthUser): void {
  const token = signSession(user);
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clear session cookie on a NextResponse
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

