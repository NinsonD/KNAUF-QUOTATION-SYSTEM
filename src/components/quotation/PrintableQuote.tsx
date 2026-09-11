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
      {/* Corporate Header with Logo */}
      <div className="border-b-2 border-[#00488e] pb-5 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <img
                src="/logo/logo.png"
                alt="Al Namariq Logo"
                className="h-14 w-auto object-contain max-w-[200px]"
              />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#00488e]">
                Al Namariq Building Material Trading Co. LLC
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5">
                P.O. 25569, Sharjah, United Arab Emirates • Phone: (06) 5328033 • Fax: (06) 5328302
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Official Distributor & Certified Systems Provider
              </p>
            </div>
          </div>

          <div className="text-right sm:self-center">
            <div className="inline-block px-5 py-1.5 bg-[#00488e] text-white font-black text-xs tracking-wider uppercase rounded-md shadow-2xs">
              Commercial Quotation
            </div>
            <div className="text-xs font-mono font-bold text-[#f86c29] mt-1">
              {meta.quoteNumber || 'ANM-2026'}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div>
          <span className="font-bold text-slate-700">Project Name: </span>
          <span className="text-slate-900 font-semibold">{meta.projectName || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Client: </span>
          <span className="text-slate-900 font-semibold">{meta.clientName || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Product Specified: </span>
          <span className="text-[#00488e] font-bold">{system.name}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Scale of Project: </span>
          <span className="text-slate-900 font-mono font-bold">{scaleM2.toLocaleString()} M²</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Salesman: </span>
          <span className="text-slate-900">{meta.salesman || 'Ram'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">QTN No: </span>
          <span className="text-[#00488e] font-mono font-bold">{meta.quoteNumber || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Date: </span>
          <span className="text-slate-900">{meta.date || new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Status: </span>
          <span className="font-bold uppercase text-[#f86c29]">{meta.status || 'DRAFT'}</span>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-slate-300 mb-4 text-[11px]">
        <thead>
          <tr className="bg-[#00488e] text-white font-bold border-b border-[#00488e]">
            <th className="border border-blue-900/40 p-2 text-left">PRODUCT NAME</th>
            <th className="border border-blue-900/40 p-2 text-right w-24">REQ. / 1 M²</th>
            <th className="border border-blue-900/40 p-2 text-center w-14">UNIT</th>
            <th className="border border-blue-900/40 p-2 text-right w-24">PROJECT QTY</th>
            <th className="border border-blue-900/40 p-2 text-right w-24">PRICE (AED)</th>
            <th className="border border-blue-900/40 p-2 text-right w-28">TOTAL (AED)</th>
          </tr>
        </thead>
        <tbody>
          {baseItems.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-200 even:bg-slate-50/50">
              <td className="border border-slate-300 p-1.5 font-medium">{item.productName}</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{item.factorPerM2.toFixed(4)}</td>
              <td className="border border-slate-300 p-1.5 text-center font-mono">{item.unit}</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono font-semibold">
                {item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
              </td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">
                {item.unitPriceAed.toFixed(3)}
              </td>
              <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">
                {item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}

          {/* Base Subtotals */}
          <tr className="bg-blue-50/60 font-bold border-t border-slate-300">
            <td colSpan={4} className="border border-slate-300 p-2 text-right text-[#00488e]">
              BASE ASSEMBLY TOTAL (AED):
            </td>
            <td className="border border-slate-300 p-2 text-right font-mono text-slate-600">RATE / m²:</td>
            <td className="border border-slate-300 p-2 text-right font-mono text-xs text-[#00488e]">
              AED {baseTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr className="bg-blue-50/30 font-bold border-b-2 border-slate-400">
            <td colSpan={4} className="border border-slate-300 p-1.5 text-right text-slate-600">
              Base Rate Per M²:
            </td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-right font-mono text-[#00488e]">
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

          {/* Grand Totals with Brand Orange Highlights */}
          <tr className="bg-[#00488e] text-white font-bold text-xs">
            <td colSpan={4} className="border border-[#00488e] p-2.5 text-right uppercase tracking-wide text-white">
              COMMERCIAL GRAND TOTAL (AED):
            </td>
            <td className="border border-[#00488e] p-2.5 text-right font-mono text-blue-200">
              GRAND RATE:
            </td>
            <td className="border border-[#00488e] p-2.5 text-right font-mono text-base text-[#f86c29]">
              AED {grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr className="bg-[#002d5a] text-white font-bold text-xs">
            <td colSpan={4} className="border border-[#002d5a] p-2 text-right text-blue-200">
              GRAND RATE PER M² (ALL INCLUSIVE):
            </td>
            <td colSpan={2} className="border border-[#002d5a] p-2 text-right font-mono text-[#f86c29] text-sm">
              AED {grandRatePerM2.toFixed(2)} / M²
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terms & Conditions */}
      <div className="mt-5 border border-slate-300 p-3 bg-slate-50 text-[10px] leading-relaxed rounded-sm">
        <div className="font-bold text-[#00488e] mb-1 uppercase tracking-wide">
          Official Terms & Conditions:
        </div>
        <ol className="list-none space-y-0.5 text-slate-700">
          {AL_NAMARIQ_TERMS.map((term, i) => (
            <li key={i}>{term}</li>
          ))}
        </ol>
      </div>

      {/* Dual Signatures */}
      <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-xs font-bold text-slate-900">
        <div>
          <div className="mb-10 text-[#00488e]">Prepared by:</div>
          <div className="border-t-2 border-slate-300 pt-1 text-slate-600 font-medium">
            Sales Estimator: {meta.salesman || 'Ram Prasad'}
          </div>
        </div>
        <div>
          <div className="mb-10 text-[#00488e]">Authorized by:</div>
          <div className="border-t-2 border-slate-300 pt-1 text-slate-600 font-medium">
            Commercial Director / Al Namariq Branch Management
          </div>
        </div>
      </div>
    </div>
  );
}
