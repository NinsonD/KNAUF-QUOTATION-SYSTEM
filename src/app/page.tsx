import Link from 'next/link';
import { FileText, Layers, Plus } from 'lucide-react';
import prisma from '@/lib/db';
import PageHeader, { StatusIndicator } from '@/components/layout/PageHeader';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const quotes = await prisma.quotation.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, include: { system: true } }).catch(() => null);
  return <div><PageHeader title="Selling" subtitle="Al Namariq · Knauf material quotations" />
    <section className="mb-7"><h2 className="desk-section-heading">Your Shortcuts</h2><div className="desk-shortcuts"><Link href="/quotes/new" className="quote-panel desk-shortcut"><Plus size={18} className="text-slate-500" /><div><p>New Quotation</p><small>Prepare a material quotation</small></div></Link><Link href="/quotes" className="quote-panel desk-shortcut"><FileText size={18} className="text-slate-500" /><div><p>Quotation</p><small>View and manage quotations</small></div></Link><Link href="/catalog" className="quote-panel desk-shortcut"><Layers size={18} className="text-slate-500" /><div><p>Systems and Item Prices</p><small>Browse systems and rates</small></div></Link></div></section>
    <section className="quote-panel overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold">Recent Quotations</h2><Link href="/quotes" className="text-xs text-slate-500 hover:underline">View all</Link></div>{quotes === null ? <p role="alert" className="p-6 text-sm text-slate-500">Quotations could not be loaded. Refresh to try again.</p> : quotes.length === 0 ? <p className="p-6 text-sm text-slate-500">Your saved quotations will appear here.</p> : <div className="desk-table-scroll"><table className="desk-table"><thead><tr><th>ID</th><th>Customer</th><th>Status</th><th className="text-right">Grand Total (AED)</th></tr></thead><tbody>{quotes.map(quote => <tr key={quote.id}><td className="whitespace-nowrap"><Link href={`/quotes/${quote.id}`}>{quote.quoteNumber}</Link></td><td><p>{quote.clientName}</p><p className="mt-1 text-xs text-slate-500">{quote.projectName}</p></td><td><StatusIndicator status={quote.status} /></td><td className="whitespace-nowrap text-right tabular-nums">{quote.grandTotalAed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
