'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, FileSpreadsheet, Loader2 } from 'lucide-react';
import PrintableQuote from '@/components/quotation/PrintableQuote';
import { CalculationResult, KnaufSystemDefinition, QuoteMetaData, CalculatedItem } from '@/lib/engine/types';

export default function DedicatedQuotePrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuote() {
      try {
        const res = await fetch(`/api/quotes/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setQuote(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadQuote();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#00488e]" />
        <p className="text-xs font-bold text-slate-500">Loading official print document...</p>
      </div>
    );
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

  const baseItems: CalculatedItem[] = quote.items
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

  const deflectionItems: CalculatedItem[] = quote.items
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

  const currentCalc: CalculationResult = {
    scaleM2: quote.scaleM2,
    baseItems,
    deflectionItems,
    baseTotalAed: quote.baseTotalAed,
    baseRatePerM2: quote.baseRatePerM2,
    deflectionTotalAed: quote.deflectionTotalAed || 0,
    deflectionRatePerM2: quote.deflectionRatePerM2 || 0,
    grandTotalAed: quote.grandTotalAed,
    grandRatePerM2: quote.grandRatePerM2,
  };

  const meta: QuoteMetaData = {
    quoteNumber: quote.quoteNumber,
    projectName: quote.projectName,
    clientName: quote.clientName,
    salesman: quote.salesman,
    date: new Date(quote.createdAt).toLocaleDateString('en-GB'),
    status: quote.status,
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
    <div className="w-full min-h-screen py-4 print:py-0 print:m-0">
      {/* Top Floating Print Controls (Hidden when printing) */}
      <div className="no-print max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/quotes/${id}`}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to Quotation"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Official Quotation Print View
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              {quote.quoteNumber} • {quote.projectName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/quotes/${id}/export`}
            download
            className="px-4 py-2 text-xs font-bold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Excel</span>
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 text-xs font-bold rounded-full bg-[#00488e] hover:bg-[#003c77] text-white flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print to PDF / Paper</span>
          </button>
        </div>
      </div>

      {/* Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full print:m-0">
        <PrintableQuote
          meta={meta}
          system={systemDef}
          calculation={currentCalc}
        />
      </div>
    </div>
  );
}

