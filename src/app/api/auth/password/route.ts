import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getCurrentUser, setAuthCookie } from '@/lib/auth/session';
import { hashPasswordAsync, verifyPasswordAsync } from '@/lib/auth/password';
import { checkOrigin, limitAttempts } from '@/lib/auth/security';
const input = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(15).max(128).refine(value => value.trim().length >= 15 && !/^(.)\1+$/.test(value)) });
export async function POST(req: NextRequest) {
  try {
    const originError = checkOrigin(req); if (originError) return originError;
    const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    if (!req.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Use the password change form.' }, { status: 415 });
    const text = await req.text(); if (Buffer.byteLength(text) > 4096) return NextResponse.json({ error: 'Password fields are too long.' }, { status: 400 });
    const body = input.safeParse(JSON.parse(text)); if (!body.success) return NextResponse.json({ error: 'Use a new password with 15–128 characters.' }, { status: 400 });
    const limited = await limitAttempts(req, user.id, 'password-change'); if (limited) return limited;
    const account = await prisma.user.findUnique({ where: { id: user.id } });
    if (!account || !(await verifyPasswordAsync(body.data.currentPassword, account.passwordHash))) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    if (body.data.currentPassword === body.data.newPassword) return NextResponse.json({ error: 'Choose a different password.' }, { status: 400 });
    const passwordHash = await hashPasswordAsync(body.data.newPassword);
    const changed = await prisma.$transaction(async tx => {
      const updated = await tx.user.updateMany({ where: { id: user.id, passwordHash: account.passwordHash }, data: { passwordHash, mustChangePassword: false, sessionVersion: { increment: 1 } } });
      if (!updated.count) return false;
      await tx.authSession.deleteMany({ where: { userId: user.id } }); return true;
    });
    if (!changed) return NextResponse.json({ error: 'Password changed in another session. Log in again.' }, { status: 409 });
    const response = NextResponse.json({ success: true }); await setAuthCookie(response, { ...user, mustChangePassword: false }); return response;
  } catch (error) { return NextResponse.json({ error: error instanceof SyntaxError ? 'Check the password fields.' : 'Could not change the password. Please try again.' }, { status: error instanceof SyntaxError ? 400 : 503 }); }
}
