'use client';

import React from 'react';
import { FileSpreadsheet, Printer, Save, CheckCircle, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  quoteId?: string;
  onSaveQuote: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  onExportPdf?: () => Promise<void>;
  onPrintPdf: () => void;
  isSaving: boolean;
  isExporting: boolean;
  isExportingPdf?: boolean;
  saveSuccess?: boolean;
}

export default function ExportButtons({
  quoteId,
  onSaveQuote,
  onExportExcel,
  onExportPdf,
  onPrintPdf,
  isSaving,
  isExporting,
  isExportingPdf,
  saveSuccess,
}: ExportButtonsProps) {
  return (
    <div className="bento-card p-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {saveSuccess ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Quotation saved to repository!
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-medium">
            Save changes to repository or generate corporate branded PDF and Excel exports
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Save button */}
        <button
          type="button"
          onClick={onSaveQuote}
          disabled={isSaving}
          className="px-4 py-2 text-xs font-bold rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <Save className="w-4 h-4 text-slate-600" />
          )}
          {quoteId ? 'Update Quotation' : 'Save to System'}
        </button>

        {/* Print Preview button */}
        <button
          type="button"
          onClick={onPrintPdf}
          className="px-4 py-2 text-xs font-bold rounded-full text-[#00488e] bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4 text-[#00488e]" />
          Print Preview
        </button>

        {/* Direct Vector PDF Export button */}
        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 text-xs font-bold rounded-full text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-2 transition-all disabled:opacity-50 shadow-2xs hover:shadow"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            ) : (
              <Printer className="w-4 h-4 text-rose-600" />
            )}
            Download PDF (.pdf)
          </button>
        )}

        {/* Excel Export button in Brand Orange */}
        <button
          type="button"
          onClick={onExportExcel}
          disabled={isExporting}
          className="px-5 py-2 text-xs font-black uppercase tracking-wide rounded-full text-white bg-[#f86c29] hover:bg-[#e05615] shadow-sm flex items-center gap-2 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-white" />
          )}
          Export Excel (.xlsx)
        </button>
      </div>
    </div>
  );
}
