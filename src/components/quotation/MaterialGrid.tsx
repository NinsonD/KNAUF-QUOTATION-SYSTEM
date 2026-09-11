'use client';

import React from 'react';
import { CalculatedItem } from '@/lib/engine/types';
import { Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';

interface MaterialGridProps {
  baseItems: CalculatedItem[];
  deflectionItems: CalculatedItem[];
  scaleM2: number;
  onUpdateBaseItem: (index: number, updated: Partial<CalculatedItem>) => void;
  onUpdateDeflectionItem: (index: number, updated: Partial<CalculatedItem>) => void;
  onAddBaseItem: () => void;
  onRemoveBaseItem: (index: number) => void;
  onRemoveDeflectionItem: (index: number) => void;
  onResetItems: () => void;
}

export default function MaterialGrid({
  baseItems,
  deflectionItems,
  scaleM2,
  onUpdateBaseItem,
  onUpdateDeflectionItem,
  onAddBaseItem,
  onRemoveBaseItem,
  onRemoveDeflectionItem,
  onResetItems,
}: MaterialGridProps) {
  const baseSubtotal = baseItems.reduce((acc, it) => acc + (it.totalPriceAed || 0), 0);
  const baseRate = scaleM2 > 0 ? baseSubtotal / scaleM2 : 0;

  const defSubtotal = deflectionItems.reduce((acc, it) => acc + (it.totalPriceAed || 0), 0);
  const defRate = scaleM2 > 0 ? defSubtotal / scaleM2 : 0;

  const grandTotal = baseSubtotal + defSubtotal;
  const grandRate = scaleM2 > 0 ? grandTotal / scaleM2 : 0;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            3. Bill of Materials & Pricing Engine
          </h3>
          <p className="text-xs text-slate-500">
            Interactive consumption factor and unit price matrix with instant recalculations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetItems}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={onAddBaseItem}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#002060] hover:bg-[#002060]/90 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Material Row
          </button>
        </div>
      </div>

      {/* Warning if scale is 0 */}
      {scaleM2 <= 0 && (
        <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Please set a valid project scale (M² &gt; 0) in Step 2 to compute total project quantities.</span>
        </div>
      )}

      {/* Main Base Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-800 uppercase text-[11px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-4 min-w-[280px]">Product Name / Specification</th>
              <th className="py-3 px-3 w-36 text-right">Req. / 1 m²</th>
              <th className="py-3 px-2 w-20 text-center">Unit</th>
              <th className="py-3 px-3 w-32 text-right">Project Qty</th>
              <th className="py-3 px-3 w-36 text-right">Price (AED)</th>
              <th className="py-3 px-4 w-36 text-right">Total (AED)</th>
              <th className="py-3 px-2 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {baseItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="text"
                    value={item.productName}
                    onChange={(e) => onUpdateBaseItem(idx, { productName: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-transparent hover:border-slate-300 focus:border-[#002060] focus:bg-white focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={item.factorPerM2}
                    onChange={(e) => {
                      const factor = parseFloat(e.target.value) || 0;
                      const totalQuantity = Number((scaleM2 * factor).toFixed(3));
                      const totalPriceAed = Number((totalQuantity * item.unitPriceAed).toFixed(2));
                      onUpdateBaseItem(idx, { factorPerM2: factor, totalQuantity, totalPriceAed });
                    }}
                    className="w-24 px-2 py-1 text-right font-mono text-xs rounded border border-slate-200 focus:border-[#002060] focus:outline-none"
                  />
                </td>
                <td className="py-2.5 px-2 text-center">
                  <select
                    value={item.unit}
                    onChange={(e) => onUpdateBaseItem(idx, { unit: e.target.value })}
                    className="text-center font-mono text-xs px-1 py-1 rounded border border-slate-200 focus:outline-none"
                  >
                    <option value="m²">m²</option>
                    <option value="m">m</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="bags">bags</option>
                    <option value="buckets">buckets</option>
                  </select>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                  {item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={item.unitPriceAed}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const totalPriceAed = Number((item.totalQuantity * price).toFixed(2));
                      onUpdateBaseItem(idx, { unitPriceAed: price, totalPriceAed });
                    }}
                    className="w-24 px-2 py-1 text-right font-mono text-xs font-semibold rounded border border-amber-200 bg-amber-50/20 focus:border-amber-500 focus:outline-none"
                  />
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                  AED {item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveBaseItem(idx)}
                    title="Remove item"
                    className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Base Subtotal Row */}
            <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
              <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wide text-xs text-slate-700">
                Base Assembly Subtotal (AED):
              </td>
              <td className="py-3 px-3 text-right text-xs text-slate-500 font-mono">
                RATE / m²:
              </td>
              <td className="py-3 px-4 text-right font-mono text-sm text-[#002060]">
                AED {baseSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
            <tr className="bg-blue-50/50 font-bold border-b border-slate-200">
              <td colSpan={5} className="py-2 px-4 text-right text-xs text-slate-600">
                Base Rate Per M²:
              </td>
              <td colSpan={2} className="py-2 px-4 text-right font-mono text-xs text-[#002060]">
                AED {baseRate.toFixed(2)} / M²
              </td>
              <td></td>
            </tr>
          </tbody>

          {/* Head Deflection Section if present */}
          {deflectionItems.length > 0 && (
            <>
              <thead className="bg-emerald-100/70 text-emerald-900 uppercase text-[11px] font-bold border-t-4 border-emerald-300">
                <tr>
                  <th colSpan={8} className="py-2 px-4">
                    Head Deflection Components (Structural Slab Movement Accommodation)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 font-medium bg-emerald-50/20">
                {deflectionItems.map((item, idx) => (
                  <tr key={`def-${idx}`} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-mono text-[11px]">
                      D{idx + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => onUpdateDeflectionItem(idx, { productName: e.target.value })}
                        className="w-full px-2 py-1 text-xs rounded border border-transparent hover:border-emerald-300 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={item.factorPerM2}
                        onChange={(e) => {
                          const factor = parseFloat(e.target.value) || 0;
                          const totalQuantity = Number((scaleM2 * factor).toFixed(3));
                          const totalPriceAed = Number((totalQuantity * item.unitPriceAed).toFixed(2));
                          onUpdateDeflectionItem(idx, { factorPerM2: factor, totalQuantity, totalPriceAed });
                        }}
                        className="w-24 px-2 py-1 text-right font-mono text-xs rounded border border-emerald-200 focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="font-mono text-xs">{item.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-950">
                      {item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.unitPriceAed}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          const totalPriceAed = Number((item.totalQuantity * price).toFixed(2));
                          onUpdateDeflectionItem(idx, { unitPriceAed: price, totalPriceAed });
                        }}
                        className="w-24 px-2 py-1 text-right font-mono text-xs font-semibold rounded border border-emerald-300 bg-emerald-50 focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-950">
                      AED {item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveDeflectionItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Deflection Subtotal */}
                <tr className="bg-emerald-100/80 font-bold border-t border-emerald-300">
                  <td colSpan={5} className="py-2.5 px-4 text-right uppercase tracking-wide text-xs text-emerald-950">
                    Deflection Total (AED):
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs text-emerald-800 font-mono">
                    DEF. RATE:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-sm text-emerald-950">
                    AED {defSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
                <tr className="bg-emerald-50 font-bold">
                  <td colSpan={5} className="py-2 px-4 text-right text-xs text-emerald-800">
                    Deflection Rate Per M²:
                  </td>
                  <td colSpan={2} className="py-2 px-4 text-right font-mono text-xs text-emerald-900">
                    AED {defRate.toFixed(2)} / M²
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </>
          )}

          {/* Grand Totals Footer */}
          <tfoot>
            <tr className="bg-[#002060] text-white font-bold text-sm">
              <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider text-amber-400">
                Grand Total (AED):
              </td>
              <td className="py-3.5 px-3 text-right text-xs text-blue-200 uppercase font-mono">
                Grand Rate:
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-base text-amber-300">
                AED {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
            <tr className="bg-[#001540] text-blue-200 font-medium text-xs">
              <td colSpan={5} className="py-2 px-4 text-right">
                Grand Rate Per M² (Base + Deflection):
              </td>
              <td colSpan={2} className="py-2 px-4 text-right font-mono text-white font-bold">
                AED {grandRate.toFixed(2)} / M²
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

