'use client';

import React from 'react';
import { FileSpreadsheet, Printer, Save, CheckCircle, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  quoteId?: string;
  onSaveQuote: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  onPrintPdf: () => void;
  isSaving: boolean;
  isExporting: boolean;
  saveSuccess?: boolean;
}

export default function ExportButtons({
  quoteId,
  onSaveQuote,
  onExportExcel,
  onPrintPdf,
  isSaving,
  isExporting,
  saveSuccess,
}: ExportButtonsProps) {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {saveSuccess ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle className="w-4 h-4" /> Quotation saved successfully!
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-medium">
            Save progress or generate official branded exports
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Save button */}
        <button
          type="button"
          onClick={onSaveQuote}
          disabled={isSaving}
          className="px-4 py-2 text-xs font-bold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <Save className="w-4 h-4 text-slate-600" />
          )}
          {quoteId ? 'Update Quotation' : 'Save to System'}
        </button>

        {/* Print / PDF button */}
        <button
          type="button"
          onClick={onPrintPdf}
          className="px-4 py-2 text-xs font-bold rounded-lg text-[#002060] bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 transition-colors"
        >
          <Printer className="w-4 h-4 text-[#002060]" />
          Print / PDF View
        </button>

        {/* Excel Export button */}
        <button
          type="button"
          onClick={onExportExcel}
          disabled={isExporting}
          className="px-5 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition-all hover:shadow disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-white" />
          )}
          Export Official Excel (.xlsx)
        </button>
      </div>
    </div>
  );
}

