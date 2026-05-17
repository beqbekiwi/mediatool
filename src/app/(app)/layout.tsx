import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserWorkspaces } from '@/lib/workspace'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const workspaces = await getUserWorkspaces(session.userId)
  if (workspaces.length === 0) redirect('/onboarding')

  const workspace = workspaces[0]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar workspaceName={workspace.name} userName={session.user.name ?? session.user.email} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
