'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Wand2, CalendarDays, CheckCircle2, FileText, AlertCircle,
  Clock, TrendingUp, Link2, ArrowRight, Plus, LayoutDashboard,
} from 'lucide-react'
import { PLATFORM_COLORS, PLATFORM_LABELS, POST_STATUS_COLORS, POST_STATUS_LABELS, type Platform, type PostStatus } from '@/types'
import { clsx } from 'clsx'

interface DashData {
  stats: { total: number; drafts: number; review: number; approved: number; scheduled: number; published: number; failed: number }
  upcoming: Array<{ id: string; title: string; platform: string; contentType: string; scheduledAt: string | null; status: string }>
  connectedAccounts: Array<{ platform: string; accountName: string }>
}

function StatCard({ label, value, icon: Icon, color, href }: { label: string; value: number; icon: React.ElementType; color: string; href: string }) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </Link>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="spinner mx-auto mb-3 text-indigo-600" /><p className="text-sm text-slate-500">Lade Dashboard…</p></div>
    </div>
  )

  const { stats, upcoming, connectedAccounts } = data ?? { stats: { total:0,drafts:0,review:0,approved:0,scheduled:0,published:0,failed:0 }, upcoming: [], connectedAccounts: [] }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-indigo-600" /> Dashboard</h1>
          <p className="page-subtitle">Übersicht deiner Social-Media-Aktivität</p>
        </div>
        <Link href="/generator" className="btn-primary"><Plus className="w-4 h-4" /> Neuer Post</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
        <StatCard label="Gesamt" value={stats.total} icon={TrendingUp} color="bg-slate-100 text-slate-600" href="/posts" />
        <StatCard label="Entwürfe" value={stats.drafts} icon={FileText} color="bg-amber-100 text-amber-600" href="/posts?status=draft" />
        <StatCard label="In Prüfung" value={stats.review} icon={Clock} color="bg-orange-100 text-orange-600" href="/posts?status=review" />
        <StatCard label="Freigegeben" value={stats.approved} icon={CheckCircle2} color="bg-teal-100 text-teal-600" href="/posts?status=approved" />
        <StatCard label="Geplant" value={stats.scheduled} icon={CalendarDays} color="bg-blue-100 text-blue-600" href="/calendar" />
        <StatCard label="Veröffentlicht" value={stats.published} icon={CheckCircle2} color="bg-green-100 text-green-600" href="/posts?status=published" />
        <StatCard label="Fehlgeschlagen" value={stats.failed} icon={AlertCircle} color="bg-red-100 text-red-600" href="/posts?status=failed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Posts */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="section-title flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" /> Nächste geplante Posts
          </h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Noch keine Posts geplant.</p>
              <Link href="/generator" className="btn-primary mt-4 inline-flex"><Wand2 className="w-4 h-4" /> Ersten Post erstellen</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(post => (
                <Link key={post.id} href={`/posts/${post.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                  <div className="text-center min-w-[44px]">
                    <div className="text-base font-bold text-indigo-600">
                      {post.scheduledAt ? format(new Date(post.scheduledAt), 'dd', { locale: de }) : '–'}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">
                      {post.scheduledAt ? format(new Date(post.scheduledAt), 'MMM', { locale: de }) : ''}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-700">{post.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx('badge', PLATFORM_COLORS[post.platform as Platform])}>{PLATFORM_LABELS[post.platform as Platform]}</span>
                      <span className={clsx('badge', POST_STATUS_COLORS[post.status as PostStatus])}>{POST_STATUS_LABELS[post.status as PostStatus]}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                </Link>
              ))}
              <Link href="/calendar" className="flex items-center justify-center gap-2 text-xs text-indigo-600 hover:underline py-2">
                Zum Kalender <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="card p-5">
            <h2 className="section-title">Schnellaktionen</h2>
            <div className="space-y-2">
              <Link href="/generator" className="btn-primary w-full justify-center"><Wand2 className="w-4 h-4" /> Post erstellen</Link>
              <Link href="/calendar" className="btn-secondary w-full justify-center"><CalendarDays className="w-4 h-4" /> Kalender öffnen</Link>
              <Link href="/accounts" className="btn-secondary w-full justify-center"><Link2 className="w-4 h-4" /> Accounts verbinden</Link>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="card p-5">
            <h2 className="section-title flex items-center justify-between">
              Verbundene Accounts
              <Link href="/accounts" className="text-xs text-indigo-600 hover:underline font-normal">Verwalten</Link>
            </h2>
            {connectedAccounts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 mb-3">Noch keine Accounts verbunden</p>
                <Link href="/accounts" className="btn-secondary text-xs"><Link2 className="w-3.5 h-3.5" /> Jetzt verbinden</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {connectedAccounts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={clsx('badge', PLATFORM_COLORS[a.platform as Platform])}>{PLATFORM_LABELS[a.platform as Platform]}</span>
                    <span className="text-xs text-slate-600 truncate">{a.accountName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow */}
          <div className="card p-5 bg-indigo-50 border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3">Dein Workflow</h3>
            <ol className="space-y-1.5">
              {['Markenprofil einrichten','Account verbinden','Post erstellen','Bild hinzufügen','Kalender planen','Freigeben & veröffentlichen'].map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-xs text-indigo-800">
                  <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
