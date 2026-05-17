'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'
import { clsx } from 'clsx'

interface Theme {
  id: string
  title: string
  description: string | null
  category: string
  keywords: string[]
  active: boolean
  ideaCount: number
  createdAt: string
}

const CATEGORIES = ['Allgemein', 'Produkt', 'Hinter den Kulissen', 'Kundenstimmen', 'Tipps & Tricks', 'News', 'Aktion & Angebot', 'Team', 'Saisonal']

const EMPTY_FORM = { title: '', description: '', category: 'Allgemein', keywords: '' }

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    const data = await fetch('/api/themes').then(r => r.json())
    if (Array.isArray(data)) setThemes(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(t: Theme) {
    setEditId(t.id)
    setForm({ title: t.title, description: t.description ?? '', category: t.category, keywords: t.keywords.join(', ') })
    setError('')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
  }

  async function saveForm() {
    if (!form.title.trim()) { setError('Titel ist erforderlich'); return }
    setSaving(true); setError('')
    const keywords = form.keywords.split(',').map(k => k.trim()).filter(Boolean)
    const payload = { title: form.title, description: form.description || null, category: form.category, keywords }

    try {
      const res = editId
        ? await fetch(`/api/themes/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (editId) {
        setThemes(prev => prev.map(t => t.id === editId ? { ...data, ideaCount: t.ideaCount } : t))
      } else {
        setThemes(prev => [data, ...prev])
      }
      setShowForm(false)
      setEditId(null)
    } catch (e) { setError(String(e)) }
    finally { setSaving(false) }
  }

  async function toggleActive(t: Theme) {
    const res = await fetch(`/api/themes/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    if (res.ok) setThemes(prev => prev.map(x => x.id === t.id ? { ...x, active: !t.active } : x))
  }

  async function deleteTheme(t: Theme) {
    if (!confirm(`"${t.title}" löschen?`)) return
    await fetch(`/api/themes/${t.id}`, { method: 'DELETE' })
    setThemes(prev => prev.filter(x => x.id !== t.id))
  }

  const active = themes.filter(t => t.active)
  const inactive = themes.filter(t => !t.active)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-600" /> Content-Themen</h1>
          <p className="page-subtitle">Definiere wiederkehrende Themen für deinen Redaktionsplan</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Neues Thema</button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-indigo-200 ring-1 ring-indigo-100">
          <h2 className="section-title mb-4">{editId ? 'Thema bearbeiten' : 'Neues Thema erstellen'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Titel *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="z. B. Kundenerfolge & Testimonials" />
            </div>
            <div>
              <label className="label">Kategorie</label>
              <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Keywords (kommagetrennt)</label>
              <input className="input" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="z. B. Erfolg, Ergebnis, Transformation" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Beschreibung</label>
              <textarea className="textarea" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Worum geht es bei diesem Thema? Welche Art von Posts sollen darunter entstehen?" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex items-center gap-2 mt-4">
            <button onClick={saveForm} disabled={saving} className="btn-primary">
              {saving ? <span className="spinner" /> : <Check className="w-4 h-4" />}
              {editId ? 'Speichern' : 'Erstellen'}
            </button>
            <button onClick={cancelForm} className="btn-secondary"><X className="w-4 h-4" /> Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner text-indigo-600" /></div>
      ) : themes.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <BookOpen className="w-12 h-12 text-slate-200 mb-4" />
          <h3 className="text-sm font-medium text-slate-500">Noch keine Themen angelegt</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Themen helfen dir, deinen Content systematisch zu planen – zum Beispiel „Kundenerfolge", „Tipps & Tricks" oder „Produktneuheiten".</p>
          <button onClick={openCreate} className="btn-primary mt-5"><Plus className="w-4 h-4" /> Erstes Thema erstellen</button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active themes */}
          {active.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Aktiv ({active.length})</h2>
              <div className="space-y-3">
                {active.map(t => <ThemeCard key={t.id} theme={t} expanded={expanded === t.id}
                  onToggleExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                  onEdit={() => openEdit(t)} onDelete={() => deleteTheme(t)} onToggleActive={() => toggleActive(t)} />)}
              </div>
            </div>
          )}

          {/* Inactive themes */}
          {inactive.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Inaktiv ({inactive.length})</h2>
              <div className="space-y-3 opacity-60">
                {inactive.map(t => <ThemeCard key={t.id} theme={t} expanded={expanded === t.id}
                  onToggleExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                  onEdit={() => openEdit(t)} onDelete={() => deleteTheme(t)} onToggleActive={() => toggleActive(t)} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tip box */}
      {themes.length > 0 && (
        <div className="mt-6 card p-5 bg-indigo-50 border-indigo-100">
          <div className="flex items-start gap-3">
            <Wand2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">Tipp: Themen im Generator nutzen</h3>
              <p className="text-xs text-indigo-700">Im <Link href="/generator" className="underline">Post-Generator</Link> kannst du ein Thema als Basis wählen – die KI berücksichtigt automatisch die Keywords und den Charakter des Themas.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeCard({ theme, expanded, onToggleExpand, onEdit, onDelete, onToggleActive }: {
  theme: Theme
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <div className={clsx('card overflow-hidden', theme.active ? '' : 'border-slate-200')}>
      <div className="flex items-center gap-3 p-4">
        {/* Active toggle */}
        <button onClick={onToggleActive} title={theme.active ? 'Deaktivieren' : 'Aktivieren'}
          className={clsx('w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-2 transition-colors',
            theme.active ? 'bg-green-500 ring-green-300' : 'bg-slate-300 ring-slate-200')}>
        </button>

        <div className="flex-1 min-w-0" role="button" onClick={onToggleExpand}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{theme.title}</span>
            <span className="badge bg-slate-100 text-slate-500 text-[10px]">{theme.category}</span>
            {theme.ideaCount > 0 && (
              <span className="badge bg-indigo-100 text-indigo-600 text-[10px]">{theme.ideaCount} {theme.ideaCount === 1 ? 'Idee' : 'Ideen'}</span>
            )}
          </div>
          {theme.description && !expanded && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{theme.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="btn-ghost p-1.5 text-slate-400 hover:text-indigo-600">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="btn-ghost p-1.5 text-slate-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggleExpand} className="btn-ghost p-1.5 text-slate-400">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">
          {theme.description && (
            <p className="text-xs text-slate-600">{theme.description}</p>
          )}
          {theme.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {theme.keywords.map(k => (
                <span key={k} className="badge bg-white border border-slate-200 text-slate-600 text-[10px]">{k}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
