/**
 * Cloudflare Scheduled Worker (Cron Trigger: Every 15 minutes)
 * Automatically triggers the Xtra sync & auto-drip poster 24/7 in the cloud.
 */
export default {
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext): Promise<void> {
    const time = new Date(event.scheduledTime).toISOString();
    console.log(`[Xtra Cron] Waking up at ${time} to trigger /api/sync...`);

    ctx.waitUntil(
      fetch('https://xtra-byd.pages.dev/api/sync', {
        method: 'POST',
        headers: {
          'User-Agent': 'Xtra-Cron-Worker/1.0',
        },
      })
        .then(async (res) => {
          const body = await res.text();
          console.log(`[Xtra Cron] Sync completed with HTTP ${res.status}: ${body.substring(0, 150)}`);
        })
        .catch((err) => {
          console.error('[Xtra Cron] Error triggering sync:', err);
        })
    );
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
