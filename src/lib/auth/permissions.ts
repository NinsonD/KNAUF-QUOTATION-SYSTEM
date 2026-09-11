export type UserRole = 'ADMIN' | 'ESTIMATOR' | 'SALES' | 'VIEWER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    description: string;
    badgeColor: string;
    bgBadge: string;
    borderBadge: string;
  }
> = {
  ADMIN: {
    label: 'Administrator',
    description: 'Full master access, catalog price modifications, user management, and quote approval.',
    badgeColor: 'text-[#f86c29]',
    bgBadge: 'bg-[#f86c29]/10',
    borderBadge: 'border-[#f86c29]/30',
  },
  ESTIMATOR: {
    label: 'Lead Estimator',
    description: 'Technical calculation, BOQ customization, and direct quote pricing calculation.',
    badgeColor: 'text-[#00488e]',
    bgBadge: 'bg-[#00488e]/10',
    borderBadge: 'border-[#00488e]/30',
  },
  SALES: {
    label: 'Sales Representative',
    description: 'Generates client quotations, manages proposal revisions, and exports official workbooks.',
    badgeColor: 'text-emerald-700',
    bgBadge: 'bg-emerald-500/10',
    borderBadge: 'border-emerald-500/30',
  },
  VIEWER: {
    label: 'Client / Executive Viewer',
    description: 'Read-only access to browse technical catalog, review quotations, and download PDFs/Excel.',
    badgeColor: 'text-slate-600',
    bgBadge: 'bg-slate-500/10',
    borderBadge: 'border-slate-500/30',
  },
};

/** Permission Checkers */

export function canManagePrices(role?: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function canCreateQuote(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'ESTIMATOR' || role === 'SALES';
}

export function canEditQuoteItems(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'ESTIMATOR';
}

export function canEditQuoteMeta(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'ESTIMATOR' || role === 'SALES';
}

export function canDeleteQuote(role?: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function canExportQuote(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'ESTIMATOR' || role === 'SALES' || role === 'VIEWER';
}

export function canManageUsers(role?: UserRole | null): boolean {
  return role === 'ADMIN';
}

