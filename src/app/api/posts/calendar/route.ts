import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaces = await getUserWorkspaces(session.userId)
    const workspaceId = workspaces[0]?.id
    if (!workspaceId) return NextResponse.json([])

    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    const posts = await db.post.findMany({
      where: {
        workspaceId,
        OR: [
          { scheduledAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } },
          { publishedAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } },
        ],
      },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true, title: true, platform: true, contentType: true,
        status: true, scheduledAt: true, publishedAt: true, autoPublish: true,
      },
    })

    return NextResponse.json(posts)
  } catch (e) {
    console.error('[GET /api/posts/calendar]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
