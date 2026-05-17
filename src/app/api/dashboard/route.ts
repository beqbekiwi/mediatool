import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getUserWorkspaces } from '@/lib/workspace'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const workspaces = await getUserWorkspaces(session.userId)
  const workspaceId = workspaces[0]?.id
  if (!workspaceId) return NextResponse.json({ error: 'Kein Workspace' }, { status: 404 })

  const [total, drafts, review, approved, scheduled, published, failed, upcoming, accounts] =
    await Promise.all([
      db.post.count({ where: { workspaceId } }),
      db.post.count({ where: { workspaceId, status: 'draft' } }),
      db.post.count({ where: { workspaceId, status: 'review' } }),
      db.post.count({ where: { workspaceId, status: 'approved' } }),
      db.post.count({ where: { workspaceId, status: 'scheduled' } }),
      db.post.count({ where: { workspaceId, status: 'published' } }),
      db.post.count({ where: { workspaceId, status: 'failed' } }),
      db.post.findMany({
        where: { workspaceId, status: 'scheduled', scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        include: { mediaItems: { include: { media: true }, take: 1 } },
      }),
      db.socialAccount.findMany({ where: { workspaceId, connected: true } }),
    ])

  return NextResponse.json({
    stats: { total, drafts, review, approved, scheduled, published, failed },
    upcoming,
    connectedAccounts: accounts.map(a => ({ platform: a.platform, accountName: a.accountName })),
  })
}
