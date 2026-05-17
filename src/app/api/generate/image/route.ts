import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'
import { put } from '@vercel/blob'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function sizeForPlatform(platform: string): '1024x1024' | '1536x1024' | '1024x1536' {
  if (platform === 'instagram') return '1024x1024'
  if (platform === 'linkedin') return '1536x1024'
  return '1024x1024'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const ws = await getUserWorkspaces(session.userId)
    const workspaceId = ws[0]?.id
    if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

    const { prompt, platform = 'facebook', postId } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt fehlt' }, { status: 400 })

    const size = sizeForPlatform(platform)
    const [w, h] = size.split('x').map(Number)

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: `Social media post image for ${platform}. ${prompt}. Professional, high quality, suitable for business social media. No text overlays.`,
      n: 1,
      size,
      quality: 'medium',
    })

    const item = response.data?.[0]
    if (!item) throw new Error('Kein Bild generiert')

    // gpt-image-1 returns b64_json, dall-e-3 returns url
    const b64 = item.b64_json
    const filename = `ai-generated-${Date.now()}.png`

    let storedUrl: string
    if (b64) {
      const buffer = Buffer.from(b64, 'base64')
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(`media/${workspaceId}/${filename}`, buffer, {
          access: 'public',
          contentType: 'image/png',
        })
        storedUrl = blob.url
      } else {
        storedUrl = `data:image/png;base64,${b64}`
      }
    } else {
      const imageUrl = item.url!
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const imgBuffer = await fetch(imageUrl).then(r => r.arrayBuffer())
        const blob = await put(`media/${workspaceId}/${filename}`, Buffer.from(imgBuffer), {
          access: 'public',
          contentType: 'image/png',
        })
        storedUrl = blob.url
      } else {
        storedUrl = imageUrl
      }
    }

    const media = await db.media.create({
      data: {
        workspaceId,
        type: 'image',
        url: storedUrl,
        filename,
        mimeType: 'image/png',
        width: w,
        height: h,
        source: 'ai-dalle',
        aiPrompt: prompt,
      },
    })

    if (postId) {
      const existing = await db.postMedia.count({ where: { postId } })
      await db.postMedia.create({
        data: { postId, mediaId: media.id, order: existing },
      })
    }

    return NextResponse.json({ media, url: storedUrl }, { status: 201 })
  } catch (e: unknown) {
    console.error('[generate/image]', e)
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
