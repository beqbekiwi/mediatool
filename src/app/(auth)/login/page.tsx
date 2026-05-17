'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard')
    } catch {
      setError('Verbindungsfehler – bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Anmelden</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">E-Mail</label>
          <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="label">Passwort</label>
          <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Anmelden'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-indigo-600 hover:underline font-medium">Jetzt registrieren</Link>
      </p>
    </div>
  )
}
