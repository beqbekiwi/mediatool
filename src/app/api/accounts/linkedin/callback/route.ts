import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { exchangeLinkedInCode, getLinkedInProfile } from '@/lib/social/linkedin'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.redirect(new URL('/login', req.url))

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error || !code) {
      return NextResponse.redirect(new URL('/accounts?error=linkedin_denied', req.url))
    }

    const tokens = await exchangeLinkedInCode(code)
    if (tokens.error) {
      return NextResponse.redirect(new URL('/accounts?error=linkedin_token', req.url))
    }

    const profile = await getLinkedInProfile(tokens.access_token)
    const workspaces = await getUserWorkspaces(session.userId)
    const workspaceId = workspaces[0]?.id!

    await db.socialAccount.upsert({
      where: { workspaceId_platform_accountId: { workspaceId, platform: 'linkedin', accountId: profile.sub } },
      create: {
        workspaceId,
        platform: 'linkedin',
        accountType: 'personal',
        accountName: profile.name,
        accountId: profile.sub,
        accessToken: tokens.access_token,
        tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        connected: true,
      },
      update: {
        accountName: profile.name,
        accessToken: tokens.access_token,
        tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        connected: true,
      },
    })

    return NextResponse.redirect(new URL('/accounts?success=linkedin', req.url))
  } catch (e) {
    console.error('[LinkedIn callback]', e)
    return NextResponse.redirect(new URL('/accounts?error=linkedin_failed', req.url))
  }
}
