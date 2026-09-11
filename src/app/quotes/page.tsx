'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Eye,
  Building,
  RefreshCw,
} from 'lucide-react';

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchQuotes();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const handleDelete = async (id: string, quoteNumber: string) => {
    if (!confirm(`Are you sure you want to delete quotation "${quoteNumber}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (e) {
      alert('Failed to delete quotation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00488e]/10 text-[#00488e] text-[11px] font-bold tracking-wider uppercase mb-2">
            Commercial Quotes
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quotations Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, review, export, and revise all Knauf dry construction quotations for Al Namariq clients.
          </p>
        </div>

        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f86c29] hover:bg-[#e05615] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quotation
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bento-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QTN, Project, Client..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00488e] bg-slate-50/80 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full border border-slate-200/80">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00488e]"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="APPROVED">Approved</option>
              <option value="REVISED">Revised</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              type="button"
              onClick={fetchQuotes}
              title="Refresh list"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bento-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            Loading quotations...
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Building className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No quotations found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or create a new quotation.
            </p>
            <Link
              href="/quotes/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00488e] text-white text-xs font-bold shadow-sm hover:shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Start New Quote
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">QTN No.</th>
                  <th className="py-3.5 px-4">Project & Client</th>
                  <th className="py-3.5 px-4">Knauf System</th>
                  <th className="py-3.5 px-4 text-right">Scale</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Rate / M²</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-center">Export & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#00488e]">
                      <Link href={`/quotes/${q.id}`} className="hover:underline">
                        {q.quoteNumber}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                        {new Date(q.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{q.projectName}</div>
                      <div className="text-[11px] text-slate-500">{q.clientName}</div>
                      <div className="text-[10px] text-slate-400">Salesman: {q.salesman}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {q.system?.code}
                      </span>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {q.system?.name}
                      </div>
                      {q.includeDeflection && (
                        <span className="text-[9px] text-[#00488e] font-bold bg-[#00488e]/10 px-2 py-0.5 rounded-full border border-[#00488e]/20 mt-1 inline-block">
                          + Deflection Head
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      {q.scaleM2.toLocaleString()} M²
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      AED {q.grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-semibold">
                      AED {q.grandRatePerM2.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          q.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.status === 'ISSUED'
                            ? 'bg-blue-50 text-[#00488e] border border-blue-200'
                            : q.status === 'REVISED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/quotes/${q.id}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/api/quotes/${q.id}/export`}
                          download
                          className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition-all"
                          title="Download Official Al Namariq Excel Workbook"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          .xlsx
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id, q.quoteNumber)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

