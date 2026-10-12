'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Printer } from 'lucide-react';
import QuotePreview from '@/components/quotation/QuotePreview';
import SummaryCard from '@/components/quotation/SummaryCard';
import MaterialGrid from '@/components/quotation/MaterialGrid';
import { CalculatedItem, CalculationResult, KnaufSystemDefinition, QuoteMetaData, QuoteStatus } from '@/lib/engine/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { AL_NAMARIQ_TERMS } from '@/lib/exporters/excel-generator';

interface QuoteSnapshot extends Omit<QuoteMetaData, 'date'> {
  id: string;
  scaleM2: number;
  createdAt: string;
  items: CalculatedItem[];
  system: Pick<KnaufSystemDefinition, 'code' | 'name' | 'category' | 'supportsDeflection'>;
}

export default function QuoteDetailPage() {
  const { permissions } = useAuth();
  const params = useParams();

  const id = params?.id as string;

  const [quote, setQuote] = useState<QuoteSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Editable local state
  const [scaleM2, setScaleM2] = useState<number>(1000);
  const [status, setStatus] = useState<QuoteStatus>('DRAFT');
  const [baseItems, setBaseItems] = useState<CalculatedItem[]>([]);
  const [deflectionItems, setDeflectionItems] = useState<CalculatedItem[]>([]);

  useEffect(() => {
    async function loadQuote() {
      try {
        const res = await fetch(`/api/quotes/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data: QuoteSnapshot = await res.json();
        setQuote(data);
        setScaleM2(data.scaleM2);
        setStatus(data.status as QuoteStatus);

        const bItems: CalculatedItem[] = data.items
          .filter(i => !i.isHeadDeflection)
          .map(i => ({
            productName: i.productName,
            factorPerM2: i.factorPerM2,
            unit: i.unit,
            totalQuantity: i.totalQuantity,
            unitPriceAed: i.unitPriceAed,
            totalPriceAed: i.totalPriceAed,
            isHeadDeflection: false,
          }));

        const dItems: CalculatedItem[] = data.items
          .filter(i => i.isHeadDeflection)
          .map(i => ({
            productName: i.productName,
            factorPerM2: i.factorPerM2,
            unit: i.unit,
            totalQuantity: i.totalQuantity,
            unitPriceAed: i.unitPriceAed,
            totalPriceAed: i.totalPriceAed,
            isHeadDeflection: true,
          }));

        setBaseItems(bItems);
        setDeflectionItems(dItems);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadQuote();
  }, [id]);

  // Recalculate helper
  const recalculate = (
    currentBase: CalculatedItem[],
    currentDef: CalculatedItem[],
    currentScale: number
  ) => {
    const safeScale = currentScale > 0 ? currentScale : 1;

    const updatedBase = currentBase.map((it) => {
      const totalQuantity = Number((safeScale * it.factorPerM2).toFixed(3));
      const totalPriceAed = Number((totalQuantity * it.unitPriceAed).toFixed(2));
      return { ...it, totalQuantity, totalPriceAed };
    });

    const updatedDef = currentDef.map((it) => {
      const totalQuantity = Number((safeScale * it.factorPerM2).toFixed(3));
      const totalPriceAed = Number((totalQuantity * it.unitPriceAed).toFixed(2));
      return { ...it, totalQuantity, totalPriceAed };
    });

    setBaseItems(updatedBase);
    setDeflectionItems(updatedDef);
  };

  const handleUpdateBaseItem = (idx: number, updated: Partial<CalculatedItem>) => {
    const next = [...baseItems];
    next[idx] = { ...next[idx], ...updated };
    recalculate(next, deflectionItems, scaleM2);
  };

  const handleUpdateDeflectionItem = (idx: number, updated: Partial<CalculatedItem>) => {
    const next = [...deflectionItems];
    next[idx] = { ...next[idx], ...updated };
    recalculate(baseItems, next, scaleM2);
  };

  const handleAddBaseItem = () => {
    const newItem: CalculatedItem = {
      productName: 'Additional Specification Item',
      factorPerM2: 1.0,
      unit: 'pcs',
      totalQuantity: scaleM2,
      unitPriceAed: 10.0,
      totalPriceAed: scaleM2 * 10.0,
      isHeadDeflection: false,
    };
    recalculate([...baseItems, newItem], deflectionItems, scaleM2);
  };

  const handleRemoveBaseItem = (idx: number) => {
    const next = baseItems.filter((_, i) => i !== idx);
    recalculate(next, deflectionItems, scaleM2);
  };

  const handleRemoveDeflectionItem = (idx: number) => {
    const next = deflectionItems.filter((_, i) => i !== idx);
    recalculate(baseItems, next, scaleM2);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const safeScale = scaleM2 > 0 ? scaleM2 : 1;
      const baseTotalAed = Number(
        baseItems.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
      );
      const baseRatePerM2 = Number((baseTotalAed / safeScale).toFixed(2));

      const deflectionTotalAed = Number(
        deflectionItems.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
      );
      const deflectionRatePerM2 = Number((deflectionTotalAed / safeScale).toFixed(2));

      const grandTotalAed = Number((baseTotalAed + deflectionTotalAed).toFixed(2));
      const grandRatePerM2 = Number((grandTotalAed / safeScale).toFixed(2));

      const calculation: CalculationResult = {
        scaleM2: safeScale,
        baseItems,
        deflectionItems,
        baseTotalAed,
        baseRatePerM2,
        deflectionTotalAed,
        deflectionRatePerM2,
        grandTotalAed,
        grandRatePerM2,
      };

      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(permissions?.canEditQuoteItems !== false ? { calculation, scaleM2 } : {}),
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setQuote(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading quotation...</div>;
  }

  if (!quote) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-bold text-slate-700">Quotation not found</p>
        <Link href="/quotes" className="mt-2 inline-block text-xs text-[#00488e] underline">
          &larr; Back to all quotations
        </Link>
      </div>
    );
  }

  const safeScale = scaleM2 > 0 ? scaleM2 : 1;
  const baseTotalAed = Number(
    baseItems.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
  );
  const baseRatePerM2 = Number((baseTotalAed / safeScale).toFixed(2));

  const deflectionTotalAed = Number(
    deflectionItems.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
  );
  const deflectionRatePerM2 = Number((deflectionTotalAed / safeScale).toFixed(2));

  const grandTotalAed = Number((baseTotalAed + deflectionTotalAed).toFixed(2));
  const grandRatePerM2 = Number((grandTotalAed / safeScale).toFixed(2));

  const currentCalc: CalculationResult = {
    scaleM2: safeScale,
    baseItems,
    deflectionItems,
    baseTotalAed,
    baseRatePerM2,
    deflectionTotalAed,
    deflectionRatePerM2,
    grandTotalAed,
    grandRatePerM2,
  };

  const meta: QuoteMetaData = {
    quoteNumber: quote.quoteNumber,
    projectName: quote.projectName,
    clientName: quote.clientName,
    salesman: quote.salesman,
    date: new Date(quote.createdAt).toLocaleDateString('en-GB'),
    status,
  };

  const systemDef: KnaufSystemDefinition = {
    code: quote.system?.code || 'CUSTOM',
    name: quote.system?.name || 'Custom Knauf Assembly',
    category: quote.system?.category || 'PARTITION',
    supportsDeflection: quote.system?.supportsDeflection || false,
    baseMaterials: baseItems.map((b) => ({
      productName: b.productName,
      factorPerM2: b.factorPerM2,
      unit: b.unit,
    })),
  };

  return <div className="space-y-6">
    <PageHeader title={quote.quoteNumber} status={status} subtitle={`${quote.clientName} · ${quote.projectName}`} actions={<><button className="quote-button-secondary" onClick={() => setShowPrintModal(true)}><Printer size={14} /> Print</button><a className="quote-button-secondary" href={`/api/quotes/${quote.id}/pdf?download=true`} download>PDF</a><a className="quote-button-secondary" href={`/api/quotes/${quote.id}/export`} download>Excel</a>{permissions?.canEditQuoteMeta !== false && <button className="quote-button-primary" disabled={isSaving || !Number.isFinite(scaleM2) || scaleM2 <= 0} onClick={handleSaveChanges}>{isSaving ? 'Saving…' : 'Save'}</button>}</>} />    {saveSuccess && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Changes saved.</p>}
    <div className="desk-form-grid"><div className="min-w-0 space-y-5">
      <div className="quote-panel space-y-5 p-6"><h2 className="desk-section-heading">Quotation Details</h2><div className="grid gap-5 sm:grid-cols-2"><div><p className="quote-label">Customer</p><p className="text-sm">{quote.clientName}</p></div><div><p className="quote-label">Project</p><p className="text-sm">{quote.projectName}</p></div></div><div><p className="quote-label">Knauf system</p><p className="text-sm text-slate-600">{quote.system?.code} — {quote.system?.name}</p></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="saved-area" className="quote-label">Area (m²)</label><input id="saved-area" className="quote-input" type="number" min="0.001" step="any" disabled={permissions?.canEditQuoteItems === false} value={scaleM2 || ''} onChange={event => { const area = Number(event.target.value); setScaleM2(area); recalculate(baseItems, deflectionItems, area); }} /></div><div><label htmlFor="saved-status" className="quote-label">Status</label><select id="saved-status" className="quote-input" value={status} disabled={permissions?.canEditQuoteMeta === false} onChange={event => setStatus(event.target.value as QuoteStatus)}>{['DRAFT', 'ISSUED', 'APPROVED', 'REVISED', 'CANCELLED'].map(value => <option key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}</select></div></div>
        <p className="text-xs text-slate-500">Save changes before downloading the updated PDF or Excel file.</p>
      </div>
      <details className="quote-panel desk-form-details"><summary className="cursor-pointer p-5 text-sm font-medium">{permissions?.canEditQuoteItems === false ? 'Items' : 'Items · Edit quantities and rates'}</summary><div className="border-t border-slate-100 p-3"><MaterialGrid baseItems={baseItems} deflectionItems={deflectionItems} scaleM2={scaleM2} readOnly={permissions?.canEditQuoteItems === false} onUpdateBaseItem={handleUpdateBaseItem} onUpdateDeflectionItem={handleUpdateDeflectionItem} onAddBaseItem={handleAddBaseItem} onRemoveBaseItem={handleRemoveBaseItem} onRemoveDeflectionItem={handleRemoveDeflectionItem} onResetItems={() => recalculate(quote.items.filter((item: CalculatedItem) => !item.isHeadDeflection), quote.items.filter((item: CalculatedItem) => item.isHeadDeflection), scaleM2)} /></div></details>
      <details className="quote-panel desk-form-details"><summary className="cursor-pointer p-5 text-sm font-medium">Terms and conditions</summary><ol className="list-decimal space-y-2 border-t border-slate-100 p-5 pl-10 text-sm leading-relaxed text-slate-600">{AL_NAMARIQ_TERMS.map(term => <li key={term}>{term}</li>)}</ol></details>
    </div><SummaryCard calculation={currentCalc} systemName={quote.system?.name || 'Knauf system'} projectName={quote.projectName} hasDeflection={deflectionItems.length > 0} /></div>
    {showPrintModal && <QuotePreview meta={meta} system={systemDef} calculation={currentCalc} onClose={() => setShowPrintModal(false)} />}
  </div>;
}
