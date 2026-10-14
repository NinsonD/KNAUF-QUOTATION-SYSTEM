import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManagePrices, canCreateQuote, canEditQuoteItems, canEditQuoteMeta, canDeleteQuote, canExportQuote, canManageUsers, ROLE_CONFIG } from '@/lib/auth/permissions';
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ user: null, permissions: null }, { headers: { 'Cache-Control': 'no-store' } });
    const role = user.role;
    return NextResponse.json({ user, roleMeta: ROLE_CONFIG[role], permissions: { canManagePrices: canManagePrices(role), canCreateQuote: canCreateQuote(role), canEditQuoteItems: canEditQuoteItems(role), canEditQuoteMeta: canEditQuoteMeta(role), canDeleteQuote: canDeleteQuote(role), canExportQuote: canExportQuote(role), canManageUsers: canManageUsers(role) } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Sign-in service is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
