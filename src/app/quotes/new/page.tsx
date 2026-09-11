'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import knaufSystemsData from '@/data/knauf-systems.json';
import defaultPricesData from '@/data/default-prices.json';
import { calculateQuotation } from '@/lib/engine/calculator';
import {
  KnaufSystemDefinition,
  CalculationResult,
  QuoteMetaData,
  CalculatedItem,
} from '@/lib/engine/types';
import SystemSelector from '@/components/quotation/SystemSelector';
import ProjectMetaForm from '@/components/quotation/ProjectMetaForm';
import DeflectionToggle from '@/components/quotation/DeflectionToggle';
import MaterialGrid from '@/components/quotation/MaterialGrid';
import SummaryCard from '@/components/quotation/SummaryCard';
import ExportButtons from '@/components/quotation/ExportButtons';
import PrintableQuote from '@/components/quotation/PrintableQuote';
import { AL_NAMARIQ_TERMS, generateAlNamariqExcel } from '@/lib/exporters/excel-generator';
import { Eye, EyeOff, Sparkles, Loader2, Printer } from 'lucide-react';

function NewQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');

  const systems = knaufSystemsData as unknown as KnaufSystemDefinition[];

  // Find initial system based on query param or default to KW111 (Partition)
  const defaultSys =
    systems.find((s) => (initialCategory ? s.category === initialCategory : s.code === 'KW111')) ||
    systems[0];

  const [selectedSystem, setSelectedSystem] = useState<KnaufSystemDefinition>(defaultSys);
  const [scaleM2, setScaleM2] = useState<number>(1000);
  const [includeDeflection, setIncludeDeflection] = useState<boolean>(defaultSys.supportsDeflection);
  const [prices, setPrices] = useState<Record<string, number>>(defaultPricesData);

  const [meta, setMeta] = useState<QuoteMetaData>({
    quoteNumber: `ANM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    projectName: 'Commercial Office Fitout & Partitions',
    clientName: 'Main Contracting LLC',
    salesman: 'Ram Prasad',
    date: new Date().toLocaleDateString('en-GB'),
    status: 'DRAFT',
  });

  // Items state (can be overridden by user in table)
  const [baseItems, setBaseItems] = useState<CalculatedItem[]>([]);
  const [deflectionItems, setDeflectionItems] = useState<CalculatedItem[]>([]);
  const [calculation, setCalculation] = useState<CalculationResult>({
    scaleM2: 1000,
    baseItems: [],
    deflectionItems: [],
    baseTotalAed: 0,
    baseRatePerM2: 0,
    deflectionTotalAed: 0,
    deflectionRatePerM2: 0,
    grandTotalAed: 0,
    grandRatePerM2: 0,
  });

  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Initialize calculation when system or initial params change
  useEffect(() => {
    const res = calculateQuotation(selectedSystem, scaleM2, prices, includeDeflection);
    setBaseItems(res.baseItems);
    setDeflectionItems(res.deflectionItems);
    setCalculation(res);
  }, [selectedSystem]);

  // Recalculate when scaleM2, includeDeflection, or items change
  const recalculate = (
    currentBase: CalculatedItem[],
    currentDef: CalculatedItem[],
    currentScale: number,
    currentDeflectionActive: boolean
  ) => {
    const safeScale = currentScale > 0 ? currentScale : 1;

    const updatedBase = currentBase.map((it) => {
      const totalQuantity = Number((safeScale * it.factorPerM2).toFixed(3));
      const totalPriceAed = Number((totalQuantity * it.unitPriceAed).toFixed(2));
      return { ...it, totalQuantity, totalPriceAed };
    });

    const baseTotalAed = Number(
      updatedBase.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
    );
    const baseRatePerM2 = Number((baseTotalAed / safeScale).toFixed(2));

    let updatedDef: CalculatedItem[] = [];
    let deflectionTotalAed = 0;
    let deflectionRatePerM2 = 0;

    if (currentDeflectionActive && selectedSystem.supportsDeflection) {
      updatedDef = currentDef.map((it) => {
        const totalQuantity = Number((safeScale * it.factorPerM2).toFixed(3));
        const totalPriceAed = Number((totalQuantity * it.unitPriceAed).toFixed(2));
        return { ...it, totalQuantity, totalPriceAed, isHeadDeflection: true };
      });
      deflectionTotalAed = Number(
        updatedDef.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
      );
      deflectionRatePerM2 = Number((deflectionTotalAed / safeScale).toFixed(2));
    }

    const grandTotalAed = Number((baseTotalAed + deflectionTotalAed).toFixed(2));
    const grandRatePerM2 = Number((grandTotalAed / safeScale).toFixed(2));

    setBaseItems(updatedBase);
    setDeflectionItems(updatedDef);
    setCalculation({
      scaleM2: safeScale,
      baseItems: updatedBase,
      deflectionItems: updatedDef,
      baseTotalAed,
      baseRatePerM2,
      deflectionTotalAed,
      deflectionRatePerM2,
      grandTotalAed,
      grandRatePerM2,
    });
  };

  const handleSystemChange = (sys: KnaufSystemDefinition) => {
    setSelectedSystem(sys);
    setIncludeDeflection(sys.supportsDeflection);
    const res = calculateQuotation(sys, scaleM2, prices, sys.supportsDeflection);
    setBaseItems(res.baseItems);
    setDeflectionItems(res.deflectionItems);
    setCalculation(res);
  };

  const handleScaleChange = (newScale: number) => {
    setScaleM2(newScale);
    recalculate(baseItems, deflectionItems, newScale, includeDeflection);
  };

  const handleDeflectionToggle = (active: boolean) => {
    setIncludeDeflection(active);
    if (active && deflectionItems.length === 0 && selectedSystem.deflectionMaterials) {
      const res = calculateQuotation(selectedSystem, scaleM2, prices, true);
      recalculate(baseItems, res.deflectionItems, scaleM2, true);
    } else {
      recalculate(baseItems, deflectionItems, scaleM2, active);
    }
  };

  const handleUpdateBaseItem = (idx: number, updated: Partial<CalculatedItem>) => {
    const next = [...baseItems];
    next[idx] = { ...next[idx], ...updated };
    recalculate(next, deflectionItems, scaleM2, includeDeflection);
  };

  const handleUpdateDeflectionItem = (idx: number, updated: Partial<CalculatedItem>) => {
    const next = [...deflectionItems];
    next[idx] = { ...next[idx], ...updated };
    recalculate(baseItems, next, scaleM2, includeDeflection);
  };

  const handleAddBaseItem = () => {
    const newItem: CalculatedItem = {
      productName: 'Custom Accessory / Fixing Item',
      factorPerM2: 1.0,
      unit: 'pcs',
      totalQuantity: scaleM2,
      unitPriceAed: 5.0,
      totalPriceAed: scaleM2 * 5.0,
      isHeadDeflection: false,
    };
    const next = [...baseItems, newItem];
    recalculate(next, deflectionItems, scaleM2, includeDeflection);
  };

  const handleRemoveBaseItem = (idx: number) => {
    const next = baseItems.filter((_, i) => i !== idx);
    recalculate(next, deflectionItems, scaleM2, includeDeflection);
  };

  const handleRemoveDeflectionItem = (idx: number) => {
    const next = deflectionItems.filter((_, i) => i !== idx);
    recalculate(baseItems, next, scaleM2, includeDeflection);
  };

  const handleResetToDefaults = () => {
    const res = calculateQuotation(selectedSystem, scaleM2, prices, includeDeflection);
    setBaseItems(res.baseItems);
    setDeflectionItems(res.deflectionItems);
    setCalculation(res);
  };

  const handleSaveQuotation = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        quoteNumber: meta.quoteNumber,
        projectName: meta.projectName,
        clientName: meta.clientName,
        salesman: meta.salesman,
        scaleM2,
        systemCode: selectedSystem.code,
        includeDeflection,
        calculation,
        status: meta.status || 'DRAFT',
        termsAndConditions: AL_NAMARIQ_TERMS,
      };

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save quotation');
      }

      const created = await res.json();
      setSaveSuccess(true);
      setTimeout(() => {
        router.push(`/quotes/${created.id}`);
      }, 800);
    } catch (err: any) {
      alert(`Error saving quotation: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      let logoBuf: ArrayBuffer | undefined;
      try {
        const resp = await fetch('/logo/logo.png');
        if (resp.ok) {
          logoBuf = await resp.arrayBuffer();
        }
      } catch (e) {
        console.warn('Could not fetch logo in browser:', e);
      }

      const buffer = await generateAlNamariqExcel(meta, selectedSystem, calculation, logoBuf);
      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.quoteNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}_Knauf_Quotation.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error generating Excel: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header with Company Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <img src="/logo/logo.png" alt="Al Namariq Logo" className="h-9 w-auto object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Interactive Quotation Studio
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#fff3ec] text-[#f86c29] border border-[#fed7aa]">
                Live Calc
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Build and calculate compliant Knauf assemblies with custom m² consumption factors, commercial rates, and deflection options.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrintModal(!showPrintModal)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {showPrintModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPrintModal ? 'Hide Print View' : 'Preview Official Sheet'}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Hidden in print when modal is active) */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${showPrintModal ? 'no-print' : ''}`}>
        {/* Left Interactive Builder (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: System Selector */}
          <SystemSelector
            systems={systems}
            selectedSystemCode={selectedSystem.code}
            onSelectSystem={handleSystemChange}
          />

          {/* Step 2: Project Metadata */}
          <ProjectMetaForm
            meta={meta}
            scaleM2={scaleM2}
            onChangeMeta={(m) => setMeta((prev) => ({ ...prev, ...m }))}
            onChangeScale={handleScaleChange}
          />

          {/* Head Deflection Switch */}
          <DeflectionToggle
            supportsDeflection={selectedSystem.supportsDeflection}
            includeDeflection={includeDeflection}
            onToggle={handleDeflectionToggle}
            systemName={selectedSystem.name}
          />

          {/* Step 3: Material Grid Matrix */}
          <MaterialGrid
            baseItems={baseItems}
            deflectionItems={deflectionItems}
            scaleM2={scaleM2}
            onUpdateBaseItem={handleUpdateBaseItem}
            onUpdateDeflectionItem={handleUpdateDeflectionItem}
            onAddBaseItem={handleAddBaseItem}
            onRemoveBaseItem={handleRemoveBaseItem}
            onRemoveDeflectionItem={handleRemoveDeflectionItem}
            onResetItems={handleResetToDefaults}
          />

          {/* Bottom Export & Save Action Bar */}
          <ExportButtons
            onSaveQuote={handleSaveQuotation}
            onExportExcel={handleExportExcel}
            onPrintPdf={() => setShowPrintModal(true)}
            isSaving={isSaving}
            isExporting={isExporting}
            saveSuccess={saveSuccess}
          />
        </div>

        {/* Right Sticky Summary (4 cols) */}
        <div className="lg:col-span-4">
          <SummaryCard
            calculation={calculation}
            systemName={selectedSystem.name}
            projectName={meta.projectName}
            hasDeflection={includeDeflection}
          />
        </div>
      </div>

      {/* Print / Official Preview Modal */}
      {showPrintModal && (
        <div className="print-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="print-modal-container bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-200">
            <div className="no-print p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 bg-white/95 backdrop-blur-md z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00488e]/10 text-[#00488e] flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Al Namariq Official Print Preview
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: {meta.quoteNumber || 'ANM-DRAFT'} • {selectedSystem.code}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold rounded-full bg-[#00488e] hover:bg-[#003c77] text-white flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print to PDF / Paper</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8 print:p-0">
              <PrintableQuote
                meta={meta}
                system={selectedSystem}
                calculation={calculation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-[#00488e]" />
        </div>
      }
    >
      <NewQuoteContent />
    </Suspense>
  );
}

