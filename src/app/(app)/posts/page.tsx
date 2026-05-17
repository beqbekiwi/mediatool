'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { FileText, Plus, Wand2, Trash2, Send, CalendarDays, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import {
  PLATFORM_COLORS, PLATFORM_LABELS, POST_STATUS_COLORS, POST_STATUS_LABELS,
  type Platform, type PostStatus,
} from '@/types'

interface Post {
  id: string; title: string; content: string; platform: string; contentType: string
  status: string; scheduledAt: string | null; publishedAt: string | null; autoPublish: boolean
  hashtags: string[]; createdAt: string; publishError: string | null
}

function PostsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterStatus = searchParams.get('status') ?? ''

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(filterStatus)

  async function load(status?: string) {
    setLoading(true)
    const url = status ? `/api/posts?status=${status}` : '/api/posts'
    const data = await fetch(url).then(r => r.json())
    if (Array.isArray(data)) setPosts(data)
    setLoading(false)
  }

  useEffect(() => { load(activeFilter || undefined) }, [activeFilter])

  function setFilter(s: string) {
    setActiveFilter(s)
    router.push(s ? `/posts?status=${s}` : '/posts', { scroll: false })
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`"${title}" löschen?`)) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    setPosts(p => p.filter(x => x.id !== id))
  }

  async function publishNow(id: string) {
    await fetch('/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
      body: JSON.stringify({ postId: id }),
    })
    load(activeFilter || undefined)
  }

  const STATUS_FILTERS = [
    { value: '', label: 'Alle' },
    { value: 'draft', label: 'Entwürfe' },
    { value: 'approved', label: 'Freigegeben' },
    { value: 'scheduled', label: 'Geplant' },
    { value: 'published', label: 'Veröffentlicht' },
    { value: 'failed', label: 'Fehlgeschlagen' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Alle Posts</h1>
          <p className="page-subtitle">{posts.length} Posts insgesamt</p>
        </div>
        <Link href="/generator" className="btn-primary"><Plus className="w-4 h-4" /> Neuer Post</Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={clsx('px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
              activeFilter === f.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700')}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner text-indigo-600" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Wand2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Keine Posts gefunden</p>
          <Link href="/generator" className="btn-primary mt-4 inline-flex"><Plus className="w-4 h-4" /> Jetzt erstellen</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={clsx('badge', PLATFORM_COLORS[post.platform as Platform])}>
                      {PLATFORM_LABELS[post.platform as Platform]}
                    </span>
                    <span className={clsx('badge', POST_STATUS_COLORS[post.status as PostStatus])}>
                      {POST_STATUS_LABELS[post.status as PostStatus]}
                    </span>
                    <span className="badge bg-slate-100 text-slate-600 capitalize">{post.contentType}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{post.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{post.content}</p>
                  {post.publishError && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">
                      Fehler: {post.publishError}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>Erstellt {format(new Date(post.createdAt), 'dd.MM.yyyy', { locale: de })}</span>
                    {post.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(post.scheduledAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                    )}
                    {post.publishedAt && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Veröffentlicht {format(new Date(post.publishedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/posts/${post.id}`} className="btn-secondary text-xs px-3 py-1.5">Bearbeiten</Link>
                  {post.status === 'approved' && (
                    <button onClick={() => publishNow(post.id)} className="btn-primary text-xs px-3 py-1.5">
                      <Send className="w-3 h-3" /> Jetzt
                    </button>
                  )}
                  {post.status !== 'published' && (
                    <button onClick={() => deletePost(post.id, post.title)} className="btn-ghost p-1.5 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostsPage() {
  return <Suspense fallback={<div className="flex justify-center py-16"><div className="spinner text-indigo-600" /></div>}>
    <PostsContent />
  </Suspense>
}
