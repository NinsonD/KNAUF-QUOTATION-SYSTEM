import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  canManagePrices,
  canCreateQuote,
  canEditQuoteItems,
  canEditQuoteMeta,
  canDeleteQuote,
  canExportQuote,
  canManageUsers,
  ROLE_CONFIG,
} from '@/lib/auth/permissions';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null, permissions: null });
  }

  const role = user.role;
  const permissions = {
    canManagePrices: canManagePrices(role),
    canCreateQuote: canCreateQuote(role),
    canEditQuoteItems: canEditQuoteItems(role),
    canEditQuoteMeta: canEditQuoteMeta(role),
    canDeleteQuote: canDeleteQuote(role),
    canExportQuote: canExportQuote(role),
    canManageUsers: canManageUsers(role),
  };

  const roleMeta = ROLE_CONFIG[role] || null;

  return NextResponse.json({
    user,
    roleMeta,
    permissions,
  });
}

