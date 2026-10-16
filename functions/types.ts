export interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_API_KEY_FALLBACK?: string;
  FB_PAGE_ACCESS_TOKEN?: string;
  FB_PAGE_ID?: string;
  CRON_SECRET?: string;
  DEFAULT_SOURCES?: string;
  WHATSAPP_API_TOKEN?: string;
  WHATSAPP_CHANNEL_ID?: string;
  WHATSAPP_API_URL?: string;
}

export interface TweetPhoto {
  url: string;
  hd_url: string;
  type: string;
  width?: number;
  height?: number;
}

export interface ScrapedTweet {
  id: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  tweetUrl: string;
  photos: TweetPhoto[];
  primaryImageUrl?: string;
}

export interface PostRecord {
  id: number;
  tweet_id: string;
  author_handle: string;
  author_name: string;
  author_avatar?: string;
  original_text: string;
  mizo_translation: string;
  primary_image_url?: string;
  media_urls?: string;
  tweet_url: string;
  tweet_created_at?: string;
  facebook_post_id?: string;
  facebook_status: 'published' | 'failed' | 'skipped' | 'pending';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  source: string;
  status: 'success' | 'warning' | 'error';
  tweetsFound: number;
  tweetsNew: number;
  message: string;
  processedIds: string[];
}
