import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import type { NextProxy, ProxyConfig } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!'
)

const PUBLIC_PATHS = ['/login', '/register', '/api/auth']

export const proxy: NextProxy = async (req: NextRequest) => {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get('ss_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('ss_token')
    return res
  }
}

export const config: ProxyConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
