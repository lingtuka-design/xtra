/**
 * Cloudflare Scheduled Worker (Cron Trigger: Every 1 minute)
 * Runs 24/7 in the cloud:
 * - Checks live goals for tracked matches every ~30-60s
 * - Syncs transfer news & drip queue every 5 minutes
 */
export default {
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext): Promise<void> {
    const scheduledDate = new Date(event.scheduledTime);
    const minute = scheduledDate.getUTCMinutes();

    // 1. Live Goal Auto-Check (Runs every minute in the background)
    ctx.waitUntil(
      fetch('https://xtra-byd.pages.dev/api/live/poll', {
        method: 'POST',
        headers: { 'User-Agent': 'Xtra-Cron-Worker/1.0' },
      })
        .then(async (res) => {
          const text = await res.text();
          console.log(`[Xtra Cron] Live Goal Poll: HTTP ${res.status} - ${text.substring(0, 100)}`);
        })
        .catch((err) => console.warn('[Xtra Cron] Live Goal Poll warning:', err.message))
    );

    // 2. Transfer News Sync & Queue Drip (Runs every 5 minutes: :00, :05, :10, etc.)
    if (minute % 5 === 0) {
      ctx.waitUntil(
        fetch('https://xtra-byd.pages.dev/api/sync', {
          method: 'POST',
          headers: { 'User-Agent': 'Xtra-Cron-Worker/1.0' },
        })
          .then(async (res) => {
            const body = await res.text();
            console.log(`[Xtra Cron] 5-Min Sync: HTTP ${res.status} - ${body.substring(0, 120)}`);
          })
          .catch((err) => {
            console.error('[Xtra Cron] 5-Min Sync error:', err);
          })
      );
    }

    // 3. Keep-alive ping for WhatsApp Bot microservice
    if (env.WHATSAPP_API_URL && minute % 5 === 0) {
      ctx.waitUntil(
        fetch(`${env.WHATSAPP_API_URL.replace(/\/$/, '')}/health`)
          .then((r) => console.log(`[Xtra Cron] WhatsApp bot keep-alive: ${r.status}`))
          .catch((e) => console.warn('[Xtra Cron] WhatsApp bot ping error:', e.message))
      );
    }
  },

  async fetch(request: Request): Promise<Response> {
    console.log('[Xtra Cron] Manual HTTP trigger received');
    const res = await fetch('https://xtra-byd.pages.dev/api/sync', {
      method: 'POST',
      headers: {
        'User-Agent': 'Xtra-Cron-Worker/1.0',
      },
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
