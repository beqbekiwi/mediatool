import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateText } from '@/lib/ai/text'
import { buildVariantPrompt } from '@/lib/ai/prompts'
import type { PostStyle } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { content, newStyle } = await req.json()
  if (!content || !newStyle) {
    return NextResponse.json({ error: 'Inhalt und Stil erforderlich' }, { status: 400 })
  }

  try {
    const result = await generateText('Du bist ein erfahrener Social-Media-Texter.', buildVariantPrompt(content, newStyle as PostStyle))
    return NextResponse.json({ content: result })
  } catch (e) {
    console.error('[generate/variant]', e)
    return NextResponse.json({ error: 'Variante konnte nicht erstellt werden' }, { status: 500 })
  }
}
