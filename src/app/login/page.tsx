'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import LoginSystemSlider from '@/components/layout/LoginSystemSlider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (loading) return;
    setLoading(true); setError('');
    try {
      const result = await login(email, password);
      if (result.success) { setPassword(''); router.replace(result.mustChangePassword ? '/account/password' : '/'); router.refresh(); }
      else setError(result.error || 'Check your email and password, then try again.');
    } finally { setLoading(false); }
  }
  return <div className="login-layout">
    <section className="login-intro" aria-label="Al Namariq quotation workspace">
      <div className="login-brand"><Image src="/logo/logo.png" alt="Al Namariq" width={96} height={64} priority/><p>AL NAMARIQ<br/>QUOTATION WORKSPACE</p></div>
      <h2>Know the system.<br/>Prepare the quotation.</h2>
      <p className="login-description">Select a Knauf system, calculate material quantities and prepare your project quotation.</p>
      <LoginSystemSlider/>
    </section>
    <section className="login-form-area" aria-labelledby="login-heading">
      <h1 id="login-heading">Sign in</h1><p className="login-form-description">Use your account to access quotations and item prices.</p>
      <form className="login-form" onSubmit={submit}><fieldset disabled={loading}>
        <div><label className="quote-label" htmlFor="login-email">Email address</label><input id="login-email" className="quote-input" type="email" name="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div><label className="quote-label" htmlFor="login-password">Password</label><div className="login-password-field"><input id="login-password" className="quote-input" type={showPassword?'text':'password'} name="password" autoComplete="current-password" maxLength={256} required value={password} onChange={e=>setPassword(e.target.value)}/><button className="login-password-toggle" type="button" aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
        {error&&<p role="alert" className="login-error">{error}</p>}
        <button className="login-submit" type="submit" aria-busy={loading}>{loading?<><Loader2 size={17} className="animate-spin"/>Signing in…</>:<>Sign in<ArrowRight size={17}/></>}</button>
      </fieldset></form>
      <p className="login-help">Need account access or a password reset?<br/>Contact your administrator.</p>
    </section>
  </div>;
}
