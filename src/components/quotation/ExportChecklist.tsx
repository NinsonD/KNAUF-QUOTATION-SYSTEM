import type { CalculatedItem, QuoteMetaData } from '@/lib/engine/types';

export default function ExportChecklist({ meta, area, items, problem, dirty = false, saved = false }: {
  meta: QuoteMetaData; area: number; items: CalculatedItem[]; problem: string; dirty?: boolean; saved?: boolean;
}) {
  const missing = items.filter(item => item.totalQuantity > 0 && item.unitPriceAed <= 0);
  const checks = [
    { label: 'Customer and project details', ok: Boolean(meta.clientName.trim() && meta.projectName.trim()), target: saved ? 'saved-area' : 'project-name' },
    { label: 'Quotation reference', ok: Boolean(meta.quoteNumber.trim()), target: saved ? 'saved-area' : 'quote-reference' },
    { label: 'Valid area and technical settings', ok: Number.isFinite(area) && area > 0 && !problem, target: saved ? 'saved-area' : 'project-area' },
    { label: !items.length ? 'Add at least one material' : missing.length ? `Rates required for ${missing.length} items` : 'All material rates entered', ok: missing.length === 0 && items.length > 0, target: 'quotation-items' },
    ...(saved ? [{ label: 'Changes saved', ok: !dirty, target: 'saved-area' }] : []),
  ];
  function go(target: string) {
    const element = document.getElementById(target);
    const details = element?.closest('details');
    if (details) details.open = true;
    element?.scrollIntoView({ block: 'center', behavior: 'instant' });
    element?.focus({ preventScroll: true });
  }
  return <section className="quote-panel p-4" aria-label="Export review checklist"><h2 className="desk-section-heading">Ready to export?</h2><ul className="mt-3 space-y-2 text-sm">{checks.map(check => <li key={check.label} className="flex items-start gap-2"><span className={check.ok ? 'text-green-700' : 'text-amber-700'} aria-hidden="true">{check.ok ? '✓' : '○'}</span>{check.ok ? <span>{check.label}</span> : <button type="button" className="text-left text-amber-800 underline underline-offset-2" onClick={() => go(check.target)}>{check.label}<span className="sr-only"> — needs attention</span></button>}</li>)}</ul>{problem && <p className="mt-2 text-sm text-red-700">{problem}</p>}</section>;
}
