'use client'

import { useEffect, useState } from 'react'
import { Palette, Save, CheckCircle2 } from 'lucide-react'
import { INDUSTRY_OPTIONS, POSTING_GOAL_OPTIONS, TONALITY_LABELS } from '@/types'

interface BrandProfile {
  name: string; description: string; industry: string; targetAudience: string
  tonality: string; language: string; addressingStyle: string; useEmojis: boolean
  hashtagStyle: string; website: string; noGos: string[]; preferredTerms: string[]
  avoidedTerms: string[]; exampleTexts: string[]; postingGoals: string[]
}

const DEFAULT: BrandProfile = {
  name: '', description: '', industry: '', targetAudience: '',
  tonality: 'professional', language: 'de', addressingStyle: 'Sie',
  useEmojis: false, hashtagStyle: '', website: '',
  noGos: [], preferredTerms: [], avoidedTerms: [], exampleTexts: [], postingGoals: [],
}

export default function BrandPage() {
  const [profile, setProfile] = useState<BrandProfile>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/brand').then(r => r.json()).then(data => {
      if (data?.name) {
        setProfile({
          ...DEFAULT,
          ...data,
          noGos: tryParse(data.noGos),
          preferredTerms: tryParse(data.preferredTerms),
          avoidedTerms: tryParse(data.avoidedTerms),
          exampleTexts: tryParse(data.exampleTexts),
          postingGoals: tryParse(data.postingGoals),
        })
      }
      setLoading(false)
    })
  }, [])

  function tryParse(v: unknown): string[] {
    if (Array.isArray(v)) return v
    try { return JSON.parse(v as string) ?? [] } catch { return [] }
  }

  const set = (k: string, v: unknown) => setProfile(p => ({ ...p, [k]: v }))

  function toggleGoal(g: string) {
    set('postingGoals', profile.postingGoals.includes(g)
      ? profile.postingGoals.filter(x => x !== g)
      : [...profile.postingGoals, g])
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="spinner text-indigo-600" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Palette className="w-5 h-5 text-indigo-600" /> Markenprofil</h1>
          <p className="page-subtitle">Diese Angaben steuern alle KI-generierten Texte</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Gespeichert</> : saving ? <><span className="spinner" /> Speichern…</> : <><Save className="w-4 h-4" /> Speichern</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basis */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Grunddaten</h2>
          <div>
            <label className="label">Name / Markenname *</label>
            <input className="input" value={profile.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Beschreibung</label>
            <textarea className="textarea" rows={3} value={profile.description} onChange={e => set('description', e.target.value)} placeholder="Was macht dein Unternehmen? Für wen?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Branche</label>
              <select className="select" value={profile.industry} onChange={e => set('industry', e.target.value)}>
                <option value="">Bitte wählen</option>
                {INDUSTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" value={profile.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <div>
            <label className="label">Zielgruppe</label>
            <input className="input" value={profile.targetAudience} onChange={e => set('targetAudience', e.target.value)} placeholder="z. B. Junge Familien, 25–45 Jahre, urban" />
          </div>
        </div>

        {/* Tonalität */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Tonalität & Stil</h2>
          <div>
            <label className="label">Tonalität</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TONALITY_LABELS).map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('tonality', v)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${profile.tonality === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Sprache</label>
              <select className="select" value={profile.language} onChange={e => set('language', e.target.value)}>
                <option value="de">Deutsch</option>
                <option value="en">Englisch</option>
              </select>
            </div>
            <div>
              <label className="label">Ansprache</label>
              <div className="flex gap-2">
                {['Sie', 'Du'].map(a => (
                  <button key={a} type="button" onClick={() => set('addressingStyle', a)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${profile.addressingStyle === a ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Emojis</label>
              <div className="flex gap-2">
                {[[true,'Ja'],[false,'Nein']].map(([v, l]) => (
                  <button key={String(l)} type="button" onClick={() => set('useEmojis', v)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${profile.useEmojis === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label">No-Gos (kommagetrennt)</label>
            <input className="input" value={profile.noGos.join(', ')} onChange={e => set('noGos', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="z. B. Preisnennung, Wettbewerber" />
          </div>
          <div>
            <label className="label">Bevorzugte Begriffe (kommagetrennt)</label>
            <input className="input" value={profile.preferredTerms.join(', ')} onChange={e => set('preferredTerms', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        </div>

        {/* Content-Ziele */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="section-title">Content-Ziele</h2>
          <p className="text-xs text-slate-500 mb-3">Welche Themenbereiche sollen deine Posts abdecken?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {POSTING_GOAL_OPTIONS.map(g => (
              <button key={g} type="button" onClick={() => toggleGoal(g)}
                className={`py-2 px-3 rounded-lg border text-sm text-left transition-colors ${profile.postingGoals.includes(g) ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
