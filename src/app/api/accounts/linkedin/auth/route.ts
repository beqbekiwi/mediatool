import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import { getLinkedInAuthUrl } from '@/lib/social/linkedin'
import crypto from 'crypto'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const workspaces = await getUserWorkspaces(session.userId)
  const workspaceId = workspaces[0]?.id ?? ''
  const state = crypto.randomBytes(16).toString('hex')

  return NextResponse.redirect(getLinkedInAuthUrl(state, workspaceId))
}
