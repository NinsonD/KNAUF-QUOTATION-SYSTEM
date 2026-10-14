'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Navbar({ onToggle, expanded, showToggle }: { onToggle: () => void; expanded: boolean; showToggle: boolean }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const section = pathname.startsWith('/quotes') ? 'Quotation' : pathname.startsWith('/catalog') ? 'Systems and Item Prices' : pathname.startsWith('/account') ? 'Account' : 'Overview';
  return <header className="desk-navbar no-print">
    <div className="flex min-w-0 items-center gap-3">{showToggle && <button className="desk-icon-button lg:hidden" aria-label="Toggle navigation" aria-expanded={expanded} aria-controls="desk-sidebar" onClick={onToggle}><Menu size={18} /></button>}<Link href="/" aria-label="Al Namariq home"><Image src="/logo/logo.png" width={44} height={30} alt="Al Namariq" className="h-8 w-12 object-contain" priority /></Link><nav className="desk-breadcrumb" aria-label="Breadcrumb"><Link href="/">Quotations</Link>{section !== 'Overview' && <><ChevronRight size={13} /><Link href={pathname.startsWith('/quotes') ? '/quotes' : pathname.startsWith('/account') ? '/account/password' : '/catalog'}>{section}</Link></>}</nav></div>
    <div className="flex items-center gap-4"><form action="/quotes" className="desk-global-search hidden md:flex" role="search"><Search size={14} /><input aria-label="Search quotations" name="search" placeholder="Search quotations" autoComplete="off" /></form>{user ? <details className="relative"><summary className="desk-avatar cursor-pointer" aria-label="Account menu">{user.name.slice(0, 1).toUpperCase()}</summary><div className="desk-account"><p className="font-semibold">{user.name}</p><p className="mt-1 text-xs capitalize text-slate-500">{user.role.toLowerCase()}</p><div className="desk-account-actions"><Link href="/account/password" className="quote-text-button">Change password</Link><button type="button" className="quote-text-button" onClick={() => void logout()}>Log out</button></div></div></details> : <Link href="/login" className="text-sm text-slate-600">Log in</Link>}</div>
  </header>;
}
