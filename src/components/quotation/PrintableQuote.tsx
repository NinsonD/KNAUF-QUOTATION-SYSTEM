'use client';

import React from 'react';
import { CalculationResult, QuoteMetaData, KnaufSystemDefinition } from '@/lib/engine/types';
import { AL_NAMARIQ_TERMS } from '@/lib/exporters/excel-generator';

interface PrintableQuoteProps {
  meta: QuoteMetaData;
  system: KnaufSystemDefinition;
  calculation: CalculationResult;
}

export default function PrintableQuote({
  meta,
  system,
  calculation,
}: PrintableQuoteProps) {
  const {
    scaleM2,
    baseItems,
    deflectionItems,
    baseTotalAed,
    baseRatePerM2,
    deflectionTotalAed,
    deflectionRatePerM2,
    grandTotalAed,
    grandRatePerM2,
  } = calculation;

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto text-xs font-sans shadow-lg print:shadow-none print:p-0 print:max-w-none">
      {/* Corporate Header */}
      <div className="border-b-2 border-[#002060] pb-4 mb-4 text-center">
        <div className="flex justify-center mb-2">
          <img src="/logo/logo.png" alt="Al Namariq Logo" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-[#002060]">
          Al Namariq Building Material Trading Co. LLC
        </h1>
        <p className="text-xs text-slate-600 italic mt-0.5">
          P.O. 25569, Sharjah, United Arab Emirates • Phone: (06) 5328033 • Fax: (06) 5328302
        </p>
        <div className="mt-3 inline-block px-8 py-1 bg-slate-100 border border-slate-300 font-bold text-sm tracking-wider uppercase text-slate-900">
          Official Quotation
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-5 p-3 bg-slate-50 border border-slate-200 text-xs">
        <div>
          <span className="font-bold text-slate-800">Project Name: </span>
          <span className="text-slate-900">{meta.projectName || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-800">Client: </span>
          <span className="text-slate-900">{meta.clientName || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-800">Product Specified: </span>
          <span className="text-slate-900 font-medium">{system.name}</span>
        </div>
        <div>
          <span className="font-bold text-slate-800">Scale of Project: </span>
          <span className="text-slate-900 font-mono font-bold">{scaleM2.toLocaleString()} M²</span>
        </div>
        <div>
          <span className="font-bold text-slate-800">Salesman: </span>
          <span className="text-slate-900">{meta.salesman || 'Ram'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-800">QTN No: </span>
          <span className="text-slate-900 font-mono font-bold">{meta.quoteNumber || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-800">Date: </span>
          <span className="text-slate-900">{meta.date || new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <div>
          <span className="font-bold text-slate-800">Status: </span>
          <span className="font-bold uppercase text-[#002060]">{meta.status || 'DRAFT'}</span>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-slate-300 mb-4 text-[11px]">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
            <th className="border border-slate-300 p-2 text-left">PRODUCT NAME</th>
            <th className="border border-slate-300 p-2 text-right w-24">REQ. / 1 M²</th>
            <th className="border border-slate-300 p-2 text-center w-14">UNIT</th>
            <th className="border border-slate-300 p-2 text-right w-24">PROJECT QTY</th>
            <th className="border border-slate-300 p-2 text-right w-24">PRICE (AED)</th>
            <th className="border border-slate-300 p-2 text-right w-28">TOTAL (AED)</th>
          </tr>
        </thead>
        <tbody>
          {baseItems.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="border border-slate-300 p-1.5 font-medium">{item.productName}</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{item.factorPerM2.toFixed(4)}</td>
              <td className="border border-slate-300 p-1.5 text-center font-mono">{item.unit}</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono font-semibold">
                {item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
              </td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">
                {item.unitPriceAed.toFixed(3)}
              </td>
              <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                {item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}

          {/* Base Subtotals */}
          <tr className="bg-slate-50 font-bold">
            <td colSpan={4} className="border border-slate-300 p-2 text-right">
              BASE ASSEMBLY TOTAL (AED):
            </td>
            <td className="border border-slate-300 p-2 text-right font-mono">RATE / m²:</td>
            <td className="border border-slate-300 p-2 text-right font-mono text-xs">
              AED {baseTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr className="bg-slate-50 font-bold border-b-2 border-slate-400">
            <td colSpan={4} className="border border-slate-300 p-1.5 text-right text-slate-600">
              Base Rate Per M²:
            </td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-right font-mono">
              AED {baseRatePerM2.toFixed(2)} / M²
            </td>
          </tr>

          {/* Deflection Section if present */}
          {deflectionItems.length > 0 && (
            <>
              <tr className="bg-emerald-50 text-emerald-950 font-bold">
                <td colSpan={6} className="border border-slate-300 p-2 italic">
                  Head Deflection Components (Structural Movement Accommodation)
                </td>
              </tr>
              {deflectionItems.map((item, idx) => (
                <tr key={`def-${idx}`} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-medium">{item.productName}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">{item.factorPerM2.toFixed(4)}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono">{item.unit}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono font-semibold">
                    {item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">
                    {item.unitPriceAed.toFixed(3)}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                    {item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold">
                <td colSpan={4} className="border border-slate-300 p-2 text-right text-emerald-950">
                  DEFLECTION TOTAL (AED):
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-emerald-900">DEF. RATE:</td>
                <td className="border border-slate-300 p-2 text-right font-mono text-emerald-950">
                  AED {deflectionTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="bg-emerald-50 font-bold">
                <td colSpan={4} className="border border-slate-300 p-1.5 text-right text-emerald-800">
                  Deflection Rate Per M²:
                </td>
                <td colSpan={2} className="border border-slate-300 p-1.5 text-right font-mono text-emerald-900">
                  AED {deflectionRatePerM2.toFixed(2)} / M²
                </td>
              </tr>
            </>
          )}

          {/* Grand Totals */}
          <tr className="bg-[#002060] text-white font-bold text-xs">
            <td colSpan={4} className="border border-[#002060] p-2 text-right">
              GRAND TOTAL (AED):
            </td>
            <td className="border border-[#002060] p-2 text-right font-mono text-blue-200">
              GRAND RATE:
            </td>
            <td className="border border-[#002060] p-2 text-right font-mono text-sm text-amber-300">
              AED {grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr className="bg-slate-900 text-white font-bold text-xs">
            <td colSpan={4} className="border border-slate-900 p-1.5 text-right text-slate-300">
              GRAND RATE PER M²:
            </td>
            <td colSpan={2} className="border border-slate-900 p-1.5 text-right font-mono text-amber-300">
              AED {grandRatePerM2.toFixed(2)} / M²
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terms & Conditions */}
      <div className="mt-5 border border-slate-300 p-3 bg-slate-50 text-[10px] leading-relaxed">
        <div className="font-bold text-slate-900 mb-1">Term & Conditions:</div>
        <ol className="list-none space-y-0.5 text-slate-700">
          {AL_NAMARIQ_TERMS.map((term, i) => (
            <li key={i}>{term}</li>
          ))}
        </ol>
      </div>

      {/* Dual Signatures */}
      <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-xs font-bold text-slate-900">
        <div>
          <div className="mb-8">Prepared by:</div>
          <div className="border-t border-slate-400 pt-1 text-slate-500 font-normal">
            Sales Estimator: {meta.salesman || 'Ram'}
          </div>
        </div>
        <div>
          <div className="mb-8">Authorized by:</div>
          <div className="border-t border-slate-400 pt-1 text-slate-500 font-normal">
            Commercial Director / Branch Manager
          </div>
        </div>
      </div>
    </div>
  );
}

