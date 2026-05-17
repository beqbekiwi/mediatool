import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaces = await getUserWorkspaces(session.userId)
    const workspaceId = workspaces[0]?.id
    const { id } = await params

    const media = await db.media.findFirst({ where: { id, workspaceId } })
    if (!media) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    // Blob löschen
    try { await del(media.url) } catch { /* Blob bereits gelöscht */ }

    await db.media.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/media/:id]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
