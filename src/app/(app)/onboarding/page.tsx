'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INDUSTRY_OPTIONS, POSTING_GOAL_OPTIONS } from '@/types'
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'

const STEPS = ['Workspace', 'Markenprofil', 'Ziele', 'Fertig']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [brand, setBrand] = useState({
    name: '',
    description: '',
    industry: '',
    targetAudience: '',
    tonality: 'professional',
    language: 'de',
    addressingStyle: 'Sie',
    useEmojis: false,
    website: '',
    postingGoals: [] as string[],
    noGos: '',
  })

  const set = (k: string, v: unknown) => setBrand(b => ({ ...b, [k]: v }))

  function toggleGoal(g: string) {
    setBrand(b => ({
      ...b,
      postingGoals: b.postingGoals.includes(g)
        ? b.postingGoals.filter(x => x !== g)
        : [...b.postingGoals, g],
    }))
  }

  async function finish() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brand,
          noGos: brand.noGos ? brand.noGos.split(',').map(s => s.trim()).filter(Boolean) : [],
          postingGoals: brand.postingGoals,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push('/dashboard')
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= step ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Willkommen! 👋</h2>
              <p className="text-sm text-slate-500 mb-6">Richte jetzt dein Markenprofil ein. Du kannst alles später ändern.</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Wie heißt dein Unternehmen / dein Name?</label>
                  <input className="input" value={brand.name} onChange={e => set('name', e.target.value)} placeholder="z. B. Bäckerei Müller" />
                </div>
                <div>
                  <label className="label">Branche</label>
                  <select className="select" value={brand.industry} onChange={e => set('industry', e.target.value)}>
                    <option value="">Bitte wählen…</option>
                    {INDUSTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Website (optional)</label>
                  <input className="input" value={brand.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Markenprofil</h2>
              <p className="text-sm text-slate-500 mb-6">Diese Angaben fließen in alle KI-Texte ein.</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Kurzbeschreibung</label>
                  <textarea className="textarea" rows={3} value={brand.description} onChange={e => set('description', e.target.value)} placeholder="Was macht dein Unternehmen? Für wen?" />
                </div>
                <div>
                  <label className="label">Zielgruppe</label>
                  <input className="input" value={brand.targetAudience} onChange={e => set('targetAudience', e.target.value)} placeholder="z. B. Familien in der Region, junge Berufstätige" />
                </div>
                <div>
                  <label className="label">Tonalität</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[['professional','Professionell'], ['friendly','Freundlich'], ['inspiring','Inspirierend'], ['expert','Expertig']].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => set('tonality', v)}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${brand.tonality === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Ansprache</label>
                    <div className="flex gap-2">
                      {['Sie', 'Du'].map(a => (
                        <button key={a} type="button" onClick={() => set('addressingStyle', a)}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${brand.addressingStyle === a ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Emojis verwenden</label>
                    <div className="flex gap-2">
                      {[[true,'Ja'],[false,'Nein']].map(([v, l]) => (
                        <button key={String(l)} type="button" onClick={() => set('useEmojis', v)}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${brand.useEmojis === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Content-Ziele</h2>
              <p className="text-sm text-slate-500 mb-6">Welche Themen sollen deine Posts abdecken?</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {POSTING_GOAL_OPTIONS.map(g => (
                  <button key={g} type="button" onClick={() => toggleGoal(g)}
                    className={`py-2 px-3 rounded-lg border text-sm text-left transition-colors ${brand.postingGoals.includes(g) ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {g}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">No-Gos (kommagetrennt, optional)</label>
                <input className="input" value={brand.noGos} onChange={e => set('noGos', e.target.value)} placeholder="z. B. Preisnennung, Konkurrenzprodukte" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Alles bereit!</h2>
              <p className="text-sm text-slate-500">Dein Markenprofil ist eingerichtet. Du kannst jetzt deinen ersten Post erstellen.</p>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="btn-secondary disabled:opacity-40">
              <ArrowLeft className="w-4 h-4" /> Zurück
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                Weiter <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={saving} className="btn-primary">
                {saving ? <span className="spinner" /> : 'Zum Dashboard'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
