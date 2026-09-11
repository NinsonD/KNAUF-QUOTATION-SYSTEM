import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
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
  const avgRate = totalScale > 0 ? totalVolume / totalScale : 0;

  const categories = [
    {
      title: 'Ceiling Systems',
      code: 'CEILING',
      desc: 'Concealed Furring & Cleaneo Acoustic Suspended Ceilings (KC B001, KC A001, D127)',
      count: 4,
    },
    {
      title: 'Partition Systems',
      code: 'PARTITION',
      desc: 'Single & Double Stud Partitions with optional Head Deflection (KW 111, 112, 115, 116)',
      count: 4,
      hasDeflection: true,
    },
    {
      title: 'Shaft Wall Systems',
      code: 'SHAFT_WALL',
      desc: 'Coreboard 25.4mm + C-T Studs 64mm for Lift Shafts & Mechanical Ducts (KSW 120)',
      count: 1,
      hasDeflection: true,
    },
    {
      title: 'Wall Linings',
      code: 'WALL_LINING',
      desc: 'Direct Fix, Independent & Perlfix Dot & Dab Wall Linings (KW 625, B626, A611, D623, D611)',
      count: 5,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner with Official Logo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00488e] via-[#003c77] to-[#002d5a] p-6 sm:p-8 text-white shadow-lg border border-blue-900/50">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white p-2 rounded-xl shadow-xs border border-white/40">
              <img
                src="/logo/logo.png"
                alt="Al Namariq Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f86c29]/20 text-[#f86c29] border border-[#f86c29]/40 text-xs font-black uppercase tracking-wider">
              Official Quotation Engine
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Knauf Commercial Estimator SaaS
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Automated dry construction quotation platform for Al Namariq Building Material Trading Co. LLC. Calculate official Knauf per-m² consumption factors, deflection head assemblies, and generate branded corporate Excel sheets.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f86c29] hover:bg-[#e05615] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Quotation
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/25 transition-colors"
            >
              <Layers className="w-4 h-4" />
              Browse 14 Knauf Systems
            </Link>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute right-4 -bottom-8 opacity-10 pointer-events-none">
          <Building className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Total Quotations
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00488e] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-[#00488e] font-mono">
            {totalQuotesCount}
          </div>
          <p className="mt-1 text-xs text-slate-500">Live quotations recorded</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Total Pipeline Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fff3ec] text-[#f86c29] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 font-mono">
            AED {totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <p className="mt-1 text-xs text-slate-500">Commercial quotation total</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Avg. Rate per M²
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 font-mono">
            AED {avgRate.toFixed(2)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Weighted per m² rate</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Knauf Systems
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00488e] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 font-mono">
            14 Systems
          </div>
          <p className="mt-1 text-xs text-slate-500">19 analytical templates</p>
        </div>
      </div>

      {/* System Categories Launchpad */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Knauf System Categories</h2>
            <p className="text-xs text-slate-500">
              Quick launch quotation by selecting an assembly category
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-bold text-[#00488e] hover:underline flex items-center gap-1"
          >
            Explore all specifications <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.code}
              href={`/quotes/new?category=${cat.code}`}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-[#00488e] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {cat.count} Systems
                  </span>
                  {cat.hasDeflection && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f86c29] bg-[#fff3ec] px-2 py-0.5 rounded border border-[#fed7aa]">
                      <ShieldCheck className="w-3 h-3" /> Deflection
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#00488e] transition-colors mb-2">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#00488e]">
                <span>Launch Quote</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Quotations Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00488e]" />
              Recent Commercial Quotations
            </h2>
            <p className="text-xs text-slate-500">
              Quotes generated with Al Namariq corporate pricing and Knauf factor math
            </p>
          </div>
          <Link
            href="/quotes"
            className="text-xs font-bold text-[#00488e] hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm">No quotations created yet.</p>
            <Link
              href="/quotes/new"
              className="mt-3 inline-block text-xs font-bold text-[#00488e] hover:underline"
            >
              Create your first quote &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#00488e] text-white uppercase text-[11px] font-bold border-b border-blue-900/40">
                <tr>
                  <th className="py-3 px-4">QTN No.</th>
                  <th className="py-3 px-4">Project & Client</th>
                  <th className="py-3 px-4">Knauf System</th>
                  <th className="py-3 px-4 text-right">Scale</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Rate / M²</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#00488e]">
                      <Link href={`/quotes/${q.id}`} className="hover:underline">
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{q.projectName}</div>
                      <div className="text-[11px] text-slate-500">{q.clientName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {q.system?.code || 'Custom'}
                      </span>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {q.system?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {q.scaleM2.toLocaleString()} M²
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      AED {q.grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#f86c29] font-bold">
                      AED {q.grandRatePerM2.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          q.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.status === 'ISSUED'
                            ? 'bg-blue-100 text-[#00488e]'
                            : q.status === 'REVISED'
                            ? 'bg-[#fff3ec] text-[#f86c29]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/quotes/${q.id}`}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          View
                        </Link>
                        <a
                          href={`/api/quotes/${q.id}/export`}
                          download
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#fff3ec] hover:bg-[#fed7aa] text-[#f86c29] border border-[#fed7aa] flex items-center gap-1 transition-colors"
                          title="Download Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Excel
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
