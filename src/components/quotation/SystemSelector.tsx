'use client';

import React from 'react';
import { KnaufSystemDefinition, SystemCategory } from '@/lib/engine/types';
import { Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SystemSelectorProps {
  systems: KnaufSystemDefinition[];
  selectedSystemCode: string;
  onSelectSystem: (system: KnaufSystemDefinition) => void;
}

const CATEGORY_LABELS: Record<SystemCategory, string> = {
  CEILING: 'Ceiling Systems',
  PARTITION: 'Partition Systems',
  SHAFT_WALL: 'Shaft Wall Systems',
  WALL_LINING: 'Wall Linings',
};

export default function SystemSelector({
  systems,
  selectedSystemCode,
  onSelectSystem,
}: SystemSelectorProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>('ALL');

  const categories = ['ALL', 'CEILING', 'PARTITION', 'SHAFT_WALL', 'WALL_LINING'];

  const filteredSystems = systems.filter((s) =>
    activeCategory === 'ALL' ? true : s.category === activeCategory
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#002060]" />
            1. Select Knauf System Template
          </h3>
          <p className="text-xs text-slate-500">
            Choose from the 14 official Knauf dry construction systems (19 analytical templates)
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeCategory === cat
                  ? 'bg-[#002060] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All (14)' : CATEGORY_LABELS[cat as SystemCategory] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSystems.map((sys) => {
          const isSelected = sys.code === selectedSystemCode;
          return (
            <button
              key={sys.code}
              type="button"
              onClick={() => onSelectSystem(sys)}
              className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-[#002060] bg-blue-50/40 ring-2 ring-[#002060]/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {sys.code}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#002060]" />
                  )}
                </div>

                <div className="font-bold text-sm text-slate-900 leading-snug mb-1">
                  {sys.name}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                  {sys.description || 'Standard Knauf engineering assembly'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[11px]">
                <span className="text-slate-500 font-medium">
                  {sys.baseMaterials.length} materials
                </span>
                {sys.supportsDeflection && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                    <ShieldCheck className="w-3 h-3" /> Deflection Head
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

