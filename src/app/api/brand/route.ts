import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getUserWorkspaces } from '@/lib/workspace'

async function getWorkspaceId(userId: string) {
  const workspaces = await getUserWorkspaces(userId)
  return workspaces[0]?.id
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.userId)
  if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

  const brand = await db.brandProfile.findUnique({ where: { workspaceId } })
  return NextResponse.json(brand)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.userId)
  if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

  const body = await req.json()
  const data = {
    name: body.name ?? '',
    description: body.description,
    industry: body.industry,
    targetAudience: body.targetAudience,
    tonality: body.tonality ?? 'professional',
    language: body.language ?? 'de',
    addressingStyle: body.addressingStyle ?? 'Sie',
    useEmojis: body.useEmojis ?? false,
    hashtagStyle: body.hashtagStyle,
    website: body.website,
    logoUrl: body.logoUrl,
    noGos: JSON.stringify(body.noGos ?? []),
    preferredTerms: JSON.stringify(body.preferredTerms ?? []),
    avoidedTerms: JSON.stringify(body.avoidedTerms ?? []),
    exampleTexts: JSON.stringify(body.exampleTexts ?? []),
    postingGoals: JSON.stringify(body.postingGoals ?? []),
  }

  const brand = await db.brandProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, ...data },
    update: data,
  })

  return NextResponse.json(brand)
}
