import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { exchangeFacebookCode, getLongLivedToken, getUserPages, getIgUser } from '@/lib/social/meta'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.redirect(new URL('/login', req.url))

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error || !code) {
      return NextResponse.redirect(new URL('/accounts?error=facebook_denied', req.url))
    }

    const shortToken = await exchangeFacebookCode(code)
    const longToken = await getLongLivedToken(shortToken.access_token)
    const pages = await getUserPages(longToken)

    const workspaces = await getUserWorkspaces(session.userId)
    const workspaceId = workspaces[0]?.id!

    for (const page of pages) {
      // Facebook Page speichern
      await db.socialAccount.upsert({
        where: { workspaceId_platform_accountId: { workspaceId, platform: 'facebook', accountId: page.id } },
        create: {
          workspaceId, platform: 'facebook', accountType: 'page',
          accountName: page.name, accountId: page.id,
          accessToken: page.access_token, pageId: page.id, connected: true,
        },
        update: {
          accountName: page.name, accessToken: page.access_token,
          pageId: page.id, connected: true,
        },
      })

      // Verknüpftes Instagram Business Account speichern
      if (page.instagram_business_account?.id) {
        try {
          const igUser = await getIgUser(page.instagram_business_account.id, page.access_token)
          await db.socialAccount.upsert({
            where: { workspaceId_platform_accountId: { workspaceId, platform: 'instagram', accountId: igUser.id } },
            create: {
              workspaceId, platform: 'instagram', accountType: 'business',
              accountName: igUser.username, accountId: igUser.id,
              accessToken: page.access_token, pageId: page.id,
              igUserId: igUser.id, connected: true,
            },
            update: {
              accountName: igUser.username, accessToken: page.access_token,
              pageId: page.id, igUserId: igUser.id, connected: true,
            },
          })
        } catch (e) {
          console.error('[FB callback] Instagram account error:', e)
        }
      }
    }

    return NextResponse.redirect(new URL('/accounts?success=facebook', req.url))
  } catch (e) {
    console.error('[Facebook callback]', e)
    return NextResponse.redirect(new URL('/accounts?error=facebook_failed', req.url))
  }
}
