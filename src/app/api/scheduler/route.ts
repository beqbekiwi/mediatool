// Vercel Cron Job Endpoint – wird alle 10 Minuten aufgerufen
// Konfiguration in vercel.json: { "crons": [{ "path": "/api/scheduler", "schedule": "*/10 * * * *" }] }
// Für lokale Entwicklung: node-cron in src/instrumentation.ts

import { NextRequest, NextResponse } from 'next/server'
import { publishDuePosts } from '@/lib/publisher'

export async function GET(req: NextRequest) {
  // Sicherheits-Check: Nur Vercel Cron oder interner Aufruf
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await publishDuePosts()
    console.log(`[Cron] Scheduler: ${result.published} veröffentlicht, ${result.failed} fehlgeschlagen`)
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (e) {
    console.error('[Cron] Scheduler-Fehler:', e)
    return NextResponse.json({ error: 'Scheduler-Fehler' }, { status: 500 })
  }
}

// Manueller POST-Trigger (für einzelne Posts)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { postId } = await req.json()
    if (postId) {
      const { publishSinglePost } = await import('@/lib/publisher')
      const result = await publishSinglePost(postId)
      return NextResponse.json(result)
    }
    const result = await publishDuePosts()
    return NextResponse.json(result)
  } catch (e) {
    console.error('[Scheduler POST]', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
