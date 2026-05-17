'use client'

import { useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Video, Upload, Search, Trash2, X, Play, Film } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Media {
  id: string; type: string; url: string; thumbnail: string | null
  filename: string; filesize: number | null; mimeType: string | null
  description: string | null; tags: string[]; createdAt: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selected, setSelected] = useState<Media | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const data = await fetch('/api/media').then(r => r.json())
    if (Array.isArray(data)) setMedia(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError('')

    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/api/media', { method: 'POST', body: form })
        if (!res.ok) {
          const d = await res.json()
          setUploadError(d.error)
        }
      } catch {
        setUploadError('Upload fehlgeschlagen')
      }
    }

    await load()
    setUploading(false)
  }

  async function deleteMedia(id: string) {
    if (!confirm('Medium löschen?')) return
    await fetch(`/api/media/${id}`, { method: 'DELETE' })
    setSelected(null)
    load()
  }

  const filtered = media.filter(m => {
    if (filter !== 'all' && m.type !== filter) return false
    if (search && !m.filename.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><ImageIcon className="w-5 h-5 text-indigo-600" /> Mediathek</h1>
          <p className="page-subtitle">Bilder und Videos für deine Posts</p>
        </div>
        <button onClick={() => fileRef.current?.click()} className="btn-primary" disabled={uploading}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Wird hochgeladen…' : 'Hochladen'}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/mp4,video/quicktime,video/webm"
          className="hidden" onChange={e => upload(e.target.files)} />
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files) }}
        onClick={() => fileRef.current?.click()}
        className={clsx('mb-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50')}>
        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-500">Dateien hierher ziehen oder klicken</p>
        <p className="text-xs text-slate-400 mt-1">Bilder (JPG, PNG, WebP) bis 10 MB · Videos (MP4, MOV, WebM) bis 500 MB</p>
        {uploading && <div className="spinner text-indigo-600 mx-auto mt-3" />}
        {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(['all', 'image', 'video'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={clsx('px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
              {f === 'video' ? <Video className="w-3.5 h-3.5" /> : f === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : null}
              {f === 'all' ? 'Alle' : f === 'image' ? 'Bilder' : 'Videos'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input className="input pl-8 text-xs" placeholder="Dateiname suchen…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-xs text-slate-400">{filtered.length} Dateien</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Noch keine Medien hochgeladen</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(m => (
            <button key={m.id} onClick={() => setSelected(m)}
              className={clsx('relative rounded-xl overflow-hidden border-2 transition-all aspect-square group',
                selected?.id === m.id ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300')}>
              {m.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-1">
                  <Play className="w-8 h-8 text-white/60" />
                  <span className="text-[10px] text-white/40 px-1 truncate max-w-full">{m.filename}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{m.filename}</p>
              </div>
              {m.type === 'video' && (
                <div className="absolute top-1.5 left-1.5 bg-black/60 rounded px-1.5 py-0.5">
                  <Video className="w-3 h-3 text-white inline" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{selected.filename}</h3>
            <button onClick={() => setSelected(null)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selected.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.url} alt={selected.filename} className="w-full rounded-lg border border-slate-200" />
            ) : (
              <video src={selected.url} controls className="w-full rounded-lg bg-black" />
            )}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Typ</span>
                <span className="font-medium capitalize">{selected.type}</span>
              </div>
              {selected.filesize && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Größe</span>
                  <span className="font-medium">{formatBytes(selected.filesize)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Hochgeladen</span>
                <span className="font-medium">{format(new Date(selected.createdAt), 'dd.MM.yyyy', { locale: de })}</span>
              </div>
            </div>
            <a href={selected.url} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center text-xs">
              In neuem Tab öffnen
            </a>
          </div>
          <div className="p-5 border-t border-slate-100">
            <button onClick={() => deleteMedia(selected.id)} className="btn-danger w-full justify-center text-xs">
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
