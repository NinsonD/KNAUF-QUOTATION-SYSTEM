'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole, ROLE_CONFIG } from '@/lib/auth/permissions';
import {
  Lock,
  Mail,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickSwitchRole, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Invalid credentials');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    await quickSwitchRole(role);
    setIsLoading(false);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Brand Story Bento Box */}
        <div className="lg:col-span-5 bento-card p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#00488e] to-[#002d5a] text-white">
          {/* Subtle Ambient Radial Rings */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-[#f86c29]/20 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl w-fit border border-white/20 mb-6 shadow-inner">
              <img src="/logo/logo.png" alt="Al Namariq" className="h-10 w-auto brightness-0 invert" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-bold tracking-wider uppercase mb-3 backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5 text-[#f86c29]" />
              Enterprise RBAC Portal
            </span>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-3">
              Knauf Certified Commercial Gateway
            </h2>
            <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
              Secure role-differentiated access for estimating engineers, commercial sales agents, and administrative executives of Al Namariq.
            </p>
          </div>

          <div className="relative z-10 pt-8 mt-8 border-t border-white/15 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-blue-100 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#f86c29] shrink-0" />
              <span>Role-gated master catalog & baseline pricing</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-blue-100 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#f86c29] shrink-0" />
              <span>Cryptographic session signature & PBKDF2 hashing</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-blue-100 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#f86c29] shrink-0" />
              <span>Automated BoQ audit & revision trail</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Quick Role Selectors */}
        <div className="lg:col-span-7 bento-card p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Sign In to Workspace
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your assigned Al Namariq corporate credentials.
                </p>
              </div>

              {user && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Active: {user.role}
                  </span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@alnamariq.ae"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00488e] bg-slate-50/70 text-slate-900 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00488e] bg-slate-50/70 text-slate-900 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-full bg-[#00488e] hover:bg-[#003c77] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In With Credentials</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Switcher Pills */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#f86c29]" />
              <span>1-Click Role Switcher (For Evaluation)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {(['ADMIN', 'ESTIMATOR', 'SALES', 'VIEWER'] as UserRole[]).map((role) => {
                const conf = ROLE_CONFIG[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(role)}
                    disabled={isLoading}
                    className="p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-[#00488e]/40 hover:shadow-xs transition-all text-left flex items-start gap-2.5 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-[#00488e] group-hover:text-white transition-colors">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800 truncate">
                          {conf.label}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${conf.bgBadge} ${conf.badgeColor}`}>
                          {role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {role === 'ADMIN' && 'Full permissions & price editor'}
                        {role === 'ESTIMATOR' && 'BoQ calculation & custom rates'}
                        {role === 'SALES' && 'Commercial quotes & proposals'}
                        {role === 'VIEWER' && 'Read-only audit & official exports'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

