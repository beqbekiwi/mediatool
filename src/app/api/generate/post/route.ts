import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'
import { generateJSON } from '@/lib/ai/text'
import { buildSystemPrompt, buildPostPrompt } from '@/lib/ai/prompts'
import type { Platform, PostFormat, PostStyle } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const workspaces = await getUserWorkspaces(session.userId)
  const workspaceId = workspaces[0]?.id
  if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

  const { topic, platform, format, style, targetGroup, cta, hashtags, imageIdea, additionalNotes } = await req.json()

  if (!topic || !platform) {
    return NextResponse.json({ error: 'Thema und Plattform erforderlich' }, { status: 400 })
  }

  const brand = await db.brandProfile.findUnique({ where: { workspaceId } })

  const brandCtx = brand
    ? {
        name: brand.name,
        description: brand.description,
        industry: brand.industry,
        targetAudience: brand.targetAudience,
        tonality: brand.tonality,
        language: brand.language,
        addressingStyle: brand.addressingStyle,
        useEmojis: brand.useEmojis,
        noGos: JSON.parse(brand.noGos),
        preferredTerms: JSON.parse(brand.preferredTerms),
        avoidedTerms: JSON.parse(brand.avoidedTerms),
      }
    : {
        name: 'Unbekannte Marke',
        tonality: 'professional',
        language: 'de',
        addressingStyle: 'Sie',
        useEmojis: false,
        noGos: [],
        preferredTerms: [],
        avoidedTerms: [],
      }

  const systemPrompt = buildSystemPrompt(brandCtx)
  const userPrompt = buildPostPrompt({
    topic,
    platform: platform as Platform,
    format: (format ?? 'standard') as PostFormat,
    style: (style ?? 'professional') as PostStyle,
    targetGroup,
    cta,
    hashtags,
    imageIdea,
    additionalNotes,
    count: 3,
  })

  try {
    const suggestions = await generateJSON<unknown[]>(systemPrompt, userPrompt)
    return NextResponse.json({ suggestions })
  } catch (e) {
    console.error('[generate/post]', e)
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `KI-Generierung fehlgeschlagen: ${msg}` }, { status: 500 })
  }
}
