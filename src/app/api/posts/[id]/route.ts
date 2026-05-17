import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

async function getWorkspaceId(userId: string) {
  const ws = await getUserWorkspaces(userId)
  return ws[0]?.id
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    const { id } = await params

    const post = await db.post.findFirst({
      where: { id, workspaceId },
      include: { mediaItems: { include: { media: true }, orderBy: { order: 'asc' } }, socialAccount: true },
    })

    if (!post) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    return NextResponse.json({ ...post, hashtags: JSON.parse(post.hashtags) })
  } catch (e) {
    console.error('[GET /api/posts/:id]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    const { id } = await params
    const body = await req.json()

    const existing = await db.post.findFirst({ where: { id, workspaceId } })
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const post = await db.post.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.hook !== undefined && { hook: body.hook }),
        ...(body.cta !== undefined && { cta: body.cta }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.contentType !== undefined && { contentType: body.contentType }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.style !== undefined && { style: body.style }),
        ...(body.hashtags !== undefined && { hashtags: JSON.stringify(body.hashtags) }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.autoPublish !== undefined && { autoPublish: body.autoPublish }),
        ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.imageIdea !== undefined && { imageIdea: body.imageIdea }),
        ...(body.videoIdea !== undefined && { videoIdea: body.videoIdea }),
        ...(body.socialAccountId !== undefined && { socialAccountId: body.socialAccountId }),
        ...(body.firstComment !== undefined && { firstComment: body.firstComment }),
      },
    })

    return NextResponse.json({ ...post, hashtags: JSON.parse(post.hashtags) })
  } catch (e) {
    console.error('[PUT /api/posts/:id]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    const { id } = await params

    const existing = await db.post.findFirst({ where: { id, workspaceId } })
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    await db.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/posts/:id]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
