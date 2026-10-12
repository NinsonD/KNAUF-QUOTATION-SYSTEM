'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.success) { router.push('/'); router.refresh(); }
    else setError(result.error || 'Check your email and password, then try again.');
  }
  return <div className="mx-auto max-w-sm py-10"><div className="mb-7 text-center"><Image src="/logo/logo.png" alt="Al Namariq" width={96} height={64} className="mx-auto h-16 w-auto object-contain" /><h1 className="mt-5 text-xl font-semibold">Log in to Al Namariq</h1><p className="mt-2 text-sm text-slate-500">Knauf quotations</p></div><form className="quote-panel p-7" onSubmit={submit}><fieldset disabled={loading} className="space-y-5"><div><label className="quote-label" htmlFor="login-email">Email</label><input id="login-email" className="quote-input" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></div><div><label className="quote-label" htmlFor="login-password">Password</label><input id="login-password" className="quote-input" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /><label className="mt-3 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} /> Show password</label></div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button className="quote-button-primary w-full" type="submit">{loading ? 'Logging in…' : 'Log in'}</button></fieldset></form></div>;
}
