'use client';

import { useState } from 'react';
import Image from 'next/image';
import drawings from '@/data/system-images.json';

interface Drawing { src: string; width: number; height: number; label: string; }
interface Variant { sheet: string; images: Drawing[]; }
const catalog = drawings as Record<string, { base: Variant; head?: Variant }>;

export default function SystemIllustration({ code, includeDeflection = false }: { code: string; includeDeflection?: boolean }) {
  const system = catalog[code];
  if (!system) return null;
  const variant = includeDeflection ? system.head ?? system.base : system.base;
  return <DrawingGallery key={`${code}-${variant.sheet}`} code={code} variant={variant} />;
}

function DrawingGallery({ code, variant }: { code: string; variant: Variant }) {
  const [selected, setSelected] = useState(0);
  const drawing = variant.images[selected];
  return (
    <section aria-label={`${code} system drawings`} className="quote-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-medium">System drawings · {code}</h2>
        <a className="quote-text-button text-xs" href={drawing.src} target="_blank" rel="noopener noreferrer" aria-label={`Open ${code} ${drawing.label.toLowerCase()} full-size in a new tab`}>Open full-size ↗</a>
      </div>
      <figure className="px-5 py-4">
        <Image src={drawing.src} width={drawing.width} height={drawing.height} alt={`${code} — ${drawing.label}, from the ${variant.sheet} reference sheet`} sizes="(max-width: 768px) 100vw, 700px" className="mx-auto h-60 w-full object-contain sm:h-72" />
        <figcaption className="mt-3 text-center text-xs text-slate-600">{drawing.label}</figcaption>
      </figure>
      {variant.images.length > 1 && <div role="group" aria-label="Choose a system drawing" className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3">
        {variant.images.map((item, index) => <button key={item.src} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`w-28 shrink-0 rounded border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${selected === index ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
          <Image src={item.src} width={item.width} height={item.height} alt="" sizes="96px" className="h-16 w-full object-contain" />
          <span className="mt-2 block text-xs leading-4 text-slate-700">{item.label}</span>
        </button>)}
      </div>}
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Reference drawing from Knauf Costing Sheets · {variant.sheet}. Check the quotation items for the selected specification.</p>
    </section>
  );
}

export function SystemThumbnail({ code }: { code: string }) {
  const drawing = catalog[code]?.base.images[0];
  if (!drawing) return null;
  return <Image src={drawing.src} width={drawing.width} height={drawing.height} alt={`${code} system overview`} sizes="112px" className="mb-2 h-24 w-28 object-contain" />;
}
