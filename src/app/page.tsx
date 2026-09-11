import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronDown,
  FileSpreadsheet,
  Plus,
  Play,
  Pause,
  Clock,
  Layers,
  Sparkles,
  Building2,
  TrendingUp,
  FileText,
} from 'lucide-react';

export const revalidate = 0;

export default async function DashboardPage() {
  let quotes: any[] = [];
  try {
    quotes = await prisma.quotation.findMany({
      include: {
        system: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch (e) {
    console.error('Failed to query quotations:', e);
  }

  const totalQuotesCount = await prisma.quotation.count().catch(() => 0);
  const totalVolume = quotes.reduce((acc, q) => acc + (q.grandTotalAed || 0), 0);
  const totalScale = quotes.reduce((acc, q) => acc + (q.scaleM2 || 0), 0);
  const avgRate = totalScale > 0 ? totalVolume / totalScale : 52.55;

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Top KPI Counter Header (Matching exact Reference Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 pb-1">
        {/* Left Welcome and Segmented Status Strip */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Welcome in, Al Namariq
          </h1>

          {/* Segmented Category Progress Strip matching reference UI */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 text-[11px]">Partitions</span>
              <span className="bg-[#18181b] text-white px-2.5 py-1 rounded-full font-bold text-[11px]">
                45%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 text-[11px]">Ceilings</span>
              <span className="bg-[#f86c29] text-white px-2.5 py-1 rounded-full font-bold text-[11px]">
                30%
              </span>
            </div>
            {/* Striped connector pill */}
            <div className="hidden sm:block h-6 w-32 rounded-full border border-slate-200 stripe-pattern" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 text-[11px]">Shaft & Linings</span>
              <span className="bg-white border border-slate-300 text-slate-700 px-2.5 py-1 rounded-full font-bold text-[11px]">
                25%
              </span>
            </div>
          </div>
        </div>

        {/* Right Big Numeric KPIs (Matching 78, 56, 203 in reference UI) */}
        <div className="flex items-center gap-6 sm:gap-8 self-start lg:self-auto">
          {/* Systems Count */}
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Layers className="w-3.5 h-3.5 text-[#00488e]" />
              <span>Systems</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              14
            </div>
          </div>

          {/* Pipeline Quotes */}
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#f86c29]" />
              <span>Quotes</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {totalQuotesCount || 2}
            </div>
          </div>

          {/* Avg Rate AED */}
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Avg Rate</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {avgRate.toFixed(0)}<span className="text-xs font-bold text-slate-400 ml-1">AED</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: 4 Bento Cards (Matching Reference Profile, Progress, Time Tracker, Onboarding) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Card 1: Estimator Profile Card (Matches Lora Piterson card in reference) */}
        <div className="lg:col-span-3 bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black tracking-wider uppercase text-[#00488e] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Commercial Hub
            </span>
            <span className="font-mono text-xs font-black bg-[#fff3ec] text-[#f86c29] px-2.5 py-1 rounded-full border border-[#fed7aa]">
              AED {avgRate.toFixed(2)}/m²
            </span>
          </div>

          <div className="my-2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00488e] to-[#002d5a] p-1 shadow-md mb-3 flex items-center justify-center text-white">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Al Namariq Team
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Commercial Drywall & Suspended Ceiling Estimators
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Standard Pack</span>
            <span className="font-bold text-slate-700">Trailer Loads Only</span>
          </div>
        </div>

        {/* Card 2: Progress / Systems Factor Bar Chart (Matches Progress 6.1h bar chart in reference) */}
        <div className="lg:col-span-3 bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Knauf Systems</span>
            <Link
              href="/catalog"
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              14
            </span>
            <span className="text-xs font-semibold text-slate-400">
              official assemblies
            </span>
          </div>

          {/* Vertical Pill Bar Chart (Sunday to Saturday / System categories) */}
          <div className="h-28 flex items-end justify-between gap-2 px-2 pt-2 border-b border-slate-100">
            {/* Bar 1: Ceiling */}
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div className="w-3 bg-[#18181b] rounded-full h-[60%]" />
              <span className="text-[10px] text-slate-400 font-bold">KC</span>
            </div>
            {/* Bar 2: Cleaneo */}
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div className="w-3 bg-slate-300 rounded-full h-[45%]" />
              <span className="text-[10px] text-slate-400 font-bold">D127</span>
            </div>
            {/* Bar 3: Partition KW111 */}
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div className="w-3 bg-[#00488e] rounded-full h-[75%]" />
              <span className="text-[10px] text-slate-400 font-bold">W111</span>
            </div>
            {/* Bar 4: Partition KW112 (Active highlighted with badge) */}
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end relative">
              <span className="absolute -top-6 text-[9px] font-black bg-[#fff3ec] text-[#f86c29] border border-[#fed7aa] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                Top Pick
              </span>
              <div className="w-3.5 bg-[#f86c29] rounded-full h-[95%]" />
              <span className="text-[10px] text-[#f86c29] font-black">W112</span>
            </div>
            {/* Bar 5: Shaft Wall */}
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div className="w-3 bg-[#18181b] rounded-full h-[80%]" />
              <span className="text-[10px] text-slate-400 font-bold">SW120</span>
            </div>
            {/* Bar 6: Wall Linings */}
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div className="w-3 bg-slate-300 rounded-full h-[40%]" />
              <span className="text-[10px] text-slate-400 font-bold">W625</span>
            </div>
          </div>
        </div>

        {/* Card 3: Scale Dial / Speed Gauge (Matches Time Tracker 02:35 card in reference) */}
        <div className="lg:col-span-3 bento-card p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Project Scale Meter</span>
            <Link
              href="/quotes/new"
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Circular Dial Gauge matching reference yellow arc */}
          <div className="relative my-2 w-32 h-32 flex items-center justify-center">
            {/* Outer dotted dial ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="6"
                strokeDasharray="4 4"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#f86c29"
                strokeWidth="6"
                strokeDasharray="251.2"
                strokeDashoffset="65"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-mono text-xl font-black text-slate-900 tracking-tight">
                1,000
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Standard M²
              </span>
            </div>
          </div>

          {/* Play / Action Control Buttons */}
          <div className="flex items-center gap-3 mt-1">
            <Link
              href="/quotes/new"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              title="Launch Calculator"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </Link>
            <Link
              href="/quotes"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              title="Quotation Archive"
            >
              <Pause className="w-3.5 h-3.5" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#00488e]/10 text-[#00488e] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 4: Quick Onboarding / Health Card (Matches Onboarding 18% in reference) */}
        <div className="lg:col-span-3 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Specification Health</span>
              <span className="font-mono text-2xl font-black text-[#00488e]">100%</span>
            </div>

            {/* Segmented capsules matching reference UI */}
            <div className="grid grid-cols-12 gap-1.5 my-3">
              <div className="col-span-5 h-7 rounded-xl bg-[#f86c29] text-white flex items-center justify-center text-[10px] font-black uppercase">
                Knauf
              </div>
              <div className="col-span-4 h-7 rounded-xl bg-[#18181b] text-white flex items-center justify-center text-[10px] font-bold">
                Deflection
              </div>
              <div className="col-span-3 h-7 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                Excel
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            All 14 systems calibrated to Knauf 2026 engineering consumption factor math.
          </p>

          <Link
            href="/quotes/new"
            className="mt-3 block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-2xl bg-[#00488e] text-white hover:bg-[#003c77] transition-all shadow-xs"
          >
            Start Calculation
          </Link>
        </div>
      </div>

      {/* 3. Bottom Row: System Components Accordion + Recent Quotation Pills + Dark Checklist Bento Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: System Specification Items (Matches Pension contributions / Devices / Benefits in reference) */}
        <div className="lg:col-span-3 bento-card p-6 space-y-3.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Standard System Specs
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Partition Stud CW 70/35</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Ceiling Furring 35/67</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Acoustic Insulation 50mm</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950">Head Deflection Kit</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-full">
              Optional
            </span>
          </div>
        </div>

        {/* Center: Recent Quotations (Matches August/September calendar timeline with floating pills in reference) */}
        <div className="lg:col-span-5 bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Live Quotations Stream
              </h3>
              <p className="text-xs text-slate-500">
                Recent commercial quotations issued for Al Namariq clients
              </p>
            </div>
            <Link
              href="/quotes"
              className="text-xs font-bold text-[#00488e] hover:underline"
            >
              View All &rarr;
            </Link>
          </div>

          {/* Floating Pill Quotation Cards matching reference schedule layout */}
          <div className="space-y-3">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center font-mono font-black text-xs text-[#00488e]">
                    {q.system?.code?.slice(0, 4) || 'KW'}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 line-clamp-1">
                      {q.projectName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {q.clientName} • <span className="font-mono">{q.scaleM2} m²</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="font-mono text-xs font-black text-slate-900">
                      AED {q.grandTotalAed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] font-bold text-[#f86c29]">
                      AED {q.grandRatePerM2.toFixed(2)}/m²
                    </div>
                  </div>
                  <a
                    href={`/api/quotes/${q.id}/export`}
                    download
                    className="p-2 rounded-xl bg-white hover:bg-[#fff3ec] border border-slate-200 text-slate-600 hover:text-[#f86c29] transition-colors shadow-2xs"
                    title="Download Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Official 7 terms and conditions automatically embedded</span>
            <span className="font-semibold text-slate-600">Sharjah Branch</span>
          </div>
        </div>

        {/* Right: Sleek Dark Contrast Checklist Card (Matches Onboarding Task 2/8 black card in reference UI) */}
        <div className="lg:col-span-4 bento-card-dark p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black text-white tracking-wide">
                Commercial Specification
              </span>
              <span className="font-mono text-xs font-bold bg-white/10 text-white px-2.5 py-1 rounded-full">
                5 / 5
              </span>
            </div>

            {/* Checklist items with golden/orange checkmarks matching reference UI */}
            <div className="space-y-3.5 my-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <FileText className="w-3 h-3 text-slate-400" />
                  </div>
                  <span>Knauf 10m x 10m Factor Math</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#f86c29] flex items-center justify-center text-slate-950 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                  </div>
                  <span>Head Deflection Assemblies</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#f86c29] flex items-center justify-center text-slate-950 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-slate-400" />
                  </div>
                  <span>Trailer Load Supply Quantities</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#f86c29] flex items-center justify-center text-slate-950 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                  </div>
                  <span>Al Namariq Corporate Excel Formulas</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#f86c29] flex items-center justify-center text-slate-950 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <Building2 className="w-3 h-3 text-slate-400" />
                  </div>
                  <span>Dual Sign-Off Authorization</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#f86c29] flex items-center justify-center text-slate-950 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Official Sharjah Distributor</span>
            <span className="text-[#f86c29] font-bold">Al Namariq LLC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
