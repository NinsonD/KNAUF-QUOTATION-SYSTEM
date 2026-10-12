'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import PrintableQuote from './PrintableQuote';
import type { CalculationResult, KnaufSystemDefinition, QuoteMetaData } from '@/lib/engine/types';

interface Props {
  meta: QuoteMetaData;
  system: KnaufSystemDefinition;
  calculation: CalculationResult;
  onClose: () => void;
}

export default function QuotePreview({ meta, system, calculation, onClose }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return createPortal(
    <div className="print-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-2 sm:p-6" onClick={onClose}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="quote-preview-title" tabIndex={-1}
        className="print-modal-container relative mx-auto w-full max-w-4xl rounded-2xl bg-white shadow-xl outline-none"
        onClick={event => event.stopPropagation()}
        onKeyDown={event => {
          if (event.key === 'Escape') onClose();
          if (event.key === 'Tab') {
            const controls = dialog.current?.querySelectorAll<HTMLElement>('button, a[href], input, select, [tabindex="0"]');
            if (!controls?.length) return;
            const first = controls[0]; const last = controls[controls.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
          }
        }}>
        <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4">
          <h2 id="quote-preview-title" className="font-semibold text-slate-900">Quote preview</h2>
          <div className="flex items-center gap-2"><button type="button" className="quote-button-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button><button type="button" className="quote-button-secondary" onClick={onClose} aria-label="Close preview"><X size={18} /></button></div>
        </div>
        <div className="overflow-x-auto p-3 sm:p-6 print:p-0"><PrintableQuote meta={meta} system={system} calculation={calculation} /></div>
      </div>
    </div>, document.body
  );
}
