import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from './db'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!'
)
const COOKIE = 'ss_token'
const EXPIRES_IN = 30 * 24 * 60 * 60 * 1000 // 30 Tage

export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + EXPIRES_IN),
    },
  })

  return token
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRES_IN / 1000,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null

  try {
    await jwtVerify(token, SECRET)
  } catch {
    return null
  }

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null
  return session
}

export async function getUser() {
  const session = await getSession()
  return session?.user ?? null
}

export async function requireUser() {
  const user = await getUser()
  if (!user) throw new Error('Nicht angemeldet')
  return user
}

export async function deleteSession(token: string) {
  await db.session.deleteMany({ where: { token } })
}
