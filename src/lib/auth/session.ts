import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthUser, ROLE_CONFIG, UserRole } from './permissions';
export const SESSION_COOKIE = 'alnamariq_session';
const MAX_AGE = 8 * 60 * 60;
export const IDLE_MS = 30 * 60 * 1000;
export const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.authSession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
  const now = new Date();
  if (!session || session.sessionVersion !== session.user.sessionVersion || session.expiresAt <= now || now.getTime() - session.lastSeenAt.getTime() > IDLE_MS || !(session.user.role in ROLE_CONFIG)) return null;
  // Limit idle-time writes while consulting the current account/role on every request.
  await prisma.authSession.updateMany({ where: { tokenHash: session.tokenHash, lastSeenAt: { lt: new Date(now.getTime() - 60000) } }, data: { lastSeenAt: now } });
  const user = session.user;
  return { id: user.id, email: user.email, name: user.name, role: user.role as UserRole, avatarUrl: user.avatarUrl, mustChangePassword: user.mustChangePassword };
}
export async function setAuthCookie(res: NextResponse, user: AuthUser, version?: number): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionVersion = version ?? (await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { sessionVersion: true } })).sessionVersion;
  await prisma.authSession.create({ data: { tokenHash: tokenHash(token), userId: user.id, sessionVersion, expiresAt: new Date(Date.now() + MAX_AGE * 1000) } });
  res.cookies.set({ name: SESSION_COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE });
  res.headers.set('Cache-Control', 'no-store');
}
export async function revokeCurrentSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await prisma.authSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
}
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({ name: SESSION_COOKIE, value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  res.headers.set('Cache-Control', 'no-store');
}
