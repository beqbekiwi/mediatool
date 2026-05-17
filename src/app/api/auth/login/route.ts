import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
    }

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[Login]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
