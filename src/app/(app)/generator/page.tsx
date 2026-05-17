'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wand2, Save, RefreshCw, Copy, Check, ChevronDown, ChevronUp,
  CalendarDays, Lightbulb, Image as ImageIcon, Sparkles, Loader2,
  Layers, StickerIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  PLATFORM_LABELS, FORMAT_LABELS, STYLE_LABELS,
  type Platform, type PostFormat, type PostStyle,
} from '@/types'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

interface Suggestion {
  title: string
  hook: string
  content: string
  cta: string
  hashtags: string[]
  imageIdea: string
  videoIdea: string | null
  publishTip: string
}

const PLATFORMS: Platform[] = ['facebook', 'instagram', 'linkedin']

export default function GeneratorPage() {
  const router = useRouter()

  // Form state
  const [platform, setPlatform] = useState<Platform>('facebook')
  const [topic, setTopic] = useState('')
  const [format, setFormat] = useState<PostFormat>('standard')
  const [style, setStyle] = useState<PostStyle>('professional')
  const [targetGroup, setTargetGroup] = useState('')
  const [cta, setCta] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Results
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [editedContent, setEditedContent] = useState('')

  // UI state
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [accounts, setAccounts] = useState<Array<{ id: string; platform: string; accountName: string }>>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const [compositingImage, setCompositingImage] = useState(false)
  const [overlayingLogo, setOverlayingLogo] = useState(false)
  const [logoPosition, setLogoPosition] = useState('bottom-right')
  const [logoScale, setLogoScale] = useState('0.25')

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAccounts(data.filter((a: { platform: string }) => a.platform === platform))
    })
  }, [platform])

  async function generate() {
    if (!topic.trim()) { setError('Bitte ein Thema eingeben'); return }
    setError('')
    setGenerating(true)
    setSuggestions([])
    setSelected(null)

    try {
      const res = await fetch('/api/generate/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, format, style, targetGroup, cta, additionalNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuggestions(data.suggestions)
    } catch (e) {
      setError(String(e))
    } finally {
      setGenerating(false)
    }
  }

  function selectSuggestion(s: Suggestion) {
    setSelected(s)
    setEditedContent(s.content)
    setGeneratedImageUrl(null)
    setImageError('')
  }

  async function compositeImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !generatedImageUrl) return
    e.target.value = ''
    setCompositingImage(true)
    setImageError('')
    try {
      const fd = new FormData()
      fd.append('baseImageUrl', generatedImageUrl)
      fd.append('file', file)
      const res = await fetch('/api/generate/image/edit', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedImageUrl(data.url)
    } catch (e) {
      setImageError(String(e))
    } finally {
      setCompositingImage(false)
    }
  }

  async function overlayLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !generatedImageUrl) return
    e.target.value = ''
    setOverlayingLogo(true)
    setImageError('')
    try {
      const fd = new FormData()
      fd.append('baseImageUrl', generatedImageUrl)
      fd.append('file', file)
      fd.append('position', logoPosition)
      fd.append('scale', logoScale)
      const res = await fetch('/api/media/overlay', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedImageUrl(data.url)
    } catch (e) {
      setImageError(String(e))
    } finally {
      setOverlayingLogo(false)
    }
  }

  async function generateImage() {
    if (!selected?.imageIdea) return
    setGeneratingImage(true)
    setImageError('')
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selected.imageIdea, platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedImageUrl(data.url)
    } catch (e) {
      setImageError(String(e))
    } finally {
      setGeneratingImage(false)
    }
  }

  async function savePost(status: 'draft' | 'approved' = 'draft') {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.title,
          content: editedContent,
          hook: selected.hook,
          cta: selected.cta,
          platform,
          format,
          style,
          hashtags: selected.hashtags,
          imageIdea: selected.imageIdea,
          videoIdea: selected.videoIdea,
          status,
          socialAccountId: selectedAccountId || null,
        }),
      })
      const post = await res.json()
      if (!res.ok) throw new Error(post.error)
      router.push(`/posts/${post.id}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function copyContent() {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = editedContent.trim().split(/\s+/).filter(Boolean).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wand2 className="w-5 h-5 text-indigo-600" /> Post erstellen</h1>
          <p className="page-subtitle">KI generiert 3 Varianten – du wählst und bearbeitest</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            {/* Platform */}
            <div>
              <label className="label">Plattform</label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={clsx('flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-colors',
                        platform === p ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                      <PlatformIcon platform={p} className="w-4 h-4" />
                      {PLATFORM_LABELS[p]}
                    </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="label">Thema / Ziel des Posts *</label>
              <textarea className="textarea" rows={3} value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="z. B. Wir stellen unser neues Sommerangebot vor und möchten Interesse wecken" />
            </div>

            {/* Format & Style */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Format</label>
                <select className="select" value={format} onChange={e => setFormat(e.target.value as PostFormat)}>
                  {Object.entries(FORMAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tonalität</label>
                <select className="select" value={style} onChange={e => setStyle(e.target.value as PostStyle)}>
                  {Object.entries(STYLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Advanced */}
            <button type="button" onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Erweiterte Optionen
            </button>

            {showAdvanced && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="label">Spezifische Zielgruppe</label>
                  <input className="input" value={targetGroup} onChange={e => setTargetGroup(e.target.value)}
                    placeholder="z. B. Junge Familien, 25–40 Jahre" />
                </div>
                <div>
                  <label className="label">Gewünschter Call-to-Action</label>
                  <input className="input" value={cta} onChange={e => setCta(e.target.value)}
                    placeholder="z. B. Termin buchen, Link in Bio" />
                </div>
                <div>
                  <label className="label">Besondere Hinweise</label>
                  <textarea className="textarea" rows={2} value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder="Sonderaktion, Datum, besondere Info…" />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button onClick={generate} disabled={generating || !topic.trim()} className="btn-primary w-full justify-center py-2.5">
              {generating ? <><span className="spinner" /> Generiere 3 Varianten…</> : <><Wand2 className="w-4 h-4" /> 3 Varianten generieren</>}
            </button>
          </div>

          {/* Suggestions list */}
          {suggestions.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title">Varianten wählen</h3>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => selectSuggestion(s)}
                    className={clsx('w-full text-left p-3 rounded-lg border transition-colors',
                      selected === s ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}>
                    <div className="text-xs font-semibold text-slate-700 mb-1">Variante {i + 1}</div>
                    <div className="text-xs text-slate-600 line-clamp-2">{s.hook}</div>
                  </button>
                ))}
                <button onClick={generate} disabled={generating}
                  className="btn-ghost text-xs w-full justify-center mt-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Neu generieren
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-3 space-y-4">
          {!selected ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Lightbulb className="w-12 h-12 text-slate-200 mb-4" />
              <h3 className="text-sm font-medium text-slate-500">Thema eingeben und Varianten generieren</h3>
              <p className="text-xs text-slate-400 mt-1">Die KI erstellt 3 verschiedene Post-Vorschläge</p>
            </div>
          ) : (
            <>
              {/* Editor Card */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title mb-0">{selected.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{wordCount} Wörter</span>
                    <button onClick={copyContent} className="btn-ghost text-xs">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Kopiert' : 'Kopieren'}
                    </button>
                  </div>
                </div>

                {/* Hook highlight */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  <span className="text-xs font-semibold text-amber-700">Hook: </span>
                  <span className="text-xs text-amber-800">{selected.hook}</span>
                </div>

                <textarea className="textarea w-full" rows={12} value={editedContent}
                  onChange={e => setEditedContent(e.target.value)} />

                {/* Hashtags */}
                {selected.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selected.hashtags.map(h => (
                      <span key={h} className="badge bg-indigo-100 text-indigo-700">#{h}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4">
                {selected.imageIdea && (
                  <div className="card p-4 col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-slate-700">Bildidee</span>
                      </div>
                      <button onClick={generateImage} disabled={generatingImage}
                        className="btn-primary text-xs py-1 px-2.5">
                        {generatingImage
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Generiere…</>
                          : <><Sparkles className="w-3 h-3" /> Bild generieren</>}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{selected.imageIdea}</p>
                    {imageError && <p className="text-xs text-red-600 mt-2">{imageError}</p>}
                    {generatedImageUrl && (
                      <div className="mt-2 space-y-3">
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                          <img src={generatedImageUrl} alt="KI-generiertes Bild" className="w-full object-cover" />
                        </div>

                        {/* Compositing actions */}
                        <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
                          <p className="text-xs font-semibold text-slate-600">Bild anpassen</p>

                          {/* AI composite */}
                          <div className="flex items-center gap-2">
                            <label className={clsx(
                              'flex items-center gap-1.5 text-xs cursor-pointer px-2.5 py-1.5 rounded-lg border transition-colors',
                              compositingImage
                                ? 'opacity-50 pointer-events-none border-slate-200 text-slate-400'
                                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            )}>
                              {compositingImage
                                ? <><Loader2 className="w-3 h-3 animate-spin" /> KI kombiniert…</>
                                : <><Layers className="w-3 h-3" /> Screenshot einsetzen (KI)</>}
                              <input type="file" accept="image/*" className="hidden" onChange={compositeImage} disabled={compositingImage} />
                            </label>
                            <span className="text-xs text-slate-400 hidden sm:inline">KI platziert dein Bild ins generierte Motiv</span>
                          </div>

                          {/* Sharp logo overlay */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <select className="select text-xs py-1 px-2 h-auto" value={logoPosition} onChange={e => setLogoPosition(e.target.value)}>
                                <option value="bottom-right">Unten rechts</option>
                                <option value="bottom-left">Unten links</option>
                                <option value="top-right">Oben rechts</option>
                                <option value="top-left">Oben links</option>
                                <option value="center">Mitte</option>
                              </select>
                              <select className="select text-xs py-1 px-2 h-auto" value={logoScale} onChange={e => setLogoScale(e.target.value)}>
                                <option value="0.1">10% Größe</option>
                                <option value="0.15">15% Größe</option>
                                <option value="0.25">25% Größe</option>
                                <option value="0.35">35% Größe</option>
                              </select>
                              <label className={clsx(
                                'flex items-center gap-1.5 text-xs cursor-pointer px-2.5 py-1.5 rounded-lg border transition-colors',
                                overlayingLogo
                                  ? 'opacity-50 pointer-events-none border-slate-200 text-slate-400'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                              )}>
                                {overlayingLogo
                                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Füge hinzu…</>
                                  : <><StickerIcon className="w-3 h-3" /> Logo hinzufügen</>}
                                <input type="file" accept="image/*" className="hidden" onChange={overlayLogo} disabled={overlayingLogo} />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {selected.videoIdea && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-700">🎬 Video-Idee</span>
                    </div>
                    <p className="text-xs text-slate-600">{selected.videoIdea}</p>
                  </div>
                )}
                {selected.publishTip && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700">Tipp: Veröffentlichung</span>
                    </div>
                    <p className="text-xs text-slate-600">{selected.publishTip}</p>
                  </div>
                )}
              </div>

              {/* Account selector */}
              {accounts.length > 0 && (
                <div className="card p-4">
                  <label className="label">Account für Veröffentlichung</label>
                  <select className="select" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}>
                    <option value="">Später zuweisen</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.accountName}</option>)}
                  </select>
                </div>
              )}

              {/* Save actions */}
              <div className="flex items-center gap-3">
                <button onClick={() => savePost('draft')} disabled={saving} className="btn-secondary flex-1 justify-center">
                  <Save className="w-4 h-4" /> Als Entwurf speichern
                </button>
                <button onClick={() => savePost('approved')} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <span className="spinner" /> : <><Check className="w-4 h-4" /> Freigeben & speichern</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
