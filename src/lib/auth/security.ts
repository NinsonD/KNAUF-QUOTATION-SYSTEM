import crypto from 'node:crypto';
import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCurrentUser } from './session';
export function checkOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(req.url).origin)) return NextResponse.json({ error: 'This request must come from the quotation app.' }, { status: 403 });
  return null;
}
export async function requireApiUser(req?: NextRequest) {
  if (req && !['GET','HEAD'].includes(req.method)) { const error = checkOrigin(req); if (error) return error; }
  let user;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: 'Sign-in service is temporarily unavailable.' }, { status: 503 }); }
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (user.mustChangePassword) return NextResponse.json({ error: 'Change your password before continuing.', code: 'PASSWORD_CHANGE_REQUIRED' }, { status: 403 });
  return user;
}
export async function requirePageUser(allowPasswordChange = false) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.mustChangePassword && !allowPasswordChange) redirect('/account/password');
  return user;
}
const WINDOW_MS = 15 * 60 * 1000;
export async function limitAttempts(req: NextRequest, identity: string, purpose = 'login') {
  const forwarded = process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for') ?? req.headers.get('x-forwarded-for') : null;
  const candidate = forwarded?.split(',')[0].trim() ?? '';
  const ip = isIP(candidate) ? candidate : 'local-or-unknown';
  const secret = process.env.AUTH_SECRET ?? (process.env.NODE_ENV !== 'production' ? 'local-limit-key' : null);
  if (!secret) throw new Error('Authentication configuration unavailable.');
  const now = Date.now(), bucket = Math.floor(now / WINDOW_MS), expiresAt = new Date((bucket + 1) * WINDOW_MS);
  const keyFor = (value: string) => crypto.createHmac('sha256', secret).update(`${purpose}:${bucket}:${value}`).digest('hex');
  const denied = () => NextResponse.json({ error: 'Too many attempts. Please try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((expiresAt.getTime() - now) / 1000)), 'Cache-Control': 'no-store' } });
  // Enforce IP quota before creating account keys, so a blocked address cannot
  // grow the limiter table by submitting unbounded random account names.
  const ipKey = keyFor(`ip:${ip}`);
  const ipCounter = await prisma.authRateLimit.upsert({ where: { key: ipKey }, create: { key: ipKey, expiresAt }, update: { attempts: { increment: 1 } } });
  if (ipCounter.attempts > 30) return denied();
  const accountKey = keyFor(`account:${identity}`);
  const counters = await prisma.$transaction([
    prisma.authRateLimit.upsert({ where: { key: accountKey }, create: { key: accountKey, expiresAt }, update: { attempts: { increment: 1 } } }),
    prisma.authRateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now - WINDOW_MS) } } }),
    prisma.authSession.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }),
  ]);
  if (counters[0].attempts > 10) return denied();
  return null;
}
