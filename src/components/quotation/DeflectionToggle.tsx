'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Info } from 'lucide-react';

interface DeflectionToggleProps {
  supportsDeflection: boolean;
  includeDeflection: boolean;
  onToggle: (include: boolean) => void;
  systemName: string;
}

export default function DeflectionToggle({
  supportsDeflection,
  includeDeflection,
  onToggle,
  systemName,
}: DeflectionToggleProps) {
  if (!supportsDeflection) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-slate-500">
        <Info className="w-5 h-5 text-slate-400 shrink-0" />
        <span className="text-xs">
          Head Deflection assembly is not applicable for {systemName} (standard for partitions and shaft walls only).
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bento-card p-6 transition-all ${
        includeDeflection
          ? 'ring-2 ring-emerald-500/30 border-emerald-300 bg-emerald-50/40'
          : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              includeDeflection
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {includeDeflection ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Enhanced Head Deflection Option
              </h4>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  includeDeflection
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {includeDeflection ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Includes FR board strips, Section Angle 60/25, FR Sealant, Wedge Anchors, and Concrete Screwbolts for structural slab deflection accommodation.
            </p>
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => onToggle(!includeDeflection)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
            includeDeflection ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={includeDeflection}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              includeDeflection ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

