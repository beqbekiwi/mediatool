import { db } from './db'
import { publishLinkedInPost } from './social/linkedin'
import {
  publishFacebookPost, publishFacebookImagePost, publishFacebookReel,
  publishInstagramImagePost, publishInstagramReel,
} from './social/meta'

export async function publishDuePosts(workspaceId?: string) {
  const where = {
    status: 'scheduled',
    autoPublish: true,
    scheduledAt: { lte: new Date() },
    platformPostId: null,
    ...(workspaceId ? { workspaceId } : {}),
  }

  const posts = await db.post.findMany({
    where,
    include: {
      socialAccount: true,
      mediaItems: { include: { media: true }, orderBy: { order: 'asc' } },
    },
  })

  if (posts.length === 0) return { published: 0, failed: 0 }

  let published = 0
  let failed = 0

  for (const post of posts) {
    try {
      await db.post.update({ where: { id: post.id }, data: { status: 'publishing' } })

      const platformPostId = await publishPost(post)

      await db.post.update({
        where: { id: post.id },
        data: { status: 'published', publishedAt: new Date(), platformPostId, publishError: null },
      })
      published++
      console.log(`[Publisher] ✓ "${post.title}" veröffentlicht (${post.platform})`)
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      await db.post.update({
        where: { id: post.id },
        data: { status: 'failed', publishError: error },
      })
      failed++
      console.error(`[Publisher] ✗ "${post.title}" fehlgeschlagen:`, error)
    }
  }

  return { published, failed }
}

async function publishPost(post: Awaited<ReturnType<typeof db.post.findMany>>[0] & {
  socialAccount: { platform: string; accessToken: string; pageId: string | null; igUserId: string | null } | null
  mediaItems: Array<{ media: { url: string; type: string } }>
}): Promise<string> {
  const account = post.socialAccount
  if (!account) throw new Error('Kein Social Account zugewiesen')

  const firstMedia = post.mediaItems[0]?.media
  const hasVideo = firstMedia?.type === 'video'
  const hasImage = firstMedia?.type === 'image'

  switch (account.platform) {
    case 'linkedin': {
      return await publishLinkedInPost(account.accessToken, post.socialAccount!.pageId ?? '', post.content)
    }

    case 'facebook': {
      if (!account.pageId) throw new Error('Keine Facebook Page ID')
      if (hasVideo || post.contentType === 'reel') {
        return await publishFacebookReel(account.pageId, account.accessToken, firstMedia!.url, post.content)
      }
      if (hasImage) {
        return await publishFacebookImagePost(account.pageId, account.accessToken, post.content, firstMedia!.url)
      }
      return await publishFacebookPost(account.pageId, account.accessToken, post.content)
    }

    case 'instagram': {
      if (!account.igUserId) throw new Error('Kein Instagram User ID')
      if (hasVideo || post.contentType === 'reel') {
        return await publishInstagramReel(account.igUserId, account.accessToken, firstMedia!.url, post.content)
      }
      if (hasImage) {
        return await publishInstagramImagePost(account.igUserId, account.accessToken, firstMedia!.url, post.content)
      }
      throw new Error('Instagram erfordert ein Bild oder Video')
    }

    default:
      throw new Error(`Unbekannte Plattform: ${account.platform}`)
  }
}

export async function publishSinglePost(postId: string): Promise<{ success: boolean; error?: string }> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      socialAccount: true,
      mediaItems: { include: { media: true }, orderBy: { order: 'asc' } },
    },
  })

  if (!post) return { success: false, error: 'Post nicht gefunden' }

  try {
    await db.post.update({ where: { id: postId }, data: { status: 'publishing' } })
    const platformPostId = await publishPost(post)
    await db.post.update({
      where: { id: postId },
      data: { status: 'published', publishedAt: new Date(), platformPostId, publishError: null },
    })
    return { success: true }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    await db.post.update({ where: { id: postId }, data: { status: 'failed', publishError: error } })
    return { success: false, error }
  }
}
