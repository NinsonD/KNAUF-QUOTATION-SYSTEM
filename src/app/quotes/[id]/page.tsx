'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Printer,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Building,
  CheckCircle,
  Clock,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import PrintableQuote from '@/components/quotation/PrintableQuote';
import SummaryCard from '@/components/quotation/SummaryCard';
import MaterialGrid from '@/components/quotation/MaterialGrid';
import { CalculatedItem, CalculationResult, KnaufSystemDefinition, QuoteMetaData, QuoteStatus } from '@/lib/engine/types';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quote, setQuote] = useState<any>(null);
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
        const data = await res.json();
        setQuote(data);
        setScaleM2(data.scaleM2);
        setStatus(data.status as QuoteStatus);

        const bItems: CalculatedItem[] = data.items
          .filter((i: any) => !i.isHeadDeflection)
          .map((i: any) => ({
            productName: i.productName,
            factorPerM2: i.factorPerM2,
            unit: i.unit,
            totalQuantity: i.totalQuantity,
            unitPriceAed: i.unitPriceAed,
            totalPriceAed: i.totalPriceAed,
            isHeadDeflection: false,
          }));

        const dItems: CalculatedItem[] = data.items
          .filter((i: any) => i.isHeadDeflection)
          .map((i: any) => ({
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
          scaleM2,
          status,
          calculation,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setQuote(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message);
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
        <Link href="/quotes" className="mt-2 inline-block text-xs text-[#002060] underline">
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
    category: (quote.system?.category || 'PARTITION') as any,
    supportsDeflection: quote.system?.supportsDeflection || false,
    baseMaterials: baseItems.map((b) => ({
      productName: b.productName,
      factorPerM2: b.factorPerM2,
      unit: b.unit,
    })),
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/quotes"
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
            title="Back to quotes"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                {quote.quoteNumber}
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {quote.system?.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {quote.projectName} • {quote.clientName}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as QuoteStatus)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#002060]"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ISSUED">ISSUED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REVISED">REVISED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            type="button"
            onClick={() => setShowPrintModal(!showPrintModal)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {showPrintModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-600" />}
            {showPrintModal ? 'Hide Print' : 'Preview Official'}
          </button>

          <a
            href={`/api/quotes/${quote.id}/export`}
            download
            className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Excel (.xlsx)
          </a>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-[#002060] hover:bg-[#002060]/90 shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Quotation updated successfully!
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Project Scale modifier */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block sm:inline">Project Scale: </span>
              Modify m² scale to recalculate entire bill of quantities instantly
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.1"
                step="any"
                value={scaleM2}
                onChange={(e) => {
                  const s = parseFloat(e.target.value) || 0;
                  setScaleM2(s);
                  recalculate(baseItems, deflectionItems, s);
                }}
                className="w-32 px-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-amber-300 bg-amber-50/40 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
              />
              <span className="text-xs font-bold text-amber-800">M²</span>
            </div>
          </div>

          {/* Dynamic Table */}
          <MaterialGrid
            baseItems={baseItems}
            deflectionItems={deflectionItems}
            scaleM2={scaleM2}
            onUpdateBaseItem={handleUpdateBaseItem}
            onUpdateDeflectionItem={handleUpdateDeflectionItem}
            onAddBaseItem={handleAddBaseItem}
            onRemoveBaseItem={handleRemoveBaseItem}
            onRemoveDeflectionItem={handleRemoveDeflectionItem}
            onResetItems={() => {}}
          />

          {/* Official Terms Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Al Namariq Standard Terms & Conditions
            </h3>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1 leading-relaxed">
              <li>Above consumption is based on theoretical calculation. The material requirement is based on the standard Knauf system proposed and does not include wastage or overlaps. It is the responsibility of the customer to verify actual quantity against BOQ, final drawings and site conditions before placing orders. Al Namariq will not be liable for any variations required for the project.</li>
              <li>Material will be supplied as per bundle/packaging multiple in full trailer load only.</li>
              <li>Non standard materials leadtime is approx 3-4 weeks upon receipt of confirmed order.</li>
              <li>Merchandise or imported goods will take 6-8 weeks.</li>
              <li>Delivery schedule is a must to plan supply and initiate production.</li>
              <li>The technical proposal for this project will be submitted upon confirmation.</li>
              <li>Standard sales terms & conditions apply.</li>
            </ol>
          </div>
        </div>

        {/* Summary Card (4 cols) */}
        <div className="lg:col-span-4">
          <SummaryCard
            calculation={currentCalc}
            systemName={quote.system?.name || 'Knauf System'}
            projectName={quote.projectName}
            hasDeflection={deflectionItems.length > 0}
          />
        </div>
      </div>

      {/* Official Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200">
            <div className="no-print p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-20">
              <div className="font-bold text-sm text-slate-800">
                Al Namariq Official Print Preview • {quote.quoteNumber}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#002060] text-white hover:bg-[#002060]/90"
                >
                  Print to PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              <PrintableQuote
                meta={meta}
                system={systemDef}
                calculation={currentCalc}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

