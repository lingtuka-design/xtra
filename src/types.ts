export interface Post {
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
  facebook_status: 'none' | 'queued' | 'published' | 'failed' | 'skipped' | 'pending';
  publish_source?: 'queue' | 'direct';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  totalPosts: number;
  facebookPublished: number;
  activeSources: number;
}

export interface SyncLog {
  id: number;
  source_handle: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  tweets_found: number;
  tweets_new: number;
  created_at: string;
}
