import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'
import { generateSlug } from '@/lib/workspace'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, workspaceName, workspaceType } = await req.json()

    if (!email || !password || !name || !workspaceName) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail ist bereits registriert' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const slug = generateSlug(workspaceName)

    // Einzigartigen Slug sicherstellen
    const slugExists = await db.workspace.findUnique({ where: { slug } })
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        memberships: {
          create: {
            role: 'owner',
            workspace: {
              create: {
                name: workspaceName,
                slug: finalSlug,
                type: workspaceType ?? 'business',
              },
            },
          },
        },
      },
    })

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[Register]', e)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
