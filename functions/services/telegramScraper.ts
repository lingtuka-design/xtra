import { ScrapedTweet, TweetPhoto } from '../types';

export class TelegramScraper {
  /**
   * Scrape messages from a public Telegram channel web preview (https://t.me/s/<channel>)
   */
  public async getRecentPosts(
    channelUsername: string,
    limit: number = 20
  ): Promise<ScrapedTweet[]> {
    const cleanChannel = channelUsername
      .replace(/^@/, '')
      .replace(/^https?:\/\/t\.me\/(s\/)?/, '')
      .trim();

    const url = `https://t.me/s/${cleanChannel}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Telegram request failed: HTTP ${res.status}`);
    }

    const html = await res.text();
    const parts = html.split('<div class="tgme_widget_message_wrap');
    const posts: ScrapedTweet[] = [];

    // Extract channel title / avatar
    const titleMatch = html.match(
      /<div class="tgme_channel_info_header_title"[^>]*>([\s\S]*?)<\/div>/
    );
    const channelName = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
      : cleanChannel;

    const avatarMatch = html.match(
      /<img class="tgme_page_photo_image" src="([^"]+)"/
    );
    const channelAvatar = avatarMatch ? avatarMatch[1] : undefined;

    for (let i = 1; i < parts.length; i++) {
      const chunk = parts[i];
      const postAttr = chunk.match(/data-post="([^"]+)"/);
      const textMatch = chunk.match(
        /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/
      );
      const photoMatch = chunk.match(/background-image:url\('([^']+)'\)/);
      const timeMatch = chunk.match(/<time datetime="([^"]+)"/);

      if (!postAttr || !textMatch) continue;

      const rawText = textMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, '')
        .trim();

      // Sanitize text by stripping URLs so translation contains no links
      const cleanedText = rawText
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\b(www\.\S+|t\.me\/\S+|bit\.ly\/\S+)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Skip spam, betting, crypto or trivial length posts
      if (
        cleanedText.length < 20 ||
        /\b(bet|betting|fixed match|crypto|bitcoin|usdt|airdrop|casino)\b/i.test(
          cleanedText
        )
      ) {
        continue;
      }

      const photoUrl = photoMatch ? photoMatch[1] : null;
      const photos: TweetPhoto[] = [];

      // Only accept real CDN photos, skip telegram emoji/stickers
      if (
        photoUrl &&
        photoUrl.startsWith('https://') &&
        !photoUrl.includes('/emoji/')
      ) {
        photos.push({
          url: photoUrl,
          hd_url: photoUrl,
          type: 'photo',
        });
      }

      const postId = `tg_${postAttr[1].replace('/', '_')}`;
      const postUrl = `https://t.me/${postAttr[1]}`;
      const createdAt = timeMatch ? timeMatch[1] : new Date().toISOString();

      posts.push({
        id: postId,
        authorHandle: cleanChannel,
        authorName: channelName,
        authorAvatar: channelAvatar || '',
        text: cleanedText,
        createdAt,
        tweetUrl: postUrl,
        photos,
        primaryImageUrl: photos[0]?.url,
      });
    }

    return posts.slice(-limit);
  }
}

export const telegramScraper = new TelegramScraper();
