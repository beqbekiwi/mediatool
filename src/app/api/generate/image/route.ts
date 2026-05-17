import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'
import { put } from '@vercel/blob'
import { experimental_generateImage as generateImage } from 'ai'
import { openai } from '@ai-sdk/openai'

function sizeForPlatform(platform: string): '1024x1024' | '1792x1024' | '1024x1792' {
  if (platform === 'instagram') return '1024x1024'
  if (platform === 'linkedin') return '1792x1024'
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

    const { image } = await generateImage({
      model: openai.image('dall-e-3'),
      prompt: `Social media image for ${platform}. ${prompt}. Professional, high quality, suitable for business social media.`,
      size,
      providerOptions: { openai: { quality: 'standard' } },
    })

    const filename = `ai-generated-${Date.now()}.png`

    let blobUrl: string
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`media/${workspaceId}/${filename}`, Buffer.from(image.uint8Array), {
        access: 'public',
        contentType: 'image/png',
      })
      blobUrl = blob.url
    } else {
      // Fallback: embed as data URL (works without Blob storage)
      blobUrl = `data:image/png;base64,${image.base64}`
    }

    const media = await db.media.create({
      data: {
        workspaceId,
        type: 'image',
        url: blobUrl,
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

    return NextResponse.json({ media, url: blobUrl }, { status: 201 })
  } catch (e: unknown) {
    console.error('[generate/image]', e)
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
