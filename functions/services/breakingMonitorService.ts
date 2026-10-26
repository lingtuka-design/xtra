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
  private parseRss(xml: string): RssItem[] {
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
      const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

      if (title) {
        items.push({ title, link, pubDate, source });
      }
    }
    return items;
  }

  private async fetchRss(url: string): Promise<RssItem[]> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return this.parseRss(xml);
    } catch {
      return [];
    }
  }

  public async checkBreakingNews(env: Env): Promise<{ checked: string[]; posted: string[] }> {
    const results = { checked: [] as string[], posted: [] as string[] };

    // --- 1. MICHAEL CARRICK SACKING MONITOR ---
    try {
      const carrickItems = await this.fetchRss(
        'https://news.google.com/rss/search?q=Michael+Carrick+Manchester+United+sacked+when:1d&hl=en-IN&gl=IN&ceid=IN:en'
      );
      results.checked.push(`carrick_items_${carrickItems.length}`);

      for (const item of carrickItems) {
        const title = item.title;
        // Strictly check if title confirms sacking (NOT hypothetical or future speculation)
        const isSacked = /(sacked|dismissed|relieved of his duties|leaves Manchester United|parted company|parted ways)/i.test(
          title
        );
        const isSpeculation = /\b(if|could|may|might|expect|expected to be|urged|option|candidate|target|should|favourite|odds|future|discussed)\b/i.test(
          title
        );

        if (isSacked && !isSpeculation) {
          // Check if already posted
          const existing = await env.DB.prepare(
            "SELECT id FROM posts WHERE tweet_id = 'breaking_carrick_sacked'"
          ).first();

          if (!existing) {
            console.log(`[Cloud Breaking Monitor] Carrick sacking confirmed: "${title}". Publishing...`);
            const mizoCaption = await geminiTranslator.generateBreakingPost(
              title,
              'Michael Carrick sacked by Manchester United',
              env.GEMINI_API_KEY,
              env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_FALLBACK
            );

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

            // Record in D1
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
      const ballonItems = await this.fetchRss(
        'https://news.google.com/rss/search?q=Ballon+d%27Or+2026+winner+OR+crowned+OR+announced+when:1d&hl=en-IN&gl=IN&ceid=IN:en'
      );
      results.checked.push(`ballon_items_${ballonItems.length}`);

      const awardsConfig = [
        {
          key: 'ballon_2026_kopa',
          name: 'Kopa Trophy (Best U-21 Player)',
          match: /Kopa Trophy.*(winner|won by|wins|awarded|crowned)|(wins|awarded|claims|crowned).*Kopa Trophy/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview)/i,
        },
        {
          key: 'ballon_2026_yashin',
          name: 'Yashin Trophy (Best Goalkeeper)',
          match: /Yashin Trophy.*(winner|won by|wins|awarded|crowned)|(wins|awarded|claims|crowned).*Yashin Trophy/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview)/i,
        },
        {
          key: 'ballon_2026_muller',
          name: 'Gerd Müller Trophy (Top Scorer)',
          match: /(Gerd M[uü]ller|Muller Trophy).*(winner|won by|wins|awarded)|(wins|awarded).*Gerd M[uü]ller/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview)/i,
        },
        {
          key: 'ballon_2026_coach',
          name: "Men's Coach of the Year",
          match: /(Men's )?Coach of the Year.*(Ballon|winner|won by|wins)|(wins|named).*(Men's )?Coach of the Year/i,
          reject: /(nominee|shortlist|favourite|prediction|how to watch|preview)/i,
        },
        {
          key: 'ballon_2026_women',
          name: "Women's Ballon d'Or Winner",
          match: /(Women's Ballon d'Or|Ballon d'Or F[eé]minin).*(winner|wins|won by|crowned)|(wins|claims|crowned).*(Women's Ballon d'Or|Ballon d'Or F[eé]minin)/i,
          reject: /(nominee|shortlist|favourite|prediction|who will win|how to watch|preview)/i,
        },
        {
          key: 'ballon_2026_men',
          name: "Men's Ballon d'Or Winner (The Golden Ball)",
          match: /(wins|crowned|named|claims|awarded).*(Men's )?Ballon d'Or|(Men's )?Ballon d'Or.*(winner|won by)/i,
          reject: /(when|how to watch|nominees|power ranking|predictions|shortlist|favourite|schedule|odds|who will win|preview)/i,
        },
      ];

      for (const award of awardsConfig) {
        // Check if already posted in D1
        const existing = await env.DB.prepare('SELECT id FROM posts WHERE tweet_id = ?')
          .bind(award.key)
          .first();

        if (existing) {
          continue; // Already posted, skip
        }

        // Look for matching confirmed article
        const matchedItem = ballonItems.find(
          (item) => award.match.test(item.title) && !award.reject.test(item.title)
        );

        if (matchedItem) {
          console.log(
            `[Cloud Breaking Monitor] Found Ballon d'Or award "${award.name}": "${matchedItem.title}". Publishing...`
          );

          const mizoCaption = await geminiTranslator.generateBreakingPost(
            matchedItem.title,
            award.name,
            env.GEMINI_API_KEY,
            env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_FALLBACK
          );

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

          // Insert into D1
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
