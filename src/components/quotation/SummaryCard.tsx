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
    <div className="bg-gradient-to-br from-[#002060] via-[#002b80] to-[#001740] rounded-2xl text-white p-6 shadow-lg border border-blue-900/50 sticky top-20">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Quotation Summary</h3>
            <p className="text-[11px] text-blue-200 truncate max-w-[200px]">
              {projectName || 'New Project'}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
          {scaleM2.toLocaleString()} M²
        </span>
      </div>

      <div className="text-xs text-blue-200 mb-4 truncate font-medium">
        <span className="text-white/60">System:</span> {systemName}
      </div>

      {/* Financial Metrics Cards */}
      <div className="space-y-3">
        {/* Base Assembly */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wide text-blue-200 font-semibold block">
              Base Assembly Subtotal
            </span>
            <span className="text-xs text-slate-300 font-mono">
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
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[11px] uppercase tracking-wide text-emerald-200 font-semibold block">
                  Deflection Head
                </span>
                <span className="text-xs text-emerald-300/80 font-mono">
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

        {/* Grand Total Highlight */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/40 rounded-xl p-4 mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Commercial Grand Total
            </span>
            <span className="text-[11px] font-mono text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/20">
              VAT EXCLUSIVE
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="font-mono text-2xl font-black text-amber-400 tracking-tight">
              AED {grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-400/20 text-xs">
            <span className="text-amber-200/90 font-medium">Grand Rate Per M²:</span>
            <span className="font-mono font-bold text-white text-sm">
              AED {grandRatePerM2.toFixed(2)} / M²
            </span>
          </div>
        </div>
      </div>

      {/* Commercial Notes */}
      <div className="mt-5 pt-4 border-t border-white/10 text-[11px] text-blue-200/70 space-y-1">
        <div className="flex items-center gap-1.5 text-blue-100 font-semibold">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          Al Namariq Pricing Terms:
        </div>
        <p>• Leadtime for non-standard: 3-4 weeks</p>
        <p>• Trailer load supply multiples only</p>
        <p>• Standard 7 terms and conditions apply</p>
      </div>
    </div>
  );
}

