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
    <div className="printable-document bg-white text-slate-900 w-full max-w-[210mm] mx-auto p-4 sm:p-6 font-sans text-xs shadow-md print:shadow-none print:p-0 print:max-w-none print:w-full print:m-0">
      {/* 1. Official Corporate Letterhead Header */}
      <div className="border-b-2 border-[#00488e] pb-3 mb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Logo & Company Details */}
          <div className="flex items-center gap-3.5">
            <div className="shrink-0">
              <img
                src="/logo/logo.png"
                alt="Al Namariq Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#00488e] uppercase leading-tight">
                Al Namariq Building Material Trading Co. LLC
              </h1>
              <p className="text-[10.5px] font-semibold text-slate-700 mt-0.5">
                Certified Knauf Drywall & Ceiling Construction Systems Distributor
              </p>
              <p className="text-[9.5px] text-slate-500 mt-0.5">
                P.O. Box 25569, Industrial Area, Sharjah, United Arab Emirates
              </p>
              <p className="text-[9.5px] text-slate-500">
                Tel: +971 6 5328033 &nbsp;|&nbsp; Fax: +971 6 5328302 &nbsp;|&nbsp; Email: sales@alnamariq.ae
              </p>
            </div>
          </div>

          {/* Quotation Title Badge */}
          <div className="text-right shrink-0">
            <div className="inline-block px-3.5 py-1 bg-[#00488e] text-white font-black text-[11px] tracking-wider uppercase rounded">
              Commercial Quotation
            </div>
            <div className="text-xs font-mono font-bold text-[#f86c29] mt-1">
              Ref: {meta.quoteNumber || 'ANM-2026'}
            </div>
            <div className="text-[9.5px] text-slate-500 font-medium">
              Date: {meta.date || new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Metadata Grid (Project, Client, System, Scale, Sales) */}
      <div className="border border-slate-300 rounded bg-slate-50/70 p-2.5 mb-3 text-xs">
        <div className="grid grid-cols-12 gap-x-4 gap-y-2">
          {/* Left Column */}
          <div className="col-span-7 space-y-1.5">
            <div className="flex">
              <span className="w-28 font-bold text-slate-600 shrink-0">Project Name:</span>
              <span className="font-bold text-slate-900">{meta.projectName || 'Commercial Project'}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-600 shrink-0">Client / Contractor:</span>
              <span className="font-semibold text-slate-900">{meta.clientName || 'Valued Client'}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-600 shrink-0">Product Specified:</span>
              <span className="font-bold text-[#00488e]">
                {system.code} - {system.name}
              </span>
            </div>
            {system.supportsDeflection && deflectionItems.length > 0 && (
              <div className="flex">
                <span className="w-28 font-bold text-slate-600 shrink-0">Deflection Joints:</span>
                <span className="font-bold text-emerald-700">Included (+ Head Deflection Channel & Fixings)</span>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-5 space-y-1.5 border-l border-slate-200 pl-4">
            <div className="flex">
              <span className="w-24 font-bold text-slate-600 shrink-0">Quotation No:</span>
              <span className="font-mono font-bold text-[#00488e]">{meta.quoteNumber || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-24 font-bold text-slate-600 shrink-0">Project Scale:</span>
              <span className="font-mono font-bold text-slate-900">{scaleM2.toLocaleString()} M²</span>
            </div>
            <div className="flex">
              <span className="w-24 font-bold text-slate-600 shrink-0">Technical Sales:</span>
              <span className="text-slate-900 font-medium">{meta.salesman || 'Technical Sales Team'}</span>
            </div>
            <div className="flex">
              <span className="w-24 font-bold text-slate-600 shrink-0">Status:</span>
              <span className="font-bold uppercase text-[#f86c29]">{meta.status || 'DRAFT'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Formal Bill of Quantities Table */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
          <thead>
            <tr className="bg-[#00488e] text-white font-bold border-b border-[#00488e]">
              <th className="border border-blue-900/40 py-2 px-1.5 text-center w-8">#</th>
              <th className="border border-blue-900/40 py-2 px-2.5 text-left">MATERIAL SPECIFICATION & DESCRIPTION</th>
              <th className="border border-blue-900/40 py-2 px-2 text-right w-20">FACTOR / M²</th>
              <th className="border border-blue-900/40 py-2 px-1.5 text-center w-12">UNIT</th>
              <th className="border border-blue-900/40 py-2 px-2 text-right w-24">TOTAL QTY</th>
              <th className="border border-blue-900/40 py-2 px-2 text-right w-24">RATE (AED)</th>
              <th className="border border-blue-900/40 py-2 px-2.5 text-right w-28">AMOUNT (AED)</th>
            </tr>
          </thead>
          <tbody>
            {/* Section Header: Base Assembly */}
            <tr className="bg-slate-100/90 font-extrabold text-[#00488e] border-y border-slate-300">
              <td colSpan={7} className="py-1.5 px-2.5 tracking-wide text-[10px] uppercase">
                A. Knauf Standard System Components ({baseItems.length} items)
              </td>
            </tr>

            {/* Base Items */}
            {baseItems.map((item, idx) => (
              <tr key={`base-${idx}`} className="border-b border-slate-200 even:bg-slate-50/60 print:even:bg-slate-50/60 break-inside-avoid">
                <td className="border border-slate-300 py-1.5 px-1.5 text-center font-mono text-slate-500 text-[10px]">
                  {idx + 1}
                </td>
                <td className="border border-slate-300 py-1.5 px-2.5 font-medium text-slate-900">
                  {item.productName}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-600">
                  {item.factorPerM2.toFixed(3)}
                </td>
                <td className="border border-slate-300 py-1.5 px-1.5 text-center font-mono text-slate-600">
                  {item.unit}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-semibold text-slate-900">
                  {item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-800">
                  {item.unitPriceAed.toFixed(3)}
                </td>
                <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                  {item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}

            {/* Base Subtotals */}
            <tr className="bg-blue-50/80 font-bold border-t-2 border-[#00488e] break-inside-avoid">
              <td colSpan={4} className="border border-slate-300 py-2 px-2.5 text-right text-[#00488e] uppercase font-bold">
                Subtotal Base System Assembly:
              </td>
              <td colSpan={2} className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-700">
                Rate: <span className="font-bold text-[#00488e]">AED {baseRatePerM2.toFixed(2)} / M²</span>
              </td>
              <td className="border border-slate-300 py-2 px-2.5 text-right font-mono text-xs font-black text-[#00488e]">
                AED {baseTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Deflection Section (If included) */}
            {deflectionItems.length > 0 && (
              <>
                <tr className="bg-emerald-50/90 font-extrabold text-emerald-900 border-y border-slate-300 break-inside-avoid">
                  <td colSpan={7} className="py-1.5 px-2.5 tracking-wide text-[10px] uppercase">
                    B. Knauf Head Deflection Movement Joint Components ({deflectionItems.length} items)
                  </td>
                </tr>

                {deflectionItems.map((item, idx) => (
                  <tr key={`def-${idx}`} className="border-b border-slate-200 even:bg-emerald-50/30 break-inside-avoid">
                    <td className="border border-slate-300 py-1.5 px-1.5 text-center font-mono text-slate-500 text-[10px]">
                      {baseItems.length + idx + 1}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2.5 font-medium text-slate-900">
                      {item.productName}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-600">
                      {item.factorPerM2.toFixed(3)}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-1.5 text-center font-mono text-slate-600">
                      {item.unit}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-semibold text-slate-900">
                      {item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-800">
                      {item.unitPriceAed.toFixed(3)}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                      {item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}

                <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-600 break-inside-avoid">
                  <td colSpan={4} className="border border-slate-300 py-2 px-2.5 text-right text-emerald-950 uppercase font-bold">
                    Subtotal Head Deflection Movement Joints:
                  </td>
                  <td colSpan={2} className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-700">
                    Rate: <span className="font-bold text-emerald-900">AED {deflectionRatePerM2.toFixed(2)} / M²</span>
                  </td>
                  <td className="border border-slate-300 py-2 px-2.5 text-right font-mono text-xs font-black text-emerald-950">
                    AED {deflectionTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </>
            )}

            {/* Grand Totals */}
            <tr className="bg-[#00488e] text-white font-bold text-xs break-inside-avoid">
              <td colSpan={4} className="border border-[#00488e] py-2.5 px-3 text-right uppercase tracking-wider font-black">
                TOTAL COMMERCIAL VALUE (EXCL. VAT):
              </td>
              <td colSpan={2} className="border border-[#00488e] py-2.5 px-2 text-right font-mono text-blue-100">
                ALL-INCLUSIVE RATE:
              </td>
              <td className="border border-[#00488e] py-2.5 px-3 text-right font-mono text-sm font-black text-[#f86c29]">
                AED {grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            <tr className="bg-[#002d5a] text-white font-bold break-inside-avoid">
              <td colSpan={4} className="border border-[#002d5a] py-2 px-3 text-right text-[11px] text-blue-200">
                FINAL EFFECTIVE COMMERCIAL RATE:
              </td>
              <td colSpan={3} className="border border-[#002d5a] py-2 px-3 text-right font-mono text-xs text-white">
                <span className="text-[#f86c29] font-black text-sm">AED {grandRatePerM2.toFixed(2)}</span> / M² Standard Project Scale
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Terms & Conditions */}
      <div className="border border-slate-300 p-2.5 bg-slate-50 text-[9.5px] leading-relaxed rounded mb-4 break-inside-avoid">
        <div className="font-extrabold text-[#00488e] mb-1 uppercase tracking-wide">
          Official Al Namariq Commercial Terms & Conditions:
        </div>
        <ol className="list-decimal list-inside space-y-0.5 text-slate-700 font-medium">
          {AL_NAMARIQ_TERMS.map((term, i) => (
            <li key={i}>{term.replace(/^[0-9]+\)\s*/, '')}</li>
          ))}
        </ol>
      </div>

      {/* 5. Dual Signatures & Acceptance Block */}
      <div className="grid grid-cols-3 gap-6 pt-3 border-t-2 border-slate-300 text-xs break-inside-avoid">
        {/* Prepared by */}
        <div>
          <div className="text-[10.5px] font-bold text-[#00488e] uppercase tracking-wider mb-6">
            Prepared By:
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-900">{meta.salesman || 'Technical Sales Engineer'}</div>
            <div className="text-[9.5px] text-slate-500">Al Namariq Estimating Dept.</div>
          </div>
        </div>

        {/* Authorized by */}
        <div>
          <div className="text-[10.5px] font-bold text-[#00488e] uppercase tracking-wider mb-6">
            Authorized By:
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-900">Commercial Directorate</div>
            <div className="text-[9.5px] text-slate-500">Al Namariq Sharjah Branch</div>
          </div>
        </div>

        {/* Customer Acceptance */}
        <div>
          <div className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider mb-6">
            Customer Acceptance:
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-900">Authorized Signatory & Stamp</div>
            <div className="text-[9.5px] text-slate-500">Date: ____ / ____ / 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}
