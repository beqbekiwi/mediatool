'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Wand2, CalendarDays, Image, Link2,
  Palette, BookOpen, FileText, Settings, LogOut, ChevronDown,
  Plus, Building2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/generator',  label: 'Post erstellen',   icon: Wand2 },
  { href: '/calendar',   label: 'Kalender',         icon: CalendarDays },
  { href: '/posts',      label: 'Alle Posts',       icon: FileText },
  { href: '/media',      label: 'Mediathek',        icon: Image },
  { href: '/themes',     label: 'Themen',           icon: BookOpen },
  { href: '/brand',      label: 'Markenprofil',     icon: Palette },
  { href: '/accounts',   label: 'Social Accounts',  icon: Link2 },
  { href: '/settings',   label: 'Einstellungen',    icon: Settings },
]

interface Props {
  workspaceName: string
  userName: string
}

export default function Sidebar({ workspaceName, userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">Social Studio</div>
            <div className="text-xs text-slate-400 truncate">KI-Marketing</div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-medium text-slate-200 truncate flex-1">{workspaceName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 pb-2">
        <Link href="/generator" className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-medium">
          <Plus className="w-3.5 h-3.5" />
          Neuer Post
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-slate-300">{userName?.[0]?.toUpperCase()}</span>
          </div>
          <span className="text-xs text-slate-400 truncate flex-1">{userName}</span>
        </div>
        <button onClick={logout} disabled={loggingOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 text-xs transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          {loggingOut ? 'Abmelden…' : 'Abmelden'}
        </button>
      </div>
    </aside>
  )
}
