'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, FileSpreadsheet, Layers, PlusCircle, Building2 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Calculator },
    { href: '/quotes', label: 'All Quotations', icon: FileSpreadsheet },
    { href: '/quotes/new', label: 'Create Quotation', icon: PlusCircle, highlight: true },
    { href: '/catalog', label: 'Knauf Catalog & Prices', icon: Layers },
  ];

  return (
    <header className="no-print bg-[#002060] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/logo/logo.png" alt="Al Namariq Logo" className="h-9 w-auto object-contain" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                AL NAMARIQ <span className="text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/30">KNAUF SAAS</span>
              </div>
              <div className="text-xs text-blue-200">
                Building Material Trading Co. LLC • Sharjah
              </div>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all hover:shadow"
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
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
            <span>P.O. 25569, Sharjah, UAE</span>
            <span className="font-mono text-amber-300">Ph: (06) 5328033</span>
          </div>
        </div>
      </div>
    </header>
  );
}

