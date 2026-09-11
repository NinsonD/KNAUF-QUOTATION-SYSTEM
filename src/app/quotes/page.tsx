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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Commercial Quotations Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, export, and revise all Knauf dry construction quotations for Al Namariq clients.
          </p>
        </div>

        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all hover:shadow self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quotation
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QTN, Project, Client..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002060] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#002060]"
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
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading quotations...
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No quotations found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or create a new quotation.
            </p>
            <Link
              href="/quotes/new"
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-[#002060] text-white text-xs font-bold"
            >
              Start New Quote
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">QTN No.</th>
                  <th className="py-3.5 px-4">Project & Client</th>
                  <th className="py-3.5 px-4">Knauf System</th>
                  <th className="py-3.5 px-4 text-right">Scale</th>
                  <th className="py-3.5 px-4 text-right">Grand Total (AED)</th>
                  <th className="py-3.5 px-4 text-right">Rate / M²</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Export & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#002060]">
                      <Link href={`/quotes/${q.id}`} className="hover:underline">
                        {q.quoteNumber}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {new Date(q.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{q.projectName}</div>
                      <div className="text-[11px] text-slate-500">{q.clientName}</div>
                      <div className="text-[10px] text-slate-400">Salesman: {q.salesman}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {q.system?.code}
                      </span>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {q.system?.name}
                      </div>
                      {q.includeDeflection && (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                          + Deflection Head
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {q.scaleM2.toLocaleString()} M²
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      AED {q.grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      AED {q.grandRatePerM2.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          q.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.status === 'ISSUED'
                            ? 'bg-blue-100 text-blue-800'
                            : q.status === 'REVISED'
                            ? 'bg-amber-100 text-amber-800'
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
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/api/quotes/${q.id}/export`}
                          download
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition-colors"
                          title="Download Official Al Namariq Excel Workbook"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          .xlsx
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id, q.quoteNumber)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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

