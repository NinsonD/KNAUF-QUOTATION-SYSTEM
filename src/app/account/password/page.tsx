'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function PasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrent] = useState(''), [newPassword, setNew] = useState(''), [confirmPassword, setConfirm] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setBusy(true);
    try { const response = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not change password.'); setCurrent(''); setNew(''); setConfirm(''); router.replace('/'); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not change password.'); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-md"><h1 className="mb-3 text-xl font-semibold">Change password</h1><p className="mb-6 text-sm text-slate-500">Use at least 15 characters. A long, unique passphrase works well. Other sessions will be signed out.</p><form onSubmit={submit} className="quote-panel p-6"><fieldset disabled={busy} className="space-y-5">{[{id:'current-password',label:'Current password',value:currentPassword,change:setCurrent,auto:'current-password',min:1,max:256},{id:'new-password',label:'New password',value:newPassword,change:setNew,auto:'new-password',min:15,max:128},{id:'confirm-password',label:'Confirm new password',value:confirmPassword,change:setConfirm,auto:'new-password',min:15,max:128}].map(field=><div key={field.id}><label htmlFor={field.id} className="quote-label">{field.label}</label><input id={field.id} name={field.id} className="quote-input" type="password" autoComplete={field.auto} required minLength={field.min} maxLength={field.max} value={field.value} onChange={e=>field.change(e.target.value)}/></div>)}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button type="submit" className="quote-button-primary">{busy?'Saving…':'Change password'}</button></fieldset></form></div>;
}
