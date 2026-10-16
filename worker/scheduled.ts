import { Env } from '../functions/types';
import { syncService } from '../functions/services/syncService';

/**
 * Cloudflare Scheduled Worker (Cron Trigger)
 * Automatically triggers every 15-20 minutes in the cloud 24/7.
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Cron Trigger] Scheduled event fired at ${new Date(event.scheduledTime).toISOString()}`);
    ctx.waitUntil(
      syncService.runSync(env).then((results) => {
        console.log('[Cron Trigger] Sync finished:', JSON.stringify(results));
      }).catch((err) => {
        console.error('[Cron Trigger] Sync error:', err);
      })
    );
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', worker: 'xtra-scheduled-worker' });
    }

    // Manual sync trigger
    if (url.pathname === '/trigger') {
      if (env.CRON_SECRET) {
        const secret = url.searchParams.get('secret');
        if (secret !== env.CRON_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
      }

      const results = await syncService.runSync(env);
      return Response.json({ success: true, results });
    }

    return new Response('Xtra Worker is running. Trigger via cron or /trigger endpoint.', { status: 200 });
  },
};
