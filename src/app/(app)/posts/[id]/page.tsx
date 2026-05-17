'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  ArrowLeft, Save, Trash2, Send, CalendarDays, CheckCircle2,
  AlertCircle, Clock, Image as ImageIcon, Copy, Check, RefreshCw,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  PLATFORM_COLORS, PLATFORM_LABELS, POST_STATUS_COLORS, POST_STATUS_LABELS,
  CONTENT_TYPE_LABELS, FORMAT_LABELS, STYLE_LABELS,
  type Platform, type PostStatus, type ContentType,
} from '@/types'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

interface MediaItem { id: string; type: string; url: string; filename: string; mimeType: string | null }
interface Post {
  id: string; title: string; content: string; hook: string | null; cta: string | null
  platform: string; contentType: string; format: string; style: string
  status: string; autoPublish: boolean; scheduledAt: string | null; publishedAt: string | null
  platformPostId: string | null; publishError: string | null; notes: string | null
  hashtags: string[]; imageIdea: string | null; videoIdea: string | null; firstComment: string | null
  mediaItems: Array<{ order: number; media: MediaItem }>
  socialAccount: { platform: string; accountName: string } | null
  createdAt: string; updatedAt: string
}
interface SocialAccount { id: string; platform: string; accountName: string }

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Editable fields
  const [content, setContent] = useState('')
  const [hook, setHook] = useState('')
  const [cta, setCta] = useState('')
  const [notes, setNotes] = useState('')
  const [firstComment, setFirstComment] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [autoPublish, setAutoPublish] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/posts/${id}`).then(r => r.json()),
      fetch('/api/accounts').then(r => r.json()),
    ]).then(([postData, accountsData]) => {
      if (postData.error) { setError(postData.error); setLoading(false); return }
      setPost(postData)
      setContent(postData.content)
      setHook(postData.hook ?? '')
      setCta(postData.cta ?? '')
      setNotes(postData.notes ?? '')
      setFirstComment(postData.firstComment ?? '')
      setScheduledAt(postData.scheduledAt ? postData.scheduledAt.slice(0, 16) : '')
      setAutoPublish(postData.autoPublish)
      setSelectedAccountId(postData.socialAccount?.id ?? '')
      setStatus(postData.status)
      if (Array.isArray(accountsData)) {
        setAccounts(accountsData.filter((a: SocialAccount) => a.platform === postData.platform))
      }
      setLoading(false)
    })
  }, [id])

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content, hook, cta, notes, firstComment,
          scheduledAt: scheduledAt || null,
          autoPublish,
          socialAccountId: selectedAccountId || null,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPost(data)
    } catch (e) { setError(String(e)) }
    finally { setSaving(false) }
  }

  async function deletePost() {
    if (!confirm(`"${post?.title}" unwiderruflich löschen?`)) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.push('/posts')
  }

  async function copyContent() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex justify-center py-16"><div className="spinner text-indigo-600" /></div>
  )

  if (!post) return (
    <div className="card p-8 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p className="text-slate-600">{error || 'Post nicht gefunden'}</p>
      <Link href="/posts" className="btn-secondary mt-4 inline-flex">Zurück zur Liste</Link>
    </div>
  )

  const isPublished = post.status === 'published'
  const isFailed = post.status === 'failed'
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  const STATUS_OPTIONS: PostStatus[] = ['draft', 'review', 'approved', 'scheduled', 'published', 'failed']

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/posts" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="page-title">{post.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx('badge', PLATFORM_COLORS[post.platform as Platform])}>
                <PlatformIcon platform={post.platform as Platform} className="w-3 h-3 mr-1" />
                {PLATFORM_LABELS[post.platform as Platform]}
              </span>
              <span className="badge bg-slate-100 text-slate-600">{CONTENT_TYPE_LABELS[post.contentType as ContentType]}</span>
              <span className={clsx('badge', POST_STATUS_COLORS[post.status as PostStatus])}>
                {POST_STATUS_LABELS[post.status as PostStatus]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={deletePost} className="btn-ghost text-red-500 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <span className="spinner" /> : <Save className="w-4 h-4" />}
            Speichern
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {isPublished && post.platformPostId && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl mb-5 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Veröffentlicht am {format(new Date(post.publishedAt!), 'dd.MM.yyyy HH:mm', { locale: de })}
          · Post-ID: <code className="font-mono text-xs">{post.platformPostId}</code>
        </div>
      )}

      {isFailed && post.publishError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div><strong>Veröffentlichung fehlgeschlagen:</strong> {post.publishError}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Content Editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Hook */}
          {hook && (
            <div className="card p-4">
              <label className="label">Hook (Einstieg)</label>
              <textarea className="textarea" rows={2} value={hook} onChange={e => setHook(e.target.value)} />
            </div>
          )}

          {/* Main content */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Post-Text</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{wordCount} Wörter</span>
                <button onClick={copyContent} className="btn-ghost text-xs py-1">
                  {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Kopiert</> : <><Copy className="w-3.5 h-3.5" /> Kopieren</>}
                </button>
              </div>
            </div>
            <textarea className="textarea w-full" rows={14} value={content} onChange={e => setContent(e.target.value)} />

            {/* Hashtags */}
            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.hashtags.map(h => (
                  <span key={h} className="badge bg-indigo-100 text-indigo-700">#{h}</span>
                ))}
              </div>
            )}
          </div>

          {/* CTA & Erster Kommentar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <label className="label">Call-to-Action</label>
              <input className="input" value={cta} onChange={e => setCta(e.target.value)} placeholder="z. B. Jetzt anfragen" />
            </div>
            <div className="card p-4">
              <label className="label">Erster Kommentar</label>
              <input className="input" value={firstComment} onChange={e => setFirstComment(e.target.value)} placeholder="Hashtags oder Ergänzung" />
            </div>
          </div>

          {/* Medien */}
          {post.mediaItems.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title">Medien</h3>
              <div className="grid grid-cols-3 gap-3">
                {post.mediaItems.map(({ media }) => (
                  <div key={media.id} className="relative rounded-lg overflow-hidden bg-slate-100 aspect-square">
                    {media.type === 'image' ? (
                      <img src={media.url} alt={media.filename} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full text-slate-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs truncate px-2 text-center">{media.filename}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notizen */}
          <div className="card p-4">
            <label className="label">Interne Notizen</label>
            <textarea className="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nur intern sichtbar…" />
          </div>
        </div>

        {/* Right: Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status */}
          <div className="card p-5">
            <h3 className="section-title">Status & Veröffentlichung</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Status</label>
                <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{POST_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {accounts.length > 0 && (
                <div>
                  <label className="label">Account</label>
                  <select className="select" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}>
                    <option value="">Kein Account gewählt</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.accountName}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="label flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Geplanter Zeitpunkt</label>
                <input type="datetime-local" className="input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={clsx('relative w-9 h-5 rounded-full transition-colors', autoPublish ? 'bg-indigo-600' : 'bg-slate-200')}
                  onClick={() => setAutoPublish(v => !v)}>
                  <div className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', autoPublish ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <span className="text-sm text-slate-700">Auto-Veröffentlichung</span>
              </label>

              {scheduledAt && autoPublish && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
                  <Clock className="w-3.5 h-3.5" />
                  Wird automatisch am {format(new Date(scheduledAt), 'dd.MM.yyyy HH:mm', { locale: de })} veröffentlicht
                </div>
              )}
            </div>
          </div>

          {/* Meta-Infos */}
          <div className="card p-5">
            <h3 className="section-title">Details</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Format</dt>
                <dd className="text-slate-700 font-medium">{FORMAT_LABELS[post.format as keyof typeof FORMAT_LABELS] ?? post.format}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tonalität</dt>
                <dd className="text-slate-700 font-medium">{STYLE_LABELS[post.style as keyof typeof STYLE_LABELS] ?? post.style}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Erstellt</dt>
                <dd className="text-slate-700">{format(new Date(post.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Geändert</dt>
                <dd className="text-slate-700">{format(new Date(post.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}</dd>
              </div>
              {post.socialAccount && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Account</dt>
                  <dd className="text-slate-700 font-medium">{post.socialAccount.accountName}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Bildidee */}
          {(post.imageIdea || post.videoIdea) && (
            <div className="card p-4">
              <h3 className="section-title">KI-Ideen</h3>
              {post.imageIdea && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Bildidee</p>
                  <p className="text-xs text-slate-600">{post.imageIdea}</p>
                </div>
              )}
              {post.videoIdea && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Video-Idee</p>
                  <p className="text-xs text-slate-600">{post.videoIdea}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-4 space-y-2">
            <h3 className="section-title">Aktionen</h3>
            {!isPublished && (
              <button onClick={() => { setStatus('approved'); save() }} className="btn-secondary w-full justify-center text-sm">
                <CheckCircle2 className="w-4 h-4" /> Freigeben
              </button>
            )}
            <button onClick={save} disabled={saving} className="btn-primary w-full justify-center text-sm">
              {saving ? <span className="spinner" /> : <Save className="w-4 h-4" />}
              Änderungen speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
