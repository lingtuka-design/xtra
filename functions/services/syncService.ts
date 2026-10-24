import { Env, SyncResult } from '../types';
import { facebookPoster } from './facebookPoster';
import { whatsappPoster } from './whatsappPoster';
import { telegramPoster } from './telegramPoster';

export class SyncService {
  /**
   * News scraping is permanently disabled.
   * runSync only processes the scheduled Facebook & WhatsApp Queue Drip.
   */
  public async runSync(env: Env, _targetSource?: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Process the next queued item for Facebook & WhatsApp
    try {
      if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
        const MIN_POST_INTERVAL_MS = 45 * 60 * 1000; // Strictly 45 minutes gap between published posts
        const INITIAL_QUEUE_DELAY_MS = 5 * 60 * 1000; // 5 minutes initial buffer after queueing a post

        const now = Date.now();

        // Helper to parse SQLite UTC timestamps safely into milliseconds
        const parseSqliteUtc = (dateStr?: string | null): number => {
          if (!dateStr) return 0;
          const iso = dateStr.includes('T')
            ? (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
            : dateStr.replace(' ', 'T') + 'Z';
          const t = new Date(iso).getTime();
          return isNaN(t) ? 0 : t;
        };

        // Night Sleep Pause: 11:00 PM to 7:00 AM IST
        // Active publishing window is strictly 7:00 AM to 11:00 PM IST
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now + istOffsetMs);
        const istHours = istDate.getUTCHours();
        const istMinutes = istDate.getUTCMinutes();
        const istTotalMinutes = istHours * 60 + istMinutes;

        const ACTIVE_START_MINS = 7 * 60; // 7:00 AM IST
        const ACTIVE_END_MINS = 23 * 60;  // 11:00 PM IST

        if (istTotalMinutes < ACTIVE_START_MINS || istTotalMinutes >= ACTIVE_END_MINS) {
          const next7AmIst = new Date(istDate);
          if (istTotalMinutes >= ACTIVE_END_MINS) {
            next7AmIst.setUTCDate(next7AmIst.getUTCDate() + 1);
          }
          next7AmIst.setUTCHours(7, 0, 0, 0);
          const resumeTimeMs = next7AmIst.getTime() - istOffsetMs;
          const minsUntil7Am = Math.max(1, Math.ceil((resumeTimeMs - now) / 60000));
          console.log(
            `[FB Queue Drip] Night pause active (11:00 PM - 7:00 AM IST). Queue drip will resume at 7:00 AM IST in ${Math.floor(
              minsUntil7Am / 60
            )}h ${minsUntil7Am % 60}m.`
          );
          return results;
        }

        // Condition 1: Check when the last post was published via the queue (must have 45 mins gap)
        const lastPublished = await env.DB.prepare(
          "SELECT updated_at FROM posts WHERE facebook_status = 'published' AND (publish_source IS NULL OR publish_source != 'direct') ORDER BY updated_at DESC LIMIT 1"
        ).first<{ updated_at: string }>();

        if (lastPublished && lastPublished.updated_at) {
          const lastPublishedTime = parseSqliteUtc(lastPublished.updated_at);
          const timeSinceLastPublish = now - lastPublishedTime;
          if (timeSinceLastPublish > 0 && timeSinceLastPublish < MIN_POST_INTERVAL_MS) {
            const minsLeft = Math.ceil((MIN_POST_INTERVAL_MS - timeSinceLastPublish) / 60000);
            console.log(
              `[FB Queue Drip] Last queued post was published ${Math.floor(timeSinceLastPublish / 60000)}m ago. Waiting ${minsLeft}m more to maintain 45m drip interval.`
            );
            return results;
          }
        }

        // Condition 2: Check the oldest queued item (must have been queued for at least 5 mins)
        const nextQueued = await env.DB.prepare(
          "SELECT * FROM posts WHERE facebook_status = 'queued' ORDER BY updated_at ASC, id ASC LIMIT 1"
        ).first<any>();

        if (nextQueued) {
          const queuedTime = parseSqliteUtc(nextQueued.updated_at || nextQueued.created_at);
          const timeSinceQueued = now - queuedTime;
          if (timeSinceQueued > 0 && timeSinceQueued < INITIAL_QUEUE_DELAY_MS) {
            const minsLeft = Math.ceil((INITIAL_QUEUE_DELAY_MS - timeSinceQueued) / 60000);
            console.log(
              `[FB Queue Drip] Post #${nextQueued.id} was queued ${Math.floor(timeSinceQueued / 60000)}m ago. Waiting ${minsLeft}m more for 5m initial review buffer.`
            );
            return results;
          }

          console.log(`[FB Queue Drip] Auto-publishing queued post #${nextQueued.id} to Facebook & WhatsApp...`);
          const fbRes = await facebookPoster.postNews(
            nextQueued.mizo_translation,
            nextQueued.primary_image_url,
            env.FB_PAGE_ID,
            env.FB_PAGE_ACCESS_TOKEN
          );

          if (fbRes.success) {
            await env.DB.prepare(
              "UPDATE posts SET facebook_status = 'published', publish_source = 'queue', facebook_post_id = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(fbRes.postId, nextQueued.id).run();
            console.log(`[FB Queue Drip] Post #${nextQueued.id} successfully published to Facebook.`);

            // Broadcast to WhatsApp Channel simultaneously
            try {
              console.log(`[WA Channel Drip] Auto-publishing post #${nextQueued.id} to WhatsApp Channel...`);
              const waRes = await whatsappPoster.postNews(
                nextQueued.mizo_translation,
                nextQueued.primary_image_url,
                env.WHATSAPP_API_TOKEN,
                env.WHATSAPP_CHANNEL_ID,
                env.WHATSAPP_API_URL
              );
              if (waRes.success) {
                console.log(`[WA Channel Drip] Post #${nextQueued.id} successfully published to WhatsApp Channel.`);
              } else {
                console.warn(`[WA Channel Drip] WhatsApp post #${nextQueued.id} failed:`, waRes.error);
              }
            } catch (waErr: any) {
              console.warn('[WA Channel Drip] Error in WhatsApp drip broadcast:', waErr.message);
            }

            // Broadcast to Telegram Channel simultaneously
            try {
              console.log(`[Telegram Drip] Auto-publishing post #${nextQueued.id} to Telegram Channel...`);
              const tgRes = await telegramPoster.postNews(
                nextQueued.mizo_translation,
                nextQueued.primary_image_url,
                env.TELEGRAM_BOT_TOKEN,
                env.TELEGRAM_CHANNEL_ID
              );
              if (tgRes.success) {
                console.log(`[Telegram Drip] Post #${nextQueued.id} successfully published to Telegram Channel.`);
              } else {
                console.warn(`[Telegram Drip] Telegram post #${nextQueued.id} failed:`, tgRes.error);
              }
            } catch (tgErr: any) {
              console.warn('[Telegram Drip] Error in Telegram drip broadcast:', tgErr.message);
            }
          } else {
            await env.DB.prepare(
              "UPDATE posts SET facebook_status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(fbRes.error || 'Drip post failed', nextQueued.id).run();
            console.warn(`[FB Queue Drip] Post #${nextQueued.id} failed:`, fbRes.error);
          }
        }
      }
    } catch (dripErr: any) {
      console.warn('Error in FB Queue drip execution:', dripErr.message);
    }

    return results;
  }
}

export const syncService = new SyncService();
