import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg']

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaces = await getUserWorkspaces(session.userId)
    const workspaceId = workspaces[0]?.id
    if (!workspaceId) return NextResponse.json([])

    const media = await db.media.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(media.map(m => ({ ...m, tags: JSON.parse(m.tags) })))
  } catch (e) {
    console.error('[GET /api/media]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaces = await getUserWorkspaces(session.userId)
    const workspaceId = workspaces[0]?.id
    if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const description = formData.get('description') as string | null
    const tags = formData.get('tags') as string | null

    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Ungültiger Dateityp' }, { status: 400 })
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ error: `Datei zu groß (max. ${isVideo ? '500 MB' : '10 MB'})` }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`workspaces/${workspaceId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    })

    const media = await db.media.create({
      data: {
        workspaceId,
        type: isVideo ? 'video' : 'image',
        url: blob.url,
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
        source: 'upload',
        description: description ?? null,
        tags: tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)) : '[]',
      },
    })

    return NextResponse.json({ ...media, tags: JSON.parse(media.tags) }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/media]', e)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}
