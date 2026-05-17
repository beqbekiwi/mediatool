import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

async function getWorkspaceId(userId: string) {
  const ws = await getUserWorkspaces(userId)
  return ws[0]?.id
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    if (!workspaceId) return NextResponse.json([])

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const platform = url.searchParams.get('platform')

    const posts = await db.post.findMany({
      where: {
        workspaceId,
        ...(status ? { status } : {}),
        ...(platform ? { platform } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        mediaItems: { include: { media: true }, orderBy: { order: 'asc' } },
        socialAccount: { select: { platform: true, accountName: true } },
      },
    })

    return NextResponse.json(posts.map(p => ({ ...p, hashtags: JSON.parse(p.hashtags) })))
  } catch (e) {
    console.error('[GET /api/posts]', e)
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

    const post = await db.post.create({
      data: {
        workspaceId,
        title: body.title,
        content: body.content,
        hook: body.hook,
        cta: body.cta,
        platform: body.platform ?? 'facebook',
        contentType: body.contentType ?? 'text',
        format: body.format ?? 'standard',
        style: body.style ?? 'professional',
        targetGroup: body.targetGroup ?? 'general',
        hashtags: JSON.stringify(body.hashtags ?? []),
        firstComment: body.firstComment,
        notes: body.notes,
        imageIdea: body.imageIdea,
        videoIdea: body.videoIdea,
        status: 'draft',
        socialAccountId: body.socialAccountId ?? null,
      },
    })

    return NextResponse.json({ ...post, hashtags: JSON.parse(post.hashtags) }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/posts]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
