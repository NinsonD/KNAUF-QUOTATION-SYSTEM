'use client';

import React from 'react';
import { QuoteMetaData, QuoteStatus } from '@/lib/engine/types';
import { Building, User, FileText, Hash, Calendar, Maximize2 } from 'lucide-react';

interface ProjectMetaFormProps {
  meta: QuoteMetaData;
  scaleM2: number;
  onChangeMeta: (meta: Partial<QuoteMetaData>) => void;
  onChangeScale: (scale: number) => void;
}

export default function ProjectMetaForm({
  meta,
  scaleM2,
  onChangeMeta,
  onChangeScale,
}: ProjectMetaFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00488e]" />
            2. Project Details & Scale
          </h3>
          <p className="text-xs text-slate-500">
            Official quotation metadata and total surface area (m²)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Project Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Project Name <span className="text-[#f86c29]">*</span>
          </label>
          <input
            type="text"
            value={meta.projectName}
            onChange={(e) => onChangeMeta({ projectName: e.target.value })}
            placeholder="e.g. Dubai Hills Estate Villas"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00488e] focus:border-transparent bg-slate-50/50 font-medium"
            required
          />
        </div>

        {/* Client Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Client Name <span className="text-[#f86c29]">*</span>
          </label>
          <input
            type="text"
            value={meta.clientName}
            onChange={(e) => onChangeMeta({ clientName: e.target.value })}
            placeholder="e.g. BUTEC Engineering LLC"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00488e] focus:border-transparent bg-slate-50/50 font-medium"
            required
          />
        </div>

        {/* Scale of Project (m2) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-[#f86c29]" />
            Scale of Project (M²) <span className="text-[#f86c29]">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="any"
              value={scaleM2 || ''}
              onChange={(e) => onChangeScale(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 1000"
              className="w-full pl-3 pr-10 py-2 text-xs font-bold font-mono rounded-lg border border-[#fed7aa] focus:outline-none focus:ring-2 focus:ring-[#f86c29] focus:border-transparent bg-[#fff3ec]/50 text-slate-900"
              required
            />
            <span className="absolute right-3 top-2 text-xs font-black text-[#f86c29] pointer-events-none">
              M²
            </span>
          </div>
        </div>

        {/* QTN No */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            Quotation No. (QTN)
          </label>
          <input
            type="text"
            value={meta.quoteNumber}
            onChange={(e) => onChangeMeta({ quoteNumber: e.target.value })}
            placeholder="e.g. ANM-2026-001"
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00488e] focus:border-transparent bg-slate-50/50 text-[#00488e]"
          />
        </div>

        {/* Salesman */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Salesman
          </label>
          <input
            type="text"
            value={meta.salesman}
            onChange={(e) => onChangeMeta({ salesman: e.target.value })}
            placeholder="e.g. Ram Prasad / Vishnu"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00488e] focus:border-transparent bg-slate-50/50 font-medium"
          />
        </div>

        {/* Date & Status */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date
            </label>
            <input
              type="text"
              value={meta.date}
              onChange={(e) => onChangeMeta({ date: e.target.value })}
              placeholder="DD/MM/YYYY"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00488e] bg-slate-50/50 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              value={meta.status || 'DRAFT'}
              onChange={(e) => onChangeMeta({ status: e.target.value as QuoteStatus })}
              className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00488e] bg-slate-50/50 font-bold text-[#00488e]"
            >
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="APPROVED">Approved</option>
              <option value="REVISED">Revised</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
