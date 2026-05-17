import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

async function getWorkspaceId(userId: string) {
  const ws = await getUserWorkspaces(userId)
  return ws[0]?.id
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    const { id } = await params
    const body = await req.json()

    const existing = await db.contentTheme.findFirst({ where: { id, workspaceId } })
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const theme = await db.contentTheme.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.keywords !== undefined && { keywords: JSON.stringify(body.keywords) }),
        ...(body.active !== undefined && { active: body.active }),
      },
    })

    return NextResponse.json({ ...theme, keywords: JSON.parse(theme.keywords) })
  } catch (e) {
    console.error('[PUT /api/themes/:id]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaceId = await getWorkspaceId(session.userId)
    const { id } = await params

    const existing = await db.contentTheme.findFirst({ where: { id, workspaceId } })
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    await db.contentTheme.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/themes/:id]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
