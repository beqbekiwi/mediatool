'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, Plus, X, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { PLATFORM_COLORS, PLATFORM_LABELS, POST_STATUS_COLORS, POST_STATUS_LABELS, type Platform, type PostStatus } from '@/types'

type View = 'month' | 'week'

interface CalPost {
  id: string; title: string; platform: string; contentType: string
  status: string; scheduledAt: string | null; publishedAt: string | null
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getDateForPost(p: CalPost): Date | null {
  const d = p.scheduledAt ?? p.publishedAt
  return d ? new Date(d) : null
}

function postsForDay(posts: CalPost[], day: Date) {
  return posts.filter(p => { const d = getDateForPost(p); return d && isSameDay(d, day) })
}

export default function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [current, setCurrent] = useState(new Date())
  const [posts, setPosts] = useState<CalPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CalPost | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const from = format(startOfMonth(subMonths(current, 1)), 'yyyy-MM-dd')
    const to = format(endOfMonth(addMonths(current, 1)), 'yyyy-MM-dd')
    const data = await fetch(`/api/posts/calendar?from=${from}&to=${to}`).then(r => r.json())
    if (Array.isArray(data)) setPosts(data)
    setLoading(false)
  }, [current])

  useEffect(() => { load() }, [load])

  // Month view helpers
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startOffset = (getDay(monthStart) + 6) % 7 // Mon=0

  // Week view helpers
  const weekStart = startOfWeek(current, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(current, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  async function removeFromCalendar(post: CalPost) {
    await fetch(`/api/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: null, status: 'draft', autoPublish: false }),
    })
    setSelected(null)
    load()
  }

  function DayCell({ day }: { day: Date }) {
    const dayPosts = postsForDay(posts, day)
    const today = isToday(day)
    return (
      <div className={clsx('min-h-[80px] p-1.5 rounded-lg border transition-colors', today ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-100 hover:border-slate-200')}>
        <div className={clsx('text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full', today ? 'bg-indigo-600 text-white' : 'text-slate-500')}>
          {format(day, 'd')}
        </div>
        <div className="space-y-0.5">
          {dayPosts.slice(0, 3).map(post => (
            <button key={post.id} onClick={() => setSelected(post)}
              className={clsx('w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight truncate font-medium', PLATFORM_COLORS[post.platform as Platform])}>
              {post.title}
            </button>
          ))}
          {dayPosts.length > 3 && <div className="text-[10px] text-slate-400 px-1">+{dayPosts.length - 3} weitere</div>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><CalendarDays className="w-5 h-5 text-indigo-600" /> Kalender</h1>
          <p className="page-subtitle">Geplante und veröffentlichte Posts im Überblick</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['month', 'week'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={clsx('px-3 py-1.5 text-xs font-medium transition-colors', view === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                {v === 'month' ? 'Monat' : 'Woche'}
              </button>
            ))}
          </div>
          <Link href="/generator" className="btn-primary"><Plus className="w-4 h-4" /> Neuer Post</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 card p-5">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrent(d => view === 'month' ? subMonths(d, 1) : subWeeks(d, 1))} className="btn-ghost p-2">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold text-slate-800">
              {view === 'month'
                ? format(current, 'MMMM yyyy', { locale: de })
                : `${format(weekStart, 'dd. MMM', { locale: de })} – ${format(weekEnd, 'dd. MMM yyyy', { locale: de })}`}
            </h2>
            <button onClick={() => setCurrent(d => view === 'month' ? addMonths(d, 1) : addWeeks(d, 1))} className="btn-ghost p-2">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(wd => (
              <div key={wd} className="text-center text-xs font-medium text-slate-400 py-1">{wd}</div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="spinner text-indigo-600" /></div>
          ) : view === 'month' ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`off-${i}`} />)}
              {days.map(day => <DayCell key={day.toISOString()} day={day} />)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => <DayCell key={day.toISOString()} day={day} />)}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {(['facebook', 'instagram', 'linkedin'] as Platform[]).map(p => (
              <div key={p} className="flex items-center gap-1.5">
                <div className={clsx('w-3 h-3 rounded', PLATFORM_COLORS[p])} />
                <span className="text-xs text-slate-500">{PLATFORM_LABELS[p]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {selected ? (
            <div className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 leading-snug">{selected.title}</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                <span className={clsx('badge', PLATFORM_COLORS[selected.platform as Platform])}>
                  {PLATFORM_LABELS[selected.platform as Platform]}
                </span>
                <span className={clsx('badge ml-2', POST_STATUS_COLORS[selected.status as PostStatus])}>
                  {POST_STATUS_LABELS[selected.status as PostStatus]}
                </span>
                {selected.scheduledAt && (
                  <div className="text-xs text-slate-500 mt-1">
                    {format(new Date(selected.scheduledAt), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Link href={`/posts/${selected.id}`} className="btn-secondary text-xs w-full justify-center">
                  <ExternalLink className="w-3.5 h-3.5" /> Post öffnen
                </Link>
                {selected.status !== 'published' && (
                  <button onClick={() => removeFromCalendar(selected)}
                    className="btn-ghost text-xs w-full justify-center text-amber-600 hover:bg-amber-50">
                    Aus Kalender entfernen
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-5">
              <h3 className="section-title">Empfehlungen</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">↑</span><span><strong>Facebook:</strong> Di–Do, 9–12 Uhr</span></div>
                <div className="flex items-start gap-2"><span className="text-pink-500 font-bold mt-0.5">↑</span><span><strong>Instagram:</strong> Mi & Fr, 11–13 Uhr</span></div>
                <div className="flex items-start gap-2"><span className="text-sky-500 font-bold mt-0.5">↑</span><span><strong>LinkedIn:</strong> Di & Do, 8–10 Uhr</span></div>
              </div>
            </div>
          )}
          <div className="card p-5 bg-indigo-50 border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium mb-1">Ziel: 3–5 Posts/Woche</p>
            <p className="text-xs text-indigo-600">Regelmäßigkeit schlägt Menge – lieber wenige, dafür hochwertige Posts.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
