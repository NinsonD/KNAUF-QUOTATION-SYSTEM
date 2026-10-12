'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, Layers, Plus, ChevronDown } from 'lucide-react';
import Navbar from './Navbar';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DeskShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { permissions } = useAuth();
  const fullPage = pathname === '/login' || pathname.endsWith('/print');
  return <div className="app-bento-canvas desk-shell"><Navbar onToggle={() => setMobileOpen(value => !value)} expanded={mobileOpen} showToggle={!fullPage} />
    <div className={`desk-body ${fullPage ? 'desk-body-full' : ''}`}>
      {!fullPage && <><button hidden={!mobileOpen} className="desk-sidebar-backdrop no-print" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /><aside id="desk-sidebar" className={`desk-sidebar no-print ${mobileOpen ? 'is-open' : ''}`}>
        <div className="desk-workspace-title"><span className="desk-workspace-icon"><FileText size={16} /></span><span>Selling</span><ChevronDown size={14} className="ml-auto" /></div>
        <p className="desk-sidebar-label">Workspace</p>
        <nav aria-label="Main navigation">{[{href:'/',label:'Overview',icon:LayoutGrid},{href:'/quotes',label:'Quotation',icon:FileText},{href:'/catalog',label:'Systems and Item Prices',icon:Layers}].map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} aria-current={(href === '/' ? pathname === '/' : pathname.startsWith(href)) ? 'page' : undefined} className="desk-nav-link"><Icon size={16} /><span>{label}</span></Link>)}</nav>
        <p className="desk-sidebar-label mt-7">Shortcuts</p>{permissions?.canCreateQuote !== false && <Link className="desk-nav-link" href="/quotes/new" onClick={() => setMobileOpen(false)}><Plus size={16} /> New Quotation</Link>}
        <div className="desk-sidebar-company">Al Namariq<span>Knauf quotations</span></div>
      </aside></>}
      <main id="main-content" className="desk-main">{children}</main>
    </div>
  </div>;
}
