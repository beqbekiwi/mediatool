import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ss_token')?.value
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {})
    cookieStore.delete('ss_token')
  }
  return NextResponse.json({ success: true })
}
