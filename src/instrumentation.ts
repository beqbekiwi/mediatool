// Lokaler Scheduler für die Entwicklung (node-cron)
// In Produktion: Vercel Cron Jobs (/api/scheduler) verwenden

export async function register() {
  if (process.env.NODE_ENV !== 'development') return
  if (process.env.ENABLE_LOCAL_SCHEDULER !== 'true') return

  const { default: cron } = await import('node-cron')
  const { publishDuePosts } = await import('./lib/publisher')

  const globalForCron = globalThis as unknown as { schedulerStarted?: boolean }
  if (globalForCron.schedulerStarted) return
  globalForCron.schedulerStarted = true

  cron.schedule('*/10 * * * *', async () => {
    try {
      const result = await publishDuePosts()
      if (result.published > 0 || result.failed > 0) {
        console.log(`[Local Scheduler] ${result.published} veröffentlicht, ${result.failed} fehlgeschlagen`)
      }
    } catch (e) {
      console.error('[Local Scheduler] Fehler:', e)
    }
  })

  console.log('[Local Scheduler] Gestartet – prüft alle 10 Minuten')
}
