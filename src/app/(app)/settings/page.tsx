'use client'

import { useState } from 'react'
import { Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> Einstellungen</h1>
          <p className="page-subtitle">Kontoverwaltung und Konfiguration</p>
        </div>
      </div>

      <div className="max-w-xl space-y-5">
        <div className="card p-6">
          <h2 className="section-title">Konto</h2>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Workspace-Verwaltung, Benutzereinstellungen und Passwort-Änderung folgen in der nächsten Version.</p>
            <button onClick={logout} disabled={loggingOut} className="btn-danger">
              <LogOut className="w-4 h-4" />
              {loggingOut ? 'Abmelden…' : 'Abmelden'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Geplante Features</h2>
          <ul className="text-sm text-slate-600 space-y-1.5">
            {[
              'Passwort ändern', 'Profilbild hochladen', 'Workspace umbenennen',
              'Weitere Workspace-Mitglieder einladen', 'Benachrichtigungen',
              'API-Schlüssel verwalten', 'Billing & Plan',
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
