import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'
import { put } from '@vercel/blob'
import sharp from 'sharp'

async function urlToBuffer(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) {
    return Buffer.from(url.split(',')[1], 'base64')
  }
  const ab = await fetch(url).then(r => r.arrayBuffer())
  return Buffer.from(ab as ArrayBuffer)
}

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const ws = await getUserWorkspaces(session.userId)
    const workspaceId = ws[0]?.id
    if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

    const formData = await req.formData()
    const baseImageUrl = formData.get('baseImageUrl') as string
    const file = formData.get('file') as File
    const position = ((formData.get('position') as string) || 'bottom-right') as Position
    const scale = Math.min(1, Math.max(0.05, parseFloat((formData.get('scale') as string) || '0.25')))

    if (!baseImageUrl || !file) {
      return NextResponse.json({ error: 'Basis-Bild und Logo-Datei erforderlich' }, { status: 400 })
    }

    const baseBuffer = await urlToBuffer(baseImageUrl)
    const base = sharp(baseBuffer)
    const baseMeta = await base.metadata()
    const bw = baseMeta.width ?? 1024
    const bh = baseMeta.height ?? 1024

    const logoBuffer = Buffer.from(await file.arrayBuffer())
    const targetWidth = Math.round(bw * scale)
    const resizedLogo = await sharp(logoBuffer)
      .resize(targetWidth, undefined, { fit: 'inside', withoutEnlargement: false })
      .ensureAlpha()
      .toBuffer()

    const logoMeta = await sharp(resizedLogo).metadata()
    const lw = logoMeta.width ?? targetWidth
    const lh = logoMeta.height ?? targetWidth

    const MARGIN = Math.round(bw * 0.03)
    let left: number, top: number
    switch (position) {
      case 'top-left':    left = MARGIN;          top = MARGIN;          break
      case 'top-right':   left = bw - lw - MARGIN; top = MARGIN;          break
      case 'bottom-left': left = MARGIN;          top = bh - lh - MARGIN; break
      case 'center':      left = Math.round((bw - lw) / 2); top = Math.round((bh - lh) / 2); break
      default:            left = bw - lw - MARGIN; top = bh - lh - MARGIN; // bottom-right
    }

    const composited = await sharp(baseBuffer)
      .composite([{ input: resizedLogo, left, top, blend: 'over' }])
      .png()
      .toBuffer()

    const filename = `overlay-${Date.now()}.png`
    let storedUrl: string

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`media/${workspaceId}/${filename}`, composited, { access: 'public', contentType: 'image/png' })
      storedUrl = blob.url
    } else {
      storedUrl = `data:image/png;base64,${composited.toString('base64')}`
    }

    const media = await db.media.create({
      data: {
        workspaceId,
        type: 'image',
        url: storedUrl,
        filename,
        mimeType: 'image/png',
        width: bw,
        height: bh,
        source: 'upload',
      },
    })

    return NextResponse.json({ media, url: storedUrl }, { status: 201 })
  } catch (e: unknown) {
    console.error('[media/overlay]', e)
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
