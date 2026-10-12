import type { ReactNode } from 'react';

export function StatusIndicator({ status }: { status: string }) {
  return <span className={`desk-indicator status-${status.toLowerCase().replaceAll(' ', '-')}`}><span aria-hidden="true" />{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>;
}

export default function PageHeader({ title, status, subtitle, actions }: { title: string; status?: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="desk-page-header no-print"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h1>{title}</h1>{status && <StatusIndicator status={status} />}</div>{subtitle && <p className="desk-page-subtitle">{subtitle}</p>}</div>{actions && <div className="desk-page-actions">{actions}</div>}</div>;
}
