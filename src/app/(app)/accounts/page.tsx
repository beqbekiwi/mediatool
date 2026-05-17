'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Link2, CheckCircle2, AlertCircle, Trash2, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { PLATFORM_COLORS, PLATFORM_LABELS, type Platform } from '@/types'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

interface Account {
  id: string; platform: string; accountType: string; accountName: string
  accountId: string; connected: boolean; tokenExpiresAt: string | null; createdAt: string
}


const PLATFORM_SETUP: Record<string, { title: string; description: string; requirements: string[]; authUrl: string }> = {
  facebook: {
    title: 'Facebook Page verbinden',
    description: 'Verbinde deine Facebook-Unternehmensseite. Automatisch werden auch verknüpfte Instagram-Business-Accounts erkannt.',
    requirements: ['Facebook-Unternehmensseite (Admin-Rechte)', 'Meta Business Account', 'App-Review für erweiterte Berechtigungen (Produktion)'],
    authUrl: '/api/accounts/facebook/auth',
  },
  instagram: {
    title: 'Instagram Business',
    description: 'Instagram wird automatisch über die Facebook-Verbindung eingerichtet (Instagram Business Account muss mit Facebook Page verknüpft sein).',
    requirements: ['Instagram Business oder Creator Account', 'Verknüpfung mit Facebook Page'],
    authUrl: '/api/accounts/facebook/auth',
  },
  linkedin: {
    title: 'LinkedIn verbinden',
    description: 'Verbinde dein LinkedIn-Profil für automatische Veröffentlichungen.',
    requirements: ['LinkedIn-Account', 'LinkedIn Developer App (Client ID + Secret)'],
    authUrl: '/api/accounts/linkedin/auth',
  },
}

function AccountsContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const successMsg = searchParams.get('success')
  const errorMsg = searchParams.get('error')

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAccounts(data)
      setLoading(false)
    })
  }, [])

  async function disconnect(id: string, name: string) {
    if (!confirm(`Account "${name}" trennen?`)) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  const connectedPlatforms = new Set(accounts.filter(a => a.connected).map(a => a.platform))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Link2 className="w-5 h-5 text-indigo-600" /> Social Accounts</h1>
          <p className="page-subtitle">Verbinde deine Social-Media-Accounts für automatische Veröffentlichungen</p>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl mb-6 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg === 'facebook' ? 'Facebook (und Instagram) erfolgreich verbunden!' : 'LinkedIn erfolgreich verbunden!'}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Verbindung fehlgeschlagen ({errorMsg}). Bitte API-Keys prüfen.
        </div>
      )}

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="section-title">Verbundene Accounts</h2>
          <div className="space-y-3">
            {accounts.map(acc => {
              const expired = acc.tokenExpiresAt && new Date(acc.tokenExpiresAt) < new Date()
              return (
                <div key={acc.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100">
                  <PlatformIcon platform={acc.platform as Platform} className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx('badge', PLATFORM_COLORS[acc.platform as Platform])}>
                        {PLATFORM_LABELS[acc.platform as Platform]}
                      </span>
                      <span className="text-sm font-medium text-slate-800 truncate">{acc.accountName}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Verbunden seit {format(new Date(acc.createdAt), 'dd.MM.yyyy', { locale: de })}
                      {acc.tokenExpiresAt && (
                        <span className={clsx('ml-2', expired ? 'text-red-500 font-medium' : 'text-slate-400')}>
                          · Token {expired ? 'abgelaufen' : `gültig bis ${format(new Date(acc.tokenExpiresAt), 'dd.MM.yyyy', { locale: de })}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expired ? (
                      <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Abgelaufen
                      </span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Aktiv
                      </span>
                    )}
                    <button onClick={() => disconnect(acc.id, acc.accountName)}
                      className="btn-ghost p-1.5 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(['facebook', 'instagram', 'linkedin'] as const).map(platform => {
          const cfg = PLATFORM_SETUP[platform]
          const isConnected = connectedPlatforms.has(platform)

          return (
            <div key={platform} className={clsx('card p-6', isConnected && 'ring-2 ring-green-200')}>
              <div className="flex items-center gap-3 mb-4">
                <div className={clsx('p-2 rounded-xl', PLATFORM_COLORS[platform as Platform])}>
                  <PlatformIcon platform={platform} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{cfg.title}</h3>
                  {isConnected && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verbunden
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">{cfg.description}</p>
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Voraussetzungen:</p>
                <ul className="space-y-1">
                  {cfg.requirements.map(r => (
                    <li key={r} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <span className="text-slate-300 mt-0.5">·</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
              {platform !== 'instagram' && (
                <a href={cfg.authUrl}
                  className={clsx('w-full justify-center text-sm', isConnected ? 'btn-secondary' : 'btn-primary', 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors')}>
                  {isConnected ? <><RefreshCw className="w-3.5 h-3.5" /> Neu verbinden</> : <><Link2 className="w-3.5 h-3.5" /> Jetzt verbinden</>}
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 card p-5 bg-amber-50 border-amber-100">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">Wichtige Hinweise zu API-Zugängen</h3>
        <ul className="text-xs text-amber-800 space-y-1.5">
          <li>· <strong>Facebook/Instagram:</strong> Für die Produktion ist ein Meta App-Review erforderlich. Im Entwicklermodus funktioniert die App nur mit Test-Nutzern.</li>
          <li>· <strong>LinkedIn:</strong> Erfordert eine LinkedIn Developer App mit den Berechtigungen <code>w_member_social</code> und <code>openid profile</code>.</li>
          <li>· <strong>Tokens:</strong> Facebook Page Tokens sind langlebig (60 Tage), LinkedIn Tokens laufen nach ~60 Tagen ab und müssen erneuert werden.</li>
          <li>· <strong>Datensicherheit:</strong> Alle Tokens werden verschlüsselt in der Datenbank gespeichert und niemals in der URL oder im Frontend exponiert.</li>
        </ul>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  return <Suspense fallback={<div className="flex justify-center py-16"><div className="spinner text-indigo-600" /></div>}>
    <AccountsContent />
  </Suspense>
}
