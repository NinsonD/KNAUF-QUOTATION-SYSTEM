import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashPasswordAsync, passwordNeedsRehash, verifyPasswordAsync } from '@/lib/auth/password';
import { setAuthCookie } from '@/lib/auth/session';
import { checkOrigin, limitAttempts } from '@/lib/auth/security';
import { ROLE_CONFIG, UserRole } from '@/lib/auth/permissions';
const credentials = z.object({ email: z.string().trim().email().max(254).transform(s => s.toLowerCase()), password: z.string().min(1).max(256) });
// A valid current-format hash ensures unknown accounts also perform password verification.
const DUMMY_HASH = 'pbkdf2-sha512$220000$00000000000000000000000000000000$' + '0'.repeat(128);
export async function POST(req: NextRequest) {
  try {
    const originError = checkOrigin(req); if (originError) return originError;
    if (!req.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Use the login form.' }, { status: 415 });
    const text = await req.text();
    if (Buffer.byteLength(text) > 4096) return NextResponse.json({ error: 'Check your email and password.' }, { status: 400 });
    const parsed = credentials.safeParse(JSON.parse(text));
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
    const { email, password } = parsed.data;
    const limited = await limitAttempts(req, email); if (limited) return limited;
    let user = await prisma.user.findUnique({ where: { email } });
    const valid = await verifyPasswordAsync(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || !(user.role in ROLE_CONFIG)) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    if (passwordNeedsRehash(user.passwordHash)) {
      const passwordHash = await hashPasswordAsync(password);
      // Do not undo a concurrent password change with a legacy-hash upgrade.
      await prisma.user.updateMany({ where: { id: user.id, passwordHash: user.passwordHash }, data: { passwordHash } });
      const fresh = await prisma.user.findUnique({ where: { id: user.id } });
      if (!fresh || !(await verifyPasswordAsync(password, fresh.passwordHash))) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      user = fresh;
    }
    const authUser = { id: user.id, email: user.email, name: user.name, role: user.role as UserRole, avatarUrl: user.avatarUrl, mustChangePassword: user.mustChangePassword };
    const response = NextResponse.json({ success: true, user: authUser, mustChangePassword: user.mustChangePassword });
    await setAuthCookie(response, authUser, user.sessionVersion);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Enter a valid email and password.' : 'Login is temporarily unavailable. Please try again.' }, { status: error instanceof SyntaxError ? 400 : 503 });
  }
}
