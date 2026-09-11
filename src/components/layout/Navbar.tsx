'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Bell, Settings, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/quotes', label: 'Quotations' },
    { href: '/quotes/new', label: 'Studio' },
    { href: '/catalog', label: 'Knauf Catalog' },
  ];

  return (
    <header className="no-print w-full pt-6 pb-2 px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-4 z-30">
      {/* Brand Logo Pill (Matching "Crextio" pill in reference image) */}
      <Link
        href="/"
        className="group bg-white/90 hover:bg-white transition-all px-4 py-2 rounded-full border border-slate-900/[0.06] shadow-xs flex items-center gap-2.5"
      >
        <img
          src="/logo/logo.png"
          alt="Al Namariq Logo"
          className="h-6 w-auto object-contain group-hover:scale-105 transition-transform"
        />
        <span className="font-extrabold text-sm tracking-tight text-[#00488e]">
          Al Namariq
        </span>
      </Link>

      {/* Center Floating Pill Menu (Matching exact pill bar in reference image) */}
      <nav className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-slate-900/[0.06] shadow-xs flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                isActive
                  ? 'bg-[#18181b] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/60'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Controls: New Quote CTA + Settings + Avatar (Matching reference right side) */}
      <div className="flex items-center gap-2">
        <Link
          href="/quotes/new"
          className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full text-white bg-[#f86c29] hover:bg-[#e05615] shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          New Quote
        </Link>

        <Link
          href="/catalog"
          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-slate-900/[0.06] text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs"
          title="Catalog & Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>

        <div className="w-9 h-9 rounded-full bg-[#00488e]/10 border border-[#00488e]/20 text-[#00488e] flex items-center justify-center font-bold text-xs shadow-2xs">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
