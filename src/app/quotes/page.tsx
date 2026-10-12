'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PageHeader, { StatusIndicator } from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/auth/AuthContext';

interface SavedQuote { id: string; quoteNumber: string; projectName: string; clientName: string; grandTotalAed: number; status: string; system: { code: string }; }

function QuotesListContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  return <QuotationList key={initialSearch} initialSearch={initialSearch} />;
}

function QuotationList({ initialSearch }: { initialSearch: string }) {
  const { permissions } = useAuth();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams({ search });
        if (status !== 'ALL') params.set('status', status);
        const response = await fetch(`/api/quotes?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Your quotes could not be loaded. Please try again.');
        const data: SavedQuote[] = await response.json();
        if (!controller.signal.aborted) setQuotes(data);
      } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load quotes.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, status, revision]);
  async function remove(quote: SavedQuote) {
    if (!confirm(`Delete quote ${quote.quoteNumber}? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete this quote. Please try again.');
      setQuotes(previous => previous.filter(item => item.id !== quote.id));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not delete quote.'); }
  }
  return <div><PageHeader title="Quotation" actions={permissions?.canCreateQuote !== false && <Link href="/quotes/new" className="quote-button-primary"><Plus size={14} /> Add Quotation</Link>} />
    <div className="quote-panel overflow-hidden"><div className="desk-tabs"><span className="active">List View</span></div>
      <div className="desk-list-toolbar"><div className="w-full sm:w-72"><label className="quote-label" htmlFor="quote-search">Customer, project or ID</label><input id="quote-search" className="quote-input" placeholder="Search quotations…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="w-40"><label className="quote-label" htmlFor="filter-status">Status</label><select id="filter-status" className="quote-input" value={status} onChange={event => setStatus(event.target.value)}>{['ALL', 'DRAFT', 'ISSUED', 'APPROVED', 'REVISED', 'CANCELLED'].map(value => <option key={value} value={value}>{value === 'ALL' ? 'All statuses' : value.charAt(0) + value.slice(1).toLowerCase()}</option>)}</select></div><button className="quote-button-secondary ml-auto" aria-label="Refresh quotations" onClick={() => setRevision(value => value + 1)}><RefreshCw size={14} /></button></div>
      {error && <div role="alert" className="m-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <p role="status" className="p-8 text-sm text-slate-500">Loading quotations…</p> : quotes.length === 0 ? <div className="p-10 text-center"><p className="font-medium">No quotations found</p><p className="mt-2 text-sm text-slate-500">{search || status !== 'ALL' ? 'Try another search or status.' : 'Add your first quotation to get started.'}</p></div> : <div className="desk-table-scroll"><table className="desk-table"><thead><tr><th>ID</th><th>Customer / Project</th><th>Status</th><th className="desk-hide-mobile">System</th><th className="text-right">Grand Total (AED)</th>{permissions?.canDeleteQuote && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{quotes.map(quote => <tr key={quote.id}><td className="whitespace-nowrap"><Link href={`/quotes/${quote.id}`}>{quote.quoteNumber}</Link></td><td className="min-w-44"><Link href={`/quotes/${quote.id}`}>{quote.clientName}</Link><p className="mt-1 text-xs text-slate-500">{quote.projectName}</p></td><td><StatusIndicator status={quote.status} /></td><td className="desk-hide-mobile text-slate-500">{quote.system?.code}</td><td className="whitespace-nowrap text-right tabular-nums">{quote.grandTotalAed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{permissions?.canDeleteQuote && <td><button className="desk-icon-button" aria-label={`Delete ${quote.quoteNumber}`} onClick={() => void remove(quote)}><Trash2 size={14} /></button></td>}</tr>)}</tbody></table></div>}
      {!loading && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{quotes.length} {quotes.length === 1 ? 'quotation' : 'quotations'}</p>}
    </div>
  </div>;
}

export default function QuotesListPage() {
  return <Suspense fallback={<p className="p-8 text-slate-500">Loading quotations…</p>}><QuotesListContent /></Suspense>;
}