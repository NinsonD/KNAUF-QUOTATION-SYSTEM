'use client';

import React from 'react';
import { CalculationResult } from '@/lib/engine/types';
import { Calculator, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface SummaryCardProps {
  calculation: CalculationResult;
  systemName: string;
  projectName: string;
  hasDeflection: boolean;
}

export default function SummaryCard({
  calculation,
  systemName,
  projectName,
  hasDeflection,
}: SummaryCardProps) {
  const {
    scaleM2,
    baseTotalAed,
    baseRatePerM2,
    deflectionTotalAed,
    deflectionRatePerM2,
    grandTotalAed,
    grandRatePerM2,
  } = calculation;

  return (
    <div className="bg-gradient-to-br from-[#00488e] via-[#003c77] to-[#002d5a] rounded-2xl text-white p-6 shadow-xl border border-blue-800/60 sticky top-22">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/15">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#f86c29]/20 border border-[#f86c29]/40 flex items-center justify-center text-[#f86c29]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white tracking-tight">Quotation Summary</h3>
            <p className="text-[11px] text-blue-100/70 truncate max-w-[190px]">
              {projectName || 'Commercial Project'}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-black bg-[#f86c29] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
          {scaleM2.toLocaleString()} M²
        </span>
      </div>

      <div className="text-xs text-blue-100/90 mb-4 truncate font-medium">
        <span className="text-white/60">System:</span> {systemName}
      </div>

      {/* Financial Metrics Cards */}
      <div className="space-y-3">
        {/* Base Assembly */}
        <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-blue-100 font-bold block">
              Base Assembly
            </span>
            <span className="text-xs text-blue-200/90 font-mono">
              @ AED {baseRatePerM2.toFixed(2)} / m²
            </span>
          </div>
          <div className="text-right">
            <span className="text-base font-bold font-mono text-white">
              AED {baseTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Head Deflection if active */}
        {hasDeflection && deflectionTotalAed > 0 && (
          <div className="bg-emerald-500/15 border border-emerald-400/40 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold block">
                  Deflection Head
                </span>
                <span className="text-xs text-emerald-300 font-mono">
                  @ AED {deflectionRatePerM2.toFixed(2)} / m²
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-emerald-300">
                AED {deflectionTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Grand Total Highlight Box in Al Namariq Brand Orange */}
        <div className="bg-gradient-to-r from-[#f86c29] to-[#e05615] rounded-xl p-4.5 shadow-md border border-[#f86c29]/40 mt-3 text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Commercial Grand Total
            </span>
            <span className="text-[10px] font-mono font-bold text-white bg-black/20 px-2 py-0.5 rounded">
              AED EXCL. VAT
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="font-mono text-2xl font-black text-white tracking-tight">
              AED {grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/25 text-xs">
            <span className="text-white/90 font-semibold">Grand Rate Per M²:</span>
            <span className="font-mono font-black text-white text-sm bg-black/15 px-2 py-0.5 rounded">
              AED {grandRatePerM2.toFixed(2)} / M²
            </span>
          </div>
        </div>
      </div>

      {/* Commercial Notes */}
      <div className="mt-5 pt-4 border-t border-white/15 text-[11px] text-blue-100/70 space-y-1">
        <div className="flex items-center gap-1.5 text-white font-bold">
          <TrendingUp className="w-3.5 h-3.5 text-[#f86c29]" />
          Al Namariq Commercial Policies:
        </div>
        <p>• Consumption based on theoretical standard m² math</p>
        <p>• Supplied in full trailer load multiples only</p>
        <p>• Non-standard items leadtime: 3-4 weeks</p>
      </div>
    </div>
  );
}
