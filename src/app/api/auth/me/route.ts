import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })

  const workspaces = await getUserWorkspaces(session.userId)
  return NextResponse.json({ user: session.user, workspaces })
}
