import { Env, SyncResult } from '../types';
import { twitterScraper } from './twitterScraper';
import { geminiTranslator } from './geminiTranslator';
import { facebookPoster } from './facebookPoster';

export class SyncService {
  /**
   * Run sync job across configured sources
   */
  public async runSync(env: Env, targetSource?: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // 1. Determine sources to scrape
    let sources: string[] = [];

    if (targetSource) {
      sources = [targetSource];
    } else {
      // Query active sources from D1
      try {
        const { results: dbSources } = await env.DB.prepare(
          'SELECT id FROM sources WHERE enabled = 1'
        ).all<{ id: string }>();

        if (dbSources && dbSources.length > 0) {
          sources = dbSources.map((s) => s.id);
        }
      } catch (err: any) {
        console.warn('Could not read sources from D1, falling back to default:', err.message);
      }

      if (sources.length === 0) {
        // Fallback to DEFAULT_SOURCES or hardcoded Tier-1 sources
        const envSources = env.DEFAULT_SOURCES?.split(',').map((s) => s.trim()) || [];
        sources = envSources.length > 0 ? envSources : ['David_Ornstein'];
      }
    }

    console.log(`Starting sync for sources: ${sources.join(', ')}`);

    for (const sourceHandle of sources) {
      const syncResult: SyncResult = {
        source: sourceHandle,
        status: 'success',
        tweetsFound: 0,
        tweetsNew: 0,
        message: '',
        processedIds: [],
      };

      try {
        // 1. Scrape latest tweets
        const tweets = await twitterScraper.getRecentTweets(sourceHandle, 10);
        syncResult.tweetsFound = tweets.length;

        if (tweets.length === 0) {
          syncResult.message = 'No tweets found or profile has no recent public tweets';
          results.push(syncResult);
          continue;
        }

        // Process the freshest 6 tweets in chronological order so Gemini translation is fast and avoids timeouts
        const sortedTweets = [...tweets].slice(0, 6).reverse();

        for (const tweet of sortedTweets) {
          // Check D1 for duplicate
          const existing = await env.DB.prepare(
            'SELECT id FROM posts WHERE tweet_id = ?'
          )
            .bind(tweet.id)
            .first();

          if (existing) {
            // Already processed and saved
            continue;
          }

          console.log(`New tweet found for @${sourceHandle}: ${tweet.id}`);

          // 2. Translate with Gemini AI
          let mizoText = '';
          if (env.GEMINI_API_KEY) {
            try {
              mizoText = await geminiTranslator.translateToMizo(
                tweet.text,
                tweet.authorName,
                env.GEMINI_API_KEY
              );
            } catch (transErr: any) {
              console.error(`Gemini translation error for ${tweet.id}:`, transErr.message);
              // Fallback to original text if translation fails
              mizoText = tweet.text;
            }
          } else {
            // If no Gemini API key set yet, use original text as placeholder
            mizoText = tweet.text;
          }

          // 3. Save to Cloudflare D1 with facebook_status = 'none' (awaiting curation / editorial choice)
          await env.DB.prepare(
            `INSERT INTO posts (
              tweet_id, author_handle, author_name, author_avatar,
              original_text, mizo_translation, primary_image_url,
              media_urls, tweet_url, tweet_created_at, facebook_post_id,
              facebook_status, error_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'none', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
            .bind(
              tweet.id,
              tweet.authorHandle,
              tweet.authorName,
              tweet.authorAvatar,
              tweet.text,
              mizoText,
              tweet.primaryImageUrl || null,
              JSON.stringify(tweet.photos),
              tweet.tweetUrl,
              tweet.createdAt
            )
            .run();

          syncResult.tweetsNew++;
          syncResult.processedIds.push(tweet.id);
        }

        syncResult.message = `Sync completed: ${syncResult.tweetsNew} new tweet(s) recorded out of ${tweets.length} examined`;
      } catch (err: any) {
        console.error(`Sync error for @${sourceHandle}:`, err.message);
        syncResult.status = 'error';
        syncResult.message = err.message;
      }

      // Record to sync_logs table in D1
      try {
        await env.DB.prepare(
          `INSERT INTO sync_logs (source_handle, status, message, tweets_found, tweets_new)
           VALUES (?, ?, ?, ?, ?)`
        )
          .bind(
            sourceHandle,
            syncResult.status,
            syncResult.message,
            syncResult.tweetsFound,
            syncResult.tweetsNew
          )
          .run();
      } catch (logErr: any) {
        console.warn('Could not insert into sync_logs:', logErr.message);
      }

      results.push(syncResult);
    }

    // 4. Process the next queued item for Facebook (Drip scheduler: 1 post per cron cycle, spaced every 15-20 mins)
    try {
      if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
        const nextQueued = await env.DB.prepare(
          "SELECT * FROM posts WHERE facebook_status = 'queued' ORDER BY id ASC LIMIT 1"
        ).first<any>();

        if (nextQueued) {
          console.log(`[FB Queue Drip] Auto-publishing queued post #${nextQueued.id} to Facebook...`);
          const fbRes = await facebookPoster.postNews(
            nextQueued.mizo_translation,
            nextQueued.primary_image_url,
            env.FB_PAGE_ID,
            env.FB_PAGE_ACCESS_TOKEN
          );

          if (fbRes.success) {
            await env.DB.prepare(
              "UPDATE posts SET facebook_status = 'published', facebook_post_id = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(fbRes.postId, nextQueued.id).run();
            console.log(`[FB Queue Drip] Post #${nextQueued.id} successfully published to Facebook.`);
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
