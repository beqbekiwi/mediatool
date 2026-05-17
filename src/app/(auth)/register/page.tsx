'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    workspaceName: '', workspaceType: 'business',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/onboarding')
    } catch {
      setError('Verbindungsfehler – bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Konto erstellen</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Dein Name</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
          </div>
          <div className="col-span-2">
            <label className="label">E-Mail</label>
            <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className="label">Passwort (min. 8 Zeichen)</label>
            <input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
          </div>
          <div className="col-span-2 border-t border-slate-100 pt-4">
            <label className="label">Workspace-Name</label>
            <input className="input" placeholder="z. B. Meine Bäckerei" value={form.workspaceName} onChange={e => set('workspaceName', e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className="label">Typ</label>
            <div className="grid grid-cols-2 gap-2">
              {(['business', 'personal'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => set('workspaceType', t)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${form.workspaceType === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {t === 'business' ? 'Unternehmen' : 'Privatperson'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Konto & Workspace erstellen'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Bereits registriert?{' '}
        <Link href="/login" className="text-indigo-600 hover:underline font-medium">Anmelden</Link>
      </p>
    </div>
  )
}
