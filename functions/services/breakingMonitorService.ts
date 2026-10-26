import { Env } from '../types';
import { geminiTranslator } from './geminiTranslator';
import { facebookPoster } from './facebookPoster';
import { whatsappPoster } from './whatsappPoster';
import { telegramPoster } from './telegramPoster';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export class BreakingMonitorService {
  private parseRss(xml: string, defaultSource: string): RssItem[] {
    const items: RssItem[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const m of itemMatches) {
      const itemBlock = m[1];
      const titleMatch = itemBlock.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemBlock.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : defaultSource;

      if (title) {
        items.push({ title, link, pubDate, source });
      }
    }
    return items;
  }

  private async fetchRss(url: string, defaultSource: string): Promise<RssItem[]> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return this.parseRss(xml, defaultSource);
    } catch {
      return [];
    }
  }

  public async checkBreakingNews(env: Env): Promise<{ checked: string[]; posted: string[] }> {
    const results = { checked: [] as string[], posted: [] as string[] };

    // Fetch official trusted sports RSS feeds directly in the cloud (BBC & Sky Sports)
    const [bbcItems, skyItems] = await Promise.all([
      this.fetchRss('https://feeds.bbci.co.uk/sport/football/rss.xml', 'BBC Sport'),
      this.fetchRss('https://www.skysports.com/rss/12040', 'Sky Sports'),
    ]);

    const allItems = [...bbcItems, ...skyItems];
    results.checked.push(`bbc_items_${bbcItems.length}`, `sky_items_${skyItems.length}`);

    // --- 1. MICHAEL CARRICK SACKING CHECK ---
    try {
      for (const item of allItems) {
        const title = item.title;
        const isSacked = /(Michael Carrick|Carrick).*(sacked|dismissed|relieved of his duties|leaves Man Utd|part company|parted ways)/i.test(
          title
        );
        const isSpeculation = /\b(if|could|may|might|expect|expected to be|urged|option|candidate|target|should|favourite|odds|future|discussed)\b/i.test(
          title
        );

        if (isSacked && !isSpeculation) {
          const existing = await env.DB.prepare(
            "SELECT id FROM posts WHERE tweet_id = 'breaking_carrick_sacked'"
          ).first();

          if (!existing) {
            console.log(`[Cloud Breaking Monitor] Carrick sacked confirmed by ${item.source}: "${title}". Publishing...`);

            // Generate Mizo caption (Gemini or fallback template)
            let mizoCaption = `🚨 BREAKING: Manchester United chuan an head coach Michael Carrick an ban ta!

${item.source} tarlan danin, chet chhiat zawn em avangin United hierarchy chuan Michael Carrick hi an head coach hna aṭangin an chawlhtir ta a ni.

#Inkhelxtra #ManUtd #MichaelCarrick #MUFC #Breaking`;

            try {
              const geminiRes = await geminiTranslator.generateBreakingPost(
                title,
                'Michael Carrick sacked by Manchester United',
                env.GEMINI_API_KEY,
                env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_FALLBACK
              );
              if (geminiRes && geminiRes !== title && geminiRes.length > 30) {
                mizoCaption = geminiRes;
              }
            } catch {}

            const imageUrl =
              'https://images2.minutemediacdn.com/image/upload/c_crop,w_4500,h_2531,x_0,y_468/c_fill,w_1080,ar_16:9,f_auto,q_auto,g_auto/images%2FGettyImages%2Fmmsport%2F90min_en_international_web%2F01jc4b9p3770e70k38e4.jpg';

            let fbPostId: string | undefined;
            if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
              const fbRes = await facebookPoster.postNews(
                mizoCaption,
                imageUrl,
                env.FB_PAGE_ID,
                env.FB_PAGE_ACCESS_TOKEN
              );
              if (fbRes.success) fbPostId = fbRes.postId;
            }

            if (env.WHATSAPP_API_TOKEN && env.WHATSAPP_CHANNEL_ID) {
              await whatsappPoster.postNews(
                mizoCaption,
                imageUrl,
                env.WHATSAPP_API_TOKEN,
                env.WHATSAPP_CHANNEL_ID,
                env.WHATSAPP_API_URL
              );
            }

            if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID) {
              await telegramPoster.postNews(
                mizoCaption,
                imageUrl,
                env.TELEGRAM_BOT_TOKEN,
                env.TELEGRAM_CHANNEL_ID
              );
            }

            await env.DB.prepare(
              `INSERT INTO posts (
                tweet_id, author_handle, author_name, author_avatar,
                original_text, mizo_translation, primary_image_url,
                media_urls, tweet_url, tweet_created_at, facebook_post_id,
                facebook_status, publish_source, error_message, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'published', 'direct', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
            )
              .bind(
                'breaking_carrick_sacked',
                'ManUtd',
                'Manchester United',
                'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
                title,
                mizoCaption,
                imageUrl,
                JSON.stringify([{ url: imageUrl, hd_url: imageUrl, type: 'photo' }]),
                item.link || 'https://www.facebook.com/inkhel.Xtra',
                fbPostId || null
              )
              .run();

            results.posted.push('Carrick Sacked');
            break;
          }
        }
      }
    } catch (carrickErr: any) {
      console.warn('[Cloud Breaking Monitor] Carrick check error:', carrickErr.message);
    }

    // --- 2. BALLON D'OR 2026 MONITOR ---
    try {
      const awardsConfig = [
        {
          key: 'ballon_2026_kopa',
          name: 'Kopa Trophy (Best U-21 Player)',
          match: /Kopa.*(wins|winner|won|awarded|crowned)/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview|power ranking)/i,
          fallbackEmoji: '⭐',
          fallbackTitle: "Kopa Trophy (U-21 player ṭha ber chawimawina)",
        },
        {
          key: 'ballon_2026_yashin',
          name: 'Yashin Trophy (Best Goalkeeper)',
          match: /Yashin.*(wins|winner|won|awarded|crowned)/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview|power ranking)/i,
          fallbackEmoji: '🧤',
          fallbackTitle: "Yashin Trophy (Goalkeeper ṭha ber chawimawina)",
        },
        {
          key: 'ballon_2026_muller',
          name: 'Gerd Müller Trophy (Top Scorer)',
          match: /(Gerd M[uü]ller|Muller).*Trophy.*(wins|winner|won|awarded)|(wins|awarded).*Gerd M[uü]ller/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview)/i,
          fallbackEmoji: '⚽',
          fallbackTitle: "Gerd Müller Trophy (Scorer sang ber chawimawina)",
        },
        {
          key: 'ballon_2026_coach',
          name: "Men's Coach of the Year",
          match: /(Men's )?Coach of the Year.*(wins|winner|won|named)|(wins|named).*(Men's )?Coach of the Year/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview)/i,
          fallbackEmoji: '👔',
          fallbackTitle: "Coach of the Year (Coach ṭha ber chawimawina)",
        },
        {
          key: 'ballon_2026_women',
          name: "Women's Ballon d'Or Winner",
          match: /(Women's Ballon d'Or|Ballon d'Or F[eé]minin).*(winner|wins|won by|crowned)|(wins|claims|crowned).*(Women's Ballon d'Or|Ballon d'Or F[eé]minin)/i,
          reject: /(nominee|shortlist|favourite|prediction|who will win|how to watch|preview)/i,
          fallbackEmoji: '🏆',
          fallbackTitle: "Women's Ballon d'Or (Hmeichhe player ṭha ber)",
        },
        {
          key: 'ballon_2026_men',
          name: "Men's Ballon d'Or Winner (The Golden Ball)",
          match: /(wins|crowned|named|claims|awarded).*(Men's )?Ballon d'Or|(Men's )?Ballon d'Or.*(winner|won by)/i,
          reject: /(when|how to watch|nominees|power ranking|predictions|shortlist|favourite|schedule|odds|who will win|preview)/i,
          fallbackEmoji: '🏆',
          fallbackTitle: "2026 Men's Ballon d'Or Winner",
        },
      ];

      for (const award of awardsConfig) {
        const existing = await env.DB.prepare('SELECT id FROM posts WHERE tweet_id = ?')
          .bind(award.key)
          .first();

        if (existing) continue;

        const matchedItem = allItems.find(
          (item) => award.match.test(item.title) && !award.reject.test(item.title)
        );

        if (matchedItem) {
          console.log(`[Cloud Breaking Monitor] Found award "${award.name}": "${matchedItem.title}". Publishing...`);

          let mizoCaption = `${award.fallbackEmoji} BALLON D'OR 2026: ${award.fallbackTitle}

London Palladium Theatre-ah kum 2026 Ballon d'Or ceremony neih mekah, ${matchedItem.title} tiin official-in puan a ni ta!

#Inkhelxtra #BallondOr #BallondOr2026`;

          try {
            const geminiRes = await geminiTranslator.generateBreakingPost(
              matchedItem.title,
              award.name,
              env.GEMINI_API_KEY,
              env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_FALLBACK
            );
            if (geminiRes && geminiRes !== matchedItem.title && geminiRes.length > 30) {
              mizoCaption = geminiRes;
            }
          } catch {}

          const imageUrl =
            'https://editorial.uefa.com/resources/0292-1c255d6778f6-500b9231f82d-1000/ballon_d_or_trophy.jpeg';

          let fbPostId: string | undefined;
          if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
            const fbRes = await facebookPoster.postNews(
              mizoCaption,
              imageUrl,
              env.FB_PAGE_ID,
              env.FB_PAGE_ACCESS_TOKEN
            );
            if (fbRes.success) fbPostId = fbRes.postId;
          }

          if (env.WHATSAPP_API_TOKEN && env.WHATSAPP_CHANNEL_ID) {
            await whatsappPoster.postNews(
              mizoCaption,
              imageUrl,
              env.WHATSAPP_API_TOKEN,
              env.WHATSAPP_CHANNEL_ID,
              env.WHATSAPP_API_URL
            );
          }

          if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID) {
            await telegramPoster.postNews(
              mizoCaption,
              imageUrl,
              env.TELEGRAM_BOT_TOKEN,
              env.TELEGRAM_CHANNEL_ID
            );
          }

          await env.DB.prepare(
            `INSERT INTO posts (
              tweet_id, author_handle, author_name, author_avatar,
              original_text, mizo_translation, primary_image_url,
              media_urls, tweet_url, tweet_created_at, facebook_post_id,
              facebook_status, publish_source, error_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'published', 'direct', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
            .bind(
              award.key,
              'ballondor',
              "Ballon d'Or Official",
              'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
              matchedItem.title,
              mizoCaption,
              imageUrl,
              JSON.stringify([{ url: imageUrl, hd_url: imageUrl, type: 'photo' }]),
              matchedItem.link || 'https://www.facebook.com/inkhel.Xtra',
              fbPostId || null
            )
            .run();

          results.posted.push(award.name);
        }
      }
    } catch (ballonErr: any) {
      console.warn('[Cloud Breaking Monitor] Ballon check error:', ballonErr.message);
    }

    return results;
  }
}

export const breakingMonitorService = new BreakingMonitorService();
