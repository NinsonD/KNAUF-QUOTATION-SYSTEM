import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, revokeCurrentSession } from '@/lib/auth/session';
import { checkOrigin } from '@/lib/auth/security';
export async function POST(req: NextRequest) {
  const error = checkOrigin(req); if (error) return error;
  try { await revokeCurrentSession(); const response = NextResponse.json({ success: true }); clearAuthCookie(response); return response; }
  catch { return NextResponse.json({ error: 'Could not end the session. Try again.' }, { status: 503 }); }
}
