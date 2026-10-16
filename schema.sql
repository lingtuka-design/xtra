-- Cloudflare D1 Database Schema for Xtra

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,               -- e.g. 'David_Ornstein'
  name TEXT NOT NULL,                -- e.g. 'David Ornstein'
  avatar_url TEXT,
  bio TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tweet_id TEXT UNIQUE NOT NULL,      -- Crucial: 0% duplicate guarantee
  author_handle TEXT NOT NULL,       -- e.g. 'David_Ornstein'
  author_name TEXT NOT NULL,         -- e.g. 'David Ornstein'
  author_avatar TEXT,
  original_text TEXT NOT NULL,
  mizo_translation TEXT NOT NULL,
  primary_image_url TEXT,            -- High resolution original photo (pbs.twimg.com)
  media_urls TEXT,                   -- JSON string of all photos/media
  tweet_url TEXT NOT NULL,
  tweet_created_at TEXT,
  facebook_post_id TEXT,             -- Meta Graph API photo post ID
  facebook_status TEXT DEFAULT 'pending', -- 'published', 'failed', 'skipped'
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_handle TEXT NOT NULL,
  status TEXT NOT NULL,              -- 'success', 'warning', 'error'
  message TEXT NOT NULL,
  tweets_found INTEGER DEFAULT 0,
  tweets_new INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_posts_tweet_id ON posts (tweet_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_handle);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_fb_status ON posts (facebook_status);

-- Seed initial Tier-1 source: David Ornstein
INSERT OR IGNORE INTO sources (id, name, avatar_url, bio, enabled)
VALUES (
  'David_Ornstein',
  'David Ornstein',
  'https://pbs.twimg.com/profile_images/1178558529105530880/Qvy-hv3O_400x400.jpg',
  'Football Correspondent, The Athletic FC. Premier League Tier-1 Breaking News.',
  1
);
