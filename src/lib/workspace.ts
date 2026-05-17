import { db } from './db'

export async function getUserWorkspaces(userId: string) {
  return db.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      brandProfile: true,
      _count: { select: { posts: true, socialAccounts: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getWorkspace(workspaceId: string, userId: string) {
  return db.workspace.findFirst({
    where: {
      id: workspaceId,
      members: { some: { userId } },
    },
    include: {
      brandProfile: true,
      socialAccounts: true,
      _count: { select: { posts: true } },
    },
  })
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}
