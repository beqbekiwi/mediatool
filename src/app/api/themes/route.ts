import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

async function getWorkspaceId(userId: string) {
  const ws = await getUserWorkspaces(userId)
  return ws[0]?.id
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    if (!workspaceId) return NextResponse.json([])

    const themes = await db.contentTheme.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { ideas: true } } },
    })

    return NextResponse.json(themes.map(t => ({
      ...t,
      keywords: JSON.parse(t.keywords),
      ideaCount: t._count.ideas,
    })))
  } catch (e) {
    console.error('[GET /api/themes]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

    const body = await req.json()
    const { title, description, category, keywords = [] } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 })

    const theme = await db.contentTheme.create({
      data: {
        workspaceId,
        title: title.trim(),
        description: description?.trim() ?? null,
        category: category?.trim() ?? 'Allgemein',
        keywords: JSON.stringify(keywords),
      },
    })

    return NextResponse.json({ ...theme, keywords: JSON.parse(theme.keywords), ideaCount: 0 }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/themes]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
