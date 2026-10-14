'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Download, Eye, FileSpreadsheet, Loader2 } from 'lucide-react';
import systemsData from '@/data/knauf-systems.json';
import defaultPrices from '@/data/default-prices.json';
import { calculateQuotation, emptyCalculation } from '@/lib/engine/calculator';
import type { CalculatedItem, KnaufSystemDefinition, QuoteMetaData, QuoteStatus, SystemCategory } from '@/lib/engine/types';
import { useAuth } from '@/lib/auth/AuthContext';
import SystemIllustration from '@/components/quotation/SystemIllustration';
import MaterialGrid from '@/components/quotation/MaterialGrid';
import QuotePreview from '@/components/quotation/QuotePreview';
import PageHeader from '@/components/layout/PageHeader';
import ExportChecklist from '@/components/quotation/ExportChecklist';
import { browserDraftKey, parseBrowserDraft, duplicateQuotation } from '@/lib/quotation/drafts';
import { getTechnicalInputs } from '@/lib/engine/reference';
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
  const [technicalParameters, setTechnicalParameters] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<{ base?: CalculatedItem[]; deflection?: CalculatedItem[] }>({});
  const [meta, setMeta] = useState<QuoteMetaData>({ quoteNumber: '', projectName: '', clientName: '', salesman: '', date: '', status: 'DRAFT' });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(true);
  const [busy, setBusy] = useState<'save' | 'pdf' | 'excel' | null>(null);
  const [error, setError] = useState('');
  const [catalogNotice, setCatalogNotice] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const [draftNotice, setDraftNotice] = useState('');
  const saved = useRef(false);
  const duplicateId = searchParams.get('duplicate');
  const draftKey = user ? browserDraftKey(user.id, duplicateId) : '';
  const calculated = useMemo(() => {
    if (!Number.isFinite(scale) || scale <= 0) return { calculation: emptyCalculation(), problem: 'Enter an area greater than zero.' };
    try { return { calculation: calculateQuotation(system, scale, prices, includeDeflection, customItems, technicalParameters), problem: '' }; }
    catch (error) { return { calculation: emptyCalculation(), problem: error instanceof Error ? error.message : 'Check technical settings.' }; }
  }, [system, scale, prices, includeDeflection, customItems, technicalParameters]);
  const calculation = calculated.calculation;
  const editableDeflection = useMemo(() => {
    try { return calculateQuotation(system, scale, prices, true, customItems, technicalParameters).deflectionItems; }
    catch { return []; }
  }, [system, scale, prices, customItems, technicalParameters]);
  const missingRates = [...calculation.baseItems, ...calculation.deflectionItems].filter(item => item.totalQuantity > 0 && item.unitPriceAed <= 0);  const canEditMaterials = permissions?.canEditQuoteItems !== false;
  const valid = meta.projectName.trim() && meta.clientName.trim() && meta.quoteNumber.trim() && Number.isFinite(scale) && scale > 0 && !calculated.problem && calculation.baseItems.length + calculation.deflectionItems.length > 0;

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


  useEffect(() => {
    if (catalogLoading || !draftKey || draftReady) return;
    let cancelled = false;
    async function restore() {
      try {
        if (duplicateId && !localStorage.getItem(draftKey)) {
          const response = await fetch('/api/quotes/' + encodeURIComponent(duplicateId));
          if (!response.ok) throw new Error('Could not copy this quotation.');
          const source = await response.json();
          if (cancelled) return;
          if (source.calculationVersion === 'legacy') throw new Error('Rebuild the original using the workbook model before duplicating it.');
          const selected = systems.find(item => item.code === source.system?.code);
          if (!selected || !Array.isArray(source.items)) throw new Error('The quotation system could not be copied.');
          setSystem(selected); setScale(source.scaleM2); setIncludeDeflection(source.includeDeflection);
          setTechnicalParameters(JSON.parse(source.technicalParameters || '{}'));
          const copy = duplicateQuotation(source, { quoteNumber: 'ANM-' + new Date().getFullYear() + '-' + crypto.randomUUID().slice(0, 6).toUpperCase(), date: new Date().toLocaleDateString('en-GB'), clientName: '', projectName: '', salesman: '', status: 'DRAFT' });
          setCustomItems(copy.customItems); setMeta(copy.meta);
          setDraftNotice('Quotation copied. Review the customer, quantities and rates before saving.');
        } else {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const draft = parseBrowserDraft(raw);
            const selected = systems.find(item => item.code === draft.systemCode);
            if (draft.version !== 1 || !selected || !draft.meta || typeof draft.meta.projectName !== 'string' || typeof draft.meta.clientName !== 'string' || typeof draft.meta.quoteNumber !== 'string' || !Number.isFinite(draft.scale) || !draft.prices || !draft.customItems || !draft.technicalParameters) throw new Error('The browser draft could not be restored.');
            if (cancelled) return;
            setSystem(selected); setScale(draft.scale); setIncludeDeflection(Boolean(draft.includeDeflection && selected.supportsDeflection));
            setPrices(draft.prices); setTechnicalParameters(draft.technicalParameters); setCustomItems(draft.customItems); setMeta(draft.meta);
            setDraftNotice('Your unfinished quotation was restored from this browser.');
          }
        }
      } catch (failure) { if (!cancelled) setError(failure instanceof Error ? failure.message : 'Could not restore the draft.'); }
      finally { if (!cancelled) setDraftReady(true); }
    }
    void restore();
    return () => { cancelled = true; };
  }, [catalogLoading, draftKey, draftReady, duplicateId]);

  useEffect(() => {
    if (!draftReady || !draftKey || saved.current || permissions?.canCreateQuote !== true) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ version: 1, systemCode: system.code, scale, includeDeflection, prices, technicalParameters, customItems, meta }));
    } catch { queueMicrotask(() => setDraftNotice('Browser draft saving is unavailable. Use Save to keep this quotation.')); }
  }, [draftReady, draftKey, system, scale, includeDeflection, prices, technicalParameters, customItems, meta, permissions]);

  const documentMeta = { ...meta, projectName: meta.projectName.trim(), clientName: meta.clientName.trim(), salesman: meta.salesman || user?.name || 'Sales team' };
  const updateItem = (section: 'base' | 'deflection', index: number, changes: Partial<CalculatedItem>) => {
    const items = section === 'base' ? calculation.baseItems : editableDeflection;
    if (changes.unitPriceAed !== undefined) setPrices(previous => ({ ...previous, [items[index].productName]: changes.unitPriceAed! }));
    setCustomItems(previous => ({ ...previous, [section]: items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes, factorOverridden: changes.factorPerM2 !== undefined ? true : item.factorOverridden } : item) }));
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
    if (!draftReady || !valid) { setError('Enter the project, client, and an area greater than zero.'); return; }
    if (missingRates.length && (action !== 'save' || meta.status !== 'DRAFT')) { setError('Enter a rate for every item before exporting or issuing. You can save an unpriced draft.'); return; }
    setBusy(action); setError('');
    try {
      if (action === 'save') {
        const response = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...documentMeta, scaleM2: scale, systemCode: system.code, includeDeflection, technicalParameters, calculation, termsAndConditions: AL_NAMARIQ_TERMS }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not save this quote. Try again.');
        saved.current = true;
        try { localStorage.removeItem(draftKey); } catch { /* Server save succeeded. */ }
        router.push(`/quotes/${result.id}`);
      } else if (action === 'pdf') {
        const response = await fetch('/api/quotes/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meta: documentMeta, system, calculation, download: true }) });
        if (!response.ok) { const failure = await response.json(); throw new Error(failure.error || 'Could not download the PDF. Try again.'); }
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
      <PageHeader title="New Quotation" status="Not saved" actions={<button form="quotation-form" className="quote-button-primary" type="submit" disabled={!draftReady || !valid || catalogLoading || authLoading || busy !== null}>{busy === 'save' ? 'Saving…' : 'Save'}</button>} />
      <div className="quote-panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><p role="status">{draftNotice || (draftReady ? 'Draft saved automatically in this browser. Use Save to add it to Quotations.' : 'Preparing your draft…')}</p><button type="button" className="quote-text-button" disabled={!draftReady || busy !== null} onClick={() => { if (!confirm(duplicateId ? 'Discard this copied draft and return to your new quotation?' : 'Discard this browser draft and start a new quotation?')) return; try { localStorage.removeItem(draftKey); } catch { setError('Could not discard the browser draft.'); return; } saved.current = true; // Reload clears all component state after discarding the draft.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign('/quotes/new'); }}>{duplicateId ? 'Discard copy' : 'Start fresh'}</button></div>
      <form id="quotation-form" className="no-print desk-form-grid" onSubmit={event => { event.preventDefault(); void perform('save'); }}>
        <fieldset disabled={catalogLoading || authLoading || !draftReady || busy !== null} className="min-w-0 space-y-5">
          <div className="quote-panel overflow-hidden"><div className="desk-tabs"><span className="active">Details</span></div><div className="space-y-5 p-5 sm:p-6"><h2 className="desk-section-heading">Customer and Project</h2>
            <div><label className="quote-label" htmlFor="quote-system">Knauf System</label><select id="quote-system" className="quote-input" value={system.code} onChange={event => { const next = systems.find(item => item.code === event.target.value)!; setSystem(next); setIncludeDeflection(next.supportsDeflection); setCustomItems({}); setTechnicalParameters({}); }}>
              {Object.entries(categories).map(([category, label]) => <optgroup key={category} label={label}>{systems.filter(item => item.category === category).map(item => <option key={item.code} value={item.code}>{item.code} — {item.name.replace(/^KNAUF SYSTEM\s*/i, '')}</option>)}</optgroup>)}
            </select><p className="mt-2 text-sm leading-relaxed text-slate-500">{system.description}</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="quote-label" htmlFor="project-name">Project <span className="text-red-500">*</span></label><input id="project-name" className="quote-input" placeholder="e.g. Dubai office fitout" required value={meta.projectName} onChange={event => setMeta(previous => ({ ...previous, projectName: event.target.value }))} /></div>
              <div><label className="quote-label" htmlFor="client-name">Customer <span className="text-red-500">*</span></label><input id="client-name" className="quote-input" placeholder="Company or customer name" required value={meta.clientName} onChange={event => setMeta(previous => ({ ...previous, clientName: event.target.value }))} /></div>
            </div>
            <div className="max-w-xs"><label className="quote-label" htmlFor="project-area">Area (m²) <span className="text-red-500">*</span></label><input id="project-area" className="quote-input" type="number" min="0.001" step="any" required value={scale || ''} onChange={event => setScale(Number(event.target.value))} /><p className="mt-2 text-sm text-slate-500">Total wall or ceiling area.</p></div>
            {system.supportsDeflection && <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4"><input className="mt-1 h-4 w-4 accent-[#00488e]" type="checkbox" checked={includeDeflection} onChange={event => { setIncludeDeflection(event.target.checked); setCustomItems(previous => ({ ...previous, base: undefined })); }} /><span><span className="block text-sm font-medium">Include head deflection</span><span className="text-sm text-slate-500">Additional materials for movement at the top of the wall.</span></span></label>}
          </div></div>
          <details className="quote-panel desk-form-details group"><summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium">Additional Details <ChevronDown size={16} className="transition-transform group-open:rotate-180" /></summary><div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
            <div><label htmlFor="quote-reference" className="quote-label">Quotation ID</label><input id="quote-reference" className="quote-input" value={meta.quoteNumber} onChange={event => setMeta(previous => ({ ...previous, quoteNumber: event.target.value }))} /></div>
            <div><label htmlFor="salesperson" className="quote-label">Sales Person</label><input id="salesperson" className="quote-input" value={meta.salesman} placeholder={user?.name || 'Sales team'} onChange={event => setMeta(previous => ({ ...previous, salesman: event.target.value }))} /></div>
            <div><label htmlFor="quote-status" className="quote-label">Status</label><select id="quote-status" className="quote-input" value={meta.status} onChange={event => setMeta(previous => ({ ...previous, status: event.target.value as QuoteStatus }))}>{['DRAFT', 'ISSUED', 'APPROVED', 'REVISED', 'CANCELLED'].map(status => <option value={status} key={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>)}</select></div>
          </div></details>
          <SystemIllustration code={system.code} includeDeflection={includeDeflection} />
          {getTechnicalInputs(system.code, includeDeflection).length > 0 && <details className="quote-panel desk-form-details"><summary className="cursor-pointer">Technical Settings · Height and spacing</summary><div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">{getTechnicalInputs(system.code, includeDeflection).map(input => <div key={input.key}><label htmlFor={`technical-${input.key}`} className="quote-label">{input.label}</label><input id={`technical-${input.key}`} className="quote-input" type="number" min="0.001" step="any" value={technicalParameters[input.key] ?? input.defaultValue} onChange={event => setTechnicalParameters(previous => ({ ...previous, [input.key]: Number(event.target.value) }))} /></div>)}</div></details>}
          <details id="quotation-items" tabIndex={-1} open={itemsOpen} onToggle={event => setItemsOpen(event.currentTarget.open)} className="quote-panel desk-form-details group"><summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium">{canEditMaterials ? 'Items · Enter quotation rates' : 'Items'} <ChevronDown size={16} className="transition-transform group-open:rotate-180" /></summary><div className="border-t border-slate-100 p-3"><MaterialGrid baseItems={calculation.baseItems} deflectionItems={calculation.deflectionItems} scaleM2={scale} readOnly={permissions?.canCreateQuote === false} ratesOnly={!canEditMaterials} onUpdateBaseItem={(index, changes) => updateItem('base', index, changes)} onUpdateDeflectionItem={(index, changes) => updateItem('deflection', index, changes)} onAddBaseItem={() => setCustomItems(previous => ({ ...previous, base: [...calculation.baseItems, { productName: 'Additional material', factorPerM2: 1, unit: 'pcs', totalQuantity: scale, unitPriceAed: 0, totalPriceAed: 0, isHeadDeflection: false, factorOverridden: true }] }))} onRemoveBaseItem={index => removeItem('base', index)} onRemoveDeflectionItem={index => removeItem('deflection', index)} onResetItems={() => setCustomItems({})} /></div></details>
        </fieldset>
        <aside className="quote-panel space-y-5 p-5">
          <h2 className="desk-section-heading">Totals</h2><ExportChecklist meta={documentMeta} area={scale} items={[...calculation.baseItems, ...calculation.deflectionItems]} problem={calculated.problem}/>
          <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Area</dt><dd>{scale > 0 ? scale.toLocaleString() : '—'} m²</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">System</dt><dd className="font-medium">{system.code}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Base materials</dt><dd>AED {money(calculation.baseTotalAed)}</dd></div>{includeDeflection && <div className="flex justify-between gap-3"><dt className="text-slate-500">Head deflection</dt><dd>AED {money(calculation.deflectionTotalAed)}</dd></div>}</dl>
          <div className="border-y border-slate-200 py-5"><p className="text-sm text-slate-500">Total · excluding VAT</p><p className="mt-1 desk-total-value">AED {money(calculation.grandTotalAed)}</p><p className="mt-2 text-sm text-slate-500">AED {money(calculation.grandRatePerM2)} / m²</p></div>
          {catalogLoading && <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading prices…</p>}
          {catalogNotice && <p role="status" className="text-sm text-amber-800">{catalogNotice}</p>}
          {calculated.problem && <p role="alert" className="text-sm text-red-700">{calculated.problem}</p>}{missingRates.length > 0 && <p role="status" className="rounded bg-amber-50 p-3 text-sm text-amber-800">Rate required for {missingRates.length} items. Enter rates in the Items table. Unpriced drafts can be saved.</p>}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="space-y-2"><button className="quote-button-secondary w-full" type="button" onClick={() => void perform('pdf')} disabled={!draftReady || !valid || catalogLoading || authLoading || busy !== null}>{busy === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF</button></div>
          <div className="flex flex-wrap items-center justify-between gap-3"><button className="quote-text-button" type="button" onClick={() => { if (!valid || missingRates.length) { setError('Complete the export checklist before printing.'); return; } setPreview(true); }} disabled={!draftReady || catalogLoading || authLoading || busy !== null}><Eye size={15} /> Print</button><button className="quote-text-button" type="button" onClick={() => void perform('excel')} disabled={!draftReady || !valid || catalogLoading || authLoading || busy !== null}>{busy === 'excel' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} Excel</button></div>
        </aside>

      </form>
      {preview && <QuotePreview meta={documentMeta} system={system} calculation={calculation} onClose={() => setPreview(false)} />}
    </div>
  );
}

export default function NewQuotePage() {
  return <Suspense fallback={<p className="p-8 text-slate-500">Loading quote…</p>}><NewQuoteContent /></Suspense>;
}
