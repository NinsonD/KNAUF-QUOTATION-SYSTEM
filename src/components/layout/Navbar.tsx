'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, FileSpreadsheet, Layers, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Calculator },
    { href: '/quotes', label: 'All Quotations', icon: FileSpreadsheet },
    { href: '/quotes/new', label: 'Create Quotation', icon: PlusCircle, highlight: true },
    { href: '/catalog', label: 'Knauf Catalog & Prices', icon: Layers },
  ];

  return (
    <header className="no-print bg-gradient-to-r from-[#00488e] via-[#003c77] to-[#002d5a] text-white sticky top-0 z-50 shadow-md border-b border-blue-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand & Logo */}
          <Link href="/" className="flex items-center space-x-3.5 group py-1">
            <div className="h-11 px-2.5 py-1 bg-white rounded-xl shadow-xs border border-white/40 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <img
                src="/logo/logo.png"
                alt="Al Namariq Building Material Trading Co. LLC"
                className="h-8 w-auto object-contain max-w-[150px]"
              />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                AL NAMARIQ <span className="text-[#f86c29] text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f86c29]/15 border border-[#f86c29]/30 tracking-wider uppercase">Knauf Engine</span>
              </div>
              <div className="text-xs text-blue-100/80 font-medium hidden sm:block">
                Building Material Trading Co. LLC • Sharjah, UAE
              </div>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="ml-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide bg-[#f86c29] hover:bg-[#e05615] text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-xs font-bold'
                      : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick contact / branch info */}
          <div className="hidden lg:flex flex-col items-end text-right text-xs text-blue-200">
            <span className="font-medium text-slate-200">P.O. 25569, Sharjah</span>
            <span className="font-mono text-[#f86c29] font-bold text-[11px]">Ph: (06) 5328033</span>
          </div>
        </div>
      </div>
    </header>
  );
}
