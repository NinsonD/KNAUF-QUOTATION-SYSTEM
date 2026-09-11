'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Settings, User, LogOut, ChevronDown, Sparkles, LogIn, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole, ROLE_CONFIG } from '@/lib/auth/permissions';

export default function Navbar() {
  const pathname = usePathname();
  const { user, roleMeta, permissions, logout, quickSwitchRole, isLoading } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/quotes', label: 'Quotations' },
    ...(permissions?.canCreateQuote !== false
      ? [{ href: '/quotes/new', label: 'Studio' }]
      : []),
    { href: '/catalog', label: 'Knauf Catalog' },
  ];

  return (
    <header className="no-print w-full pt-6 pb-2 px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-4 z-30">
      {/* Brand Logo Pill */}
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

      {/* Center Floating Pill Menu */}
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

      {/* Right Controls */}
      <div className="flex items-center gap-2 relative" ref={menuRef}>
        {/* New Quote button (hidden for read-only VIEWER) */}
        {permissions?.canCreateQuote !== false && (
          <Link
            href="/quotes/new"
            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full text-white bg-[#f86c29] hover:bg-[#e05615] shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            New Quote
          </Link>
        )}

        {/* User Profile Pill */}
        {isLoading ? (
          <div className="w-24 h-9 rounded-full bg-slate-200 animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="bg-white/90 hover:bg-white pl-2 pr-3 py-1 rounded-full border border-slate-900/[0.08] shadow-xs flex items-center gap-2 transition-all hover:shadow"
            >
              <div className="w-7 h-7 rounded-full bg-[#00488e] text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-bold text-slate-800 leading-none truncate max-w-[90px]">
                  {user.name.split(' ')[0]}
                </div>
                <div className={`text-[9px] font-extrabold uppercase mt-0.5 ${roleMeta?.badgeColor || 'text-[#00488e]'}`}>
                  {user.role}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Profile & Role Switcher Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-11 w-72 bento-card p-3 shadow-xl z-50 bg-white border border-slate-200/90 animate-fadeIn">
                <div className="p-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00488e] text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${roleMeta?.bgBadge} ${roleMeta?.badgeColor} border ${roleMeta?.borderBadge}`}>
                      <Shield className="w-2.5 h-2.5" />
                      Role: {roleMeta?.label}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {roleMeta?.description}
                    </p>
                  </div>
                </div>

                {/* Quick Role Switcher */}
                <div className="py-2.5 border-b border-slate-100">
                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#f86c29]" />
                    <span>Switch Role Demo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    {(['ADMIN', 'ESTIMATOR', 'SALES', 'VIEWER'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={async () => {
                          await quickSwitchRole(r);
                          setShowProfileMenu(false);
                        }}
                        className={`text-[10px] font-bold py-1 px-2 rounded-lg text-left transition-all ${
                          user.role === r
                            ? 'bg-[#00488e] text-white shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="pt-2 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-between text-xs font-bold text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-colors"
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold rounded-full bg-[#00488e] text-white hover:bg-[#003c77] shadow-xs flex items-center gap-1.5 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
