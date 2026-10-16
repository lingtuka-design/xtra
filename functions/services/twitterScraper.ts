import { ScrapedTweet, TweetPhoto } from '../types';

const TWITTER_BEARER =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

// Known working GraphQL Query IDs for X/Twitter web client
const USER_QUERY_ID = 'sLVLhk0bGj3MVFEKTdax1w';
const TWEETS_QUERY_ID = 'VgitpdpNZ-RUIp5D1Z_D-A';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export class TwitterScraper {
  private guestToken: string | null = null;
  private guestTokenExpiry: number = 0;

  /**
   * Acquire or refresh an unauthenticated guest token from Twitter API
   */
  private async getGuestToken(): Promise<string> {
    const now = Date.now();
    if (this.guestToken && now < this.guestTokenExpiry) {
      return this.guestToken;
    }

    try {
      const res = await fetch('https://api.twitter.com/1.1/guest/activate.json', {
        method: 'POST',
        headers: {
          Authorization: TWITTER_BEARER,
          'User-Agent': USER_AGENT,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to activate guest token: HTTP ${res.status}`);
      }

      const data = (await res.json()) as { guest_token?: string };
      if (!data.guest_token) {
        throw new Error('Twitter response did not contain guest_token');
      }

      this.guestToken = data.guest_token;
      // Expire token after 2.5 hours (Twitter tokens normally last ~3h)
      this.guestTokenExpiry = now + 2.5 * 60 * 60 * 1000;
      return this.guestToken;
    } catch (err: any) {
      console.error('Error fetching Twitter guest token:', err.message);
      throw err;
    }
  }

  /**
   * Resolve a screen name (e.g. 'David_Ornstein') to user rest_id and profile data
   */
  private async getUserByScreenName(screenName: string, guestToken: string) {
    const variables = JSON.stringify({
      screen_name: screenName,
      withSafetyModeUserFields: true,
    });

    const features = JSON.stringify({
      hidden_profile_likes_enabled: false,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
    });

    const url = `https://twitter.com/i/api/graphql/${USER_QUERY_ID}/UserByScreenName?variables=${encodeURIComponent(
      variables
    )}&features=${encodeURIComponent(features)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: TWITTER_BEARER,
        'x-guest-token': guestToken,
        'User-Agent': USER_AGENT,
      },
    });

    if (!res.ok) {
      throw new Error(`UserByScreenName failed for @${screenName}: HTTP ${res.status}`);
    }

    const json = (await res.json()) as any;
    const userResult = json?.data?.user?.result;
    if (!userResult) {
      throw new Error(`User @${screenName} not found on Twitter`);
    }

    const restId = userResult.rest_id || userResult.id;
    const legacy = userResult.legacy || {};
    const name = legacy.name || screenName;
    const avatarUrl =
      legacy.profile_image_url_https?.replace('_normal.', '_400x400.') ||
      userResult.avatar_url;

    return { restId, name, avatarUrl };
  }

  /**
   * Scrape recent tweets from a user
   */
  public async getRecentTweets(screenName: string, count = 10): Promise<ScrapedTweet[]> {
    const guestToken = await this.getGuestToken();
    const user = await this.getUserByScreenName(screenName, guestToken);

    const variables = JSON.stringify({
      userId: user.restId,
      count,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: false,
      withVoice: false,
      withV2Timeline: true,
    });

    const features = JSON.stringify({
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: false,
      tweet_awards_web_tipping_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_media_download_video_enabled: false,
      responsive_web_enhance_cards_enabled: true,
    });

    const url = `https://twitter.com/i/api/graphql/${TWEETS_QUERY_ID}/UserTweets?variables=${encodeURIComponent(
      variables
    )}&features=${encodeURIComponent(features)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: TWITTER_BEARER,
        'x-guest-token': guestToken,
        'User-Agent': USER_AGENT,
      },
    });

    if (!res.ok) {
      throw new Error(`UserTweets request failed: HTTP ${res.status}`);
    }

    const json = (await res.json()) as any;
    const instructions =
      json?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];

    const tweets: ScrapedTweet[] = [];

    for (const inst of instructions) {
      if (inst.type === 'TimelineAddEntries') {
        for (const entry of inst.entries || []) {
          const itemContent = entry.content?.itemContent;
          if (itemContent?.itemType === 'TimelineTweet') {
            const tweetResult = itemContent.tweet_results?.result;
            const legacy = tweetResult?.legacy || tweetResult?.tweet?.legacy;
            if (!legacy) continue;

            const tweetId = legacy.id_str;
            let fullText = legacy.full_text || '';
            const createdAt = legacy.created_at || '';
            const tweetUrl = `https://x.com/${screenName}/status/${tweetId}`;

            // Check if this is a retweet; we usually want original journalism
            if (legacy.retweeted_status_result) {
              continue;
            }

            const photos: TweetPhoto[] = [];

            // 1. Direct attached media (photos)
            const mediaList =
              legacy.extended_entities?.media || legacy.entities?.media || [];
            for (const m of mediaList) {
              if (m.type === 'photo' && m.media_url_https) {
                photos.push({
                  url: m.media_url_https,
                  hd_url: `${m.media_url_https}?name=orig`,
                  type: 'photo',
                  width: m.sizes?.large?.w,
                  height: m.sizes?.large?.h,
                });
              }
            }

            // 2. Attached Article card preview image (very common for David Ornstein / Athletic articles)
            if (photos.length === 0 && tweetResult?.card) {
              const bindingValues = tweetResult.card.legacy?.binding_values || [];
              const imgBinding = bindingValues.find(
                (v: any) =>
                  v.key === 'photo_image_full_size_large' ||
                  v.key === 'photo_image_full_size_original' ||
                  v.key === 'summary_photo_image_large' ||
                  v.key === 'thumbnail_image_large' ||
                  v.key === 'thumbnail_image'
              );

              const cardImgUrl = imgBinding?.value?.image_value?.url;
              if (cardImgUrl) {
                // Ensure highest resolution
                const hdUrl = cardImgUrl.includes('name=')
                  ? cardImgUrl.replace(/name=[a-zA-Z0-9_x]+/, 'name=orig')
                  : `${cardImgUrl}&name=orig`;

                photos.push({
                  url: cardImgUrl,
                  hd_url: hdUrl,
                  type: 'card_image',
                  width: imgBinding.value.image_value.width,
                  height: imgBinding.value.image_value.height,
                });
              }
            }

            // Check if tweet contains external website URLs or links (per user requirement: do not scrape tweets with links/websites)
            const hasExternalEntitiesUrl =
              Array.isArray(legacy.entities?.urls) && legacy.entities.urls.length > 0;

            // Clean up trailing photo link from text (e.g. https://t.co/...)
            const cleanedText = fullText
              .replace(/https:\/\/t\.co\/[a-zA-Z0-9]+$/g, '')
              .trim();

            const hasWebsiteLink =
              /https?:\/\/|www\.|\bt\.co\/|\bbit\.ly\/|\.(com|co\.uk|org|net|io|app|me)\//i.test(
                cleanedText
              );

            if (hasExternalEntitiesUrl || hasWebsiteLink) {
              // Skip tweets linking to external articles or websites
              continue;
            }

            tweets.push({
              id: tweetId,
              authorHandle: screenName,
              authorName: user.name,
              authorAvatar: user.avatarUrl,
              text: cleanedText || fullText,
              createdAt,
              tweetUrl,
              photos,
              primaryImageUrl: photos[0]?.hd_url || photos[0]?.url,
            });
          }
        }
      }
    }

    return tweets;
  }
}

export const twitterScraper = new TwitterScraper();
