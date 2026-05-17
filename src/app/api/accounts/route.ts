import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const workspaces = await getUserWorkspaces(session.userId)
    const workspaceId = workspaces[0]?.id
    if (!workspaceId) return NextResponse.json([])

    const accounts = await db.socialAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, platform: true, accountType: true, accountName: true,
        accountId: true, connected: true, tokenExpiresAt: true, pageId: true,
        igUserId: true, createdAt: true,
      },
    })

    return NextResponse.json(accounts)
  } catch (e) {
    console.error('[GET /api/accounts]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
