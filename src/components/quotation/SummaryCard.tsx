import type { CalculationResult } from '@/lib/engine/types';

interface SummaryCardProps { calculation: CalculationResult; systemName: string; projectName: string; hasDeflection: boolean; }
const money = (value: number) => value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SummaryCard({ calculation, systemName, projectName, hasDeflection }: SummaryCardProps) {
  return <aside className="quote-panel space-y-5 p-5"><h2 className="desk-section-heading">Totals</h2><div><p className="text-sm font-medium">{projectName}</p><p className="mt-1 text-sm text-slate-500">{systemName}</p></div><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Area</dt><dd>{calculation.scaleM2.toLocaleString()} m²</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Base materials</dt><dd>AED {money(calculation.baseTotalAed)}</dd></div>{hasDeflection && <div className="flex justify-between gap-3"><dt className="text-slate-500">Head deflection</dt><dd>AED {money(calculation.deflectionTotalAed)}</dd></div>}</dl><div className="border-t border-slate-200 pt-5"><p className="text-sm text-slate-500">Total · excluding VAT</p><p className="mt-1 desk-total-value">AED {money(calculation.grandTotalAed)}</p><p className="mt-2 text-sm text-slate-500">AED {money(calculation.grandRatePerM2)} / m²</p></div></aside>;
}
