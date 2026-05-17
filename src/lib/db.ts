import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'

function createClient() {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  // Strip "file:" prefix and resolve relative to project root
  const filePath = dbUrl.replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url: /*turbopackIgnore: true*/ filePath })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
