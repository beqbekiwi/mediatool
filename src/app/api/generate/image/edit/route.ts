import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'
import { put } from '@vercel/blob'
import OpenAI, { toFile } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function urlToBuffer(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) {
    return Buffer.from(url.split(',')[1], 'base64')
  }
  const ab = await fetch(url).then(r => r.arrayBuffer())
  return Buffer.from(ab as ArrayBuffer)
}

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
    const customPrompt = formData.get('prompt') as string | null

    if (!baseImageUrl || !file) {
      return NextResponse.json({ error: 'Basis-Bild und Upload-Datei erforderlich' }, { status: 400 })
    }

    const prompt = customPrompt?.trim() ||
      'Take the second image (the screenshot/photo) and naturally integrate it into the first image. ' +
      'If the first image shows a device with a screen, place the screenshot on that screen. ' +
      'Keep the overall composition and style of the first image intact.'

    const baseBuffer = await urlToBuffer(baseImageUrl)
    const baseFile = await toFile(baseBuffer, 'base.png', { type: 'image/png' })

    const uploadBuffer = Buffer.from(await file.arrayBuffer())
    const uploadFile = await toFile(uploadBuffer, file.name, { type: file.type || 'image/png' })

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: [baseFile, uploadFile],
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
    })

    const item = response.data?.[0]
    if (!item) throw new Error('Kein Bild generiert')

    const filename = `ai-composite-${Date.now()}.png`
    let storedUrl: string

    if (item.b64_json) {
      const buffer = Buffer.from(item.b64_json, 'base64')
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(`media/${workspaceId}/${filename}`, buffer, { access: 'public', contentType: 'image/png' })
        storedUrl = blob.url
      } else {
        storedUrl = `data:image/png;base64,${item.b64_json}`
      }
    } else {
      storedUrl = item.url!
    }

    const media = await db.media.create({
      data: {
        workspaceId,
        type: 'image',
        url: storedUrl,
        filename,
        mimeType: 'image/png',
        width: 1024,
        height: 1024,
        source: 'ai-dalle',
        aiPrompt: prompt,
      },
    })

    return NextResponse.json({ media, url: storedUrl }, { status: 201 })
  } catch (e: unknown) {
    console.error('[generate/image/edit]', e)
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
