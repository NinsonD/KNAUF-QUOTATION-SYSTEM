'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Download, Eye, FileSpreadsheet, Loader2 } from 'lucide-react';
import systemsData from '@/data/knauf-systems.json';
import defaultPrices from '@/data/default-prices.json';
import { calculateQuotation } from '@/lib/engine/calculator';
import type { CalculatedItem, KnaufSystemDefinition, QuoteMetaData, QuoteStatus, SystemCategory } from '@/lib/engine/types';
import { useAuth } from '@/lib/auth/AuthContext';
import MaterialGrid from '@/components/quotation/MaterialGrid';
import QuotePreview from '@/components/quotation/QuotePreview';
import PageHeader from '@/components/layout/PageHeader';
import { AL_NAMARIQ_TERMS, generateAlNamariqExcel } from '@/lib/exporters/excel-generator';

const systems = systemsData as KnaufSystemDefinition[];
const categories: Record<SystemCategory, string> = { CEILING: 'Ceilings', PARTITION: 'Partitions', SHAFT_WALL: 'Shaft walls', WALL_LINING: 'Wall linings' };
const money = (value: number) => value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function NewQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, permissions, isLoading: authLoading } = useAuth();
  const initialSystem = systems.find(system => system.code === searchParams.get('systemCode'))
    ?? systems.find(system => searchParams.get('category') ? system.category === searchParams.get('category') : system.code === 'KW111') ?? systems[0];
  const [system, setSystem] = useState(initialSystem);
  const [scale, setScale] = useState(1000);
  const [includeDeflection, setIncludeDeflection] = useState(initialSystem.supportsDeflection);
  const [prices, setPrices] = useState<Record<string, number>>(defaultPrices);
  const [customItems, setCustomItems] = useState<{ base?: CalculatedItem[]; deflection?: CalculatedItem[] }>({});
  const [meta, setMeta] = useState<QuoteMetaData>({ quoteNumber: '', projectName: '', clientName: '', salesman: '', date: '', status: 'DRAFT' });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<'save' | 'pdf' | 'excel' | null>(null);
  const [error, setError] = useState('');
  const [catalogNotice, setCatalogNotice] = useState('');
  const calculation = useMemo(() => calculateQuotation(system, scale, prices, includeDeflection, customItems), [system, scale, prices, includeDeflection, customItems]);
  const editableDeflection = calculateQuotation(system, scale, prices, true, customItems).deflectionItems;
  const canEditMaterials = permissions?.canEditQuoteItems !== false;
  const valid = meta.projectName.trim() && meta.clientName.trim() && meta.quoteNumber.trim() && Number.isFinite(scale) && scale > 0;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let notice = '';
      try {
        const response = await fetch('/api/catalog');
        if (!response.ok) throw new Error('Catalog unavailable');
        const catalog = await response.json();
        if (!cancelled) {
          if (catalog.prices) setPrices(catalog.prices);
          if (catalog.error) notice = 'Live prices are unavailable. Default prices are shown; check them before sending.';
        }
      } catch { notice = 'Live prices are unavailable. Default prices are shown; check them before sending.'; }
      if (!cancelled) {
        setMeta(previous => ({ ...previous, quoteNumber: `ANM-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, date: new Date().toLocaleDateString('en-GB') }));
        setCatalogNotice(notice); setCatalogLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const documentMeta = { ...meta, projectName: meta.projectName.trim(), clientName: meta.clientName.trim(), salesman: meta.salesman || user?.name || 'Sales team' };
  const updateItem = (section: 'base' | 'deflection', index: number, changes: Partial<CalculatedItem>) => {
    const items = section === 'base' ? calculation.baseItems : editableDeflection;
    setCustomItems(previous => ({ ...previous, [section]: items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) }));
  };
  const removeItem = (section: 'base' | 'deflection', index: number) => {
    const items = section === 'base' ? calculation.baseItems : editableDeflection;
    setCustomItems(previous => ({ ...previous, [section]: items.filter((_, itemIndex) => itemIndex !== index) }));
  };
  const download = (blob: Blob, extension: string) => {
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${meta.quoteNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.${extension}`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  async function perform(action: 'save' | 'pdf' | 'excel') {
    if (!valid) { setError('Enter the project, client, and an area greater than zero.'); return; }
    setBusy(action); setError('');
    try {
      if (action === 'save') {
        const response = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...documentMeta, scaleM2: scale, systemCode: system.code, includeDeflection, calculation, termsAndConditions: AL_NAMARIQ_TERMS }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not save this quote. Try again.');
        router.push(`/quotes/${result.id}`);
      } else if (action === 'pdf') {
        const response = await fetch('/api/quotes/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meta: documentMeta, system, calculation, download: true }) });
        if (!response.ok) throw new Error('Could not download the PDF. Try again.');
        download(await response.blob(), 'pdf');
      } else {
        const logoResponse = await fetch('/logo/logo.png'); const logo = logoResponse.ok ? await logoResponse.arrayBuffer() : undefined;
        const buffer = await generateAlNamariqExcel(documentMeta, system, calculation, logo);
        download(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'xlsx');
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Something went wrong. Try again.'); }
    finally { setBusy(null); }
  }

  if (!authLoading && permissions?.canCreateQuote === false) return <div className="quote-panel p-8"><h1 className="text-2xl font-semibold">New quote</h1><p className="mt-3 text-slate-600">Your account can view saved quotes. Ask your estimator to create a new quote.</p></div>;

  return (
    <div className="space-y-5">
      <PageHeader title="New Quotation" status="Not saved" actions={<button form="quotation-form" className="quote-button-primary" type="submit" disabled={!valid || catalogLoading || authLoading || busy !== null}>{busy === 'save' ? 'Saving…' : 'Save'}</button>} />
      <form id="quotation-form" className="no-print desk-form-grid" onSubmit={event => { event.preventDefault(); void perform('save'); }}>
        <fieldset disabled={catalogLoading || authLoading || busy !== null} className="min-w-0 space-y-5">
          <div className="quote-panel overflow-hidden"><div className="desk-tabs"><span className="active">Details</span></div><div className="space-y-5 p-5 sm:p-6"><h2 className="desk-section-heading">Customer and Project</h2>
            <div><label className="quote-label" htmlFor="quote-system">Knauf System</label><select id="quote-system" className="quote-input" value={system.code} onChange={event => { const next = systems.find(item => item.code === event.target.value)!; setSystem(next); setIncludeDeflection(next.supportsDeflection); setCustomItems({}); }}>
              {Object.entries(categories).map(([category, label]) => <optgroup key={category} label={label}>{systems.filter(item => item.category === category).map(item => <option key={item.code} value={item.code}>{item.code} — {item.name.replace(/^KNAUF SYSTEM\s*/i, '')}</option>)}</optgroup>)}
            </select><p className="mt-2 text-sm leading-relaxed text-slate-500">{system.description}</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="quote-label" htmlFor="project-name">Project <span className="text-red-500">*</span></label><input id="project-name" className="quote-input" placeholder="e.g. Dubai office fitout" required value={meta.projectName} onChange={event => setMeta(previous => ({ ...previous, projectName: event.target.value }))} /></div>
              <div><label className="quote-label" htmlFor="client-name">Customer <span className="text-red-500">*</span></label><input id="client-name" className="quote-input" placeholder="Company or customer name" required value={meta.clientName} onChange={event => setMeta(previous => ({ ...previous, clientName: event.target.value }))} /></div>
            </div>
            <div className="max-w-xs"><label className="quote-label" htmlFor="project-area">Area (m²) <span className="text-red-500">*</span></label><input id="project-area" className="quote-input" type="number" min="0.001" step="any" required value={scale || ''} onChange={event => setScale(Number(event.target.value))} /><p className="mt-2 text-sm text-slate-500">Total wall or ceiling area.</p></div>
            {system.supportsDeflection && <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4"><input className="mt-1 h-4 w-4 accent-[#00488e]" type="checkbox" checked={includeDeflection} onChange={event => setIncludeDeflection(event.target.checked)} /><span><span className="block text-sm font-medium">Include head deflection</span><span className="text-sm text-slate-500">Additional materials for movement at the top of the wall.</span></span></label>}
          </div></div>
          <details className="quote-panel desk-form-details group"><summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium">Additional Details <ChevronDown size={16} className="transition-transform group-open:rotate-180" /></summary><div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
            <div><label htmlFor="quote-reference" className="quote-label">Quotation ID</label><input id="quote-reference" className="quote-input" value={meta.quoteNumber} onChange={event => setMeta(previous => ({ ...previous, quoteNumber: event.target.value }))} /></div>
            <div><label htmlFor="salesperson" className="quote-label">Sales Person</label><input id="salesperson" className="quote-input" value={meta.salesman} placeholder={user?.name || 'Sales team'} onChange={event => setMeta(previous => ({ ...previous, salesman: event.target.value }))} /></div>
            <div><label htmlFor="quote-status" className="quote-label">Status</label><select id="quote-status" className="quote-input" value={meta.status} onChange={event => setMeta(previous => ({ ...previous, status: event.target.value as QuoteStatus }))}>{['DRAFT', 'ISSUED', 'APPROVED', 'REVISED', 'CANCELLED'].map(status => <option value={status} key={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>)}</select></div>
          </div></details>
          <details className="quote-panel desk-form-details group"><summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium">{canEditMaterials ? 'Items · Edit quantities and rates' : 'Items'} <ChevronDown size={16} className="transition-transform group-open:rotate-180" /></summary><div className="border-t border-slate-100 p-3"><MaterialGrid baseItems={calculation.baseItems} deflectionItems={calculation.deflectionItems} scaleM2={scale} readOnly={!canEditMaterials} onUpdateBaseItem={(index, changes) => updateItem('base', index, changes)} onUpdateDeflectionItem={(index, changes) => updateItem('deflection', index, changes)} onAddBaseItem={() => setCustomItems(previous => ({ ...previous, base: [...calculation.baseItems, { productName: 'Additional material', factorPerM2: 1, unit: 'pcs', totalQuantity: scale, unitPriceAed: 0, totalPriceAed: 0, isHeadDeflection: false }] }))} onRemoveBaseItem={index => removeItem('base', index)} onRemoveDeflectionItem={index => removeItem('deflection', index)} onResetItems={() => setCustomItems({})} /></div></details>
        </fieldset>
        <aside className="quote-panel space-y-5 p-5">
          <h2 className="desk-section-heading">Totals</h2>
          <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Area</dt><dd>{scale > 0 ? scale.toLocaleString() : '—'} m²</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">System</dt><dd className="font-medium">{system.code}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Base materials</dt><dd>AED {money(calculation.baseTotalAed)}</dd></div>{includeDeflection && <div className="flex justify-between gap-3"><dt className="text-slate-500">Head deflection</dt><dd>AED {money(calculation.deflectionTotalAed)}</dd></div>}</dl>
          <div className="border-y border-slate-200 py-5"><p className="text-sm text-slate-500">Total · excluding VAT</p><p className="mt-1 desk-total-value">AED {money(calculation.grandTotalAed)}</p><p className="mt-2 text-sm text-slate-500">AED {money(calculation.grandRatePerM2)} / m²</p></div>
          {catalogLoading && <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading prices…</p>}
          {catalogNotice && <p role="status" className="text-sm text-amber-800">{catalogNotice}</p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="space-y-2"><button className="quote-button-secondary w-full" type="button" onClick={() => void perform('pdf')} disabled={!valid || catalogLoading || authLoading || busy !== null}>{busy === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF</button></div>
          <div className="flex flex-wrap items-center justify-between gap-3"><button className="quote-text-button" type="button" onClick={() => setPreview(true)} disabled={catalogLoading || authLoading || busy !== null}><Eye size={15} /> Print</button><button className="quote-text-button" type="button" onClick={() => void perform('excel')} disabled={!valid || catalogLoading || authLoading || busy !== null}>{busy === 'excel' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} Excel</button></div>
        </aside>
      </form>
      {preview && <QuotePreview meta={documentMeta} system={system} calculation={calculation} onClose={() => setPreview(false)} />}
    </div>
  );
}

export default function NewQuotePage() {
  return <Suspense fallback={<p className="p-8 text-slate-500">Loading quote…</p>}><NewQuoteContent /></Suspense>;
}
