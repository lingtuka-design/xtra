# ⚡ Xtra — Breaking Football News in Mizo

Automated Premier League Tier-1 breaking football news scraper, Gemini AI Mizo translator, and Facebook Page auto-poster deployed on **Cloudflare Pages & D1** (100% Free ₹0/mo Stack).

---

## 🌟 Core Features

1. **Twitter/X Scraping (Zero Cost / No Paid API)**:
   - Starts with Tier-1 Premier League authority **`@David_Ornstein`** (The Athletic).
   - Modular `SOURCES = ['David_Ornstein']` array for adding Fabrizio Romano, B/R Football, etc.
   - Extracts tweet text, tweet ID, and Original HD Photos (`pbs.twimg.com/...orig`).
   - 0% duplicate posts guaranteed via Cloudflare D1 `tweet_id` unique constraint.

2. **Gemini AI Translation (Google AI Studio Free Tier)**:
   - Uses `gemini-2.0-flash` / `gemini-1.5-flash` to translate breaking news into engaging, natural, punchy Mizo.
   - Formats with football emojis (🚨, ⚽, 📝, 🤝).

3. **Facebook Page Auto-Poster (Meta Graph API)**:
   - Posts directly to Facebook Page with full-size HD Photo + Mizo Caption (`POST /{page-id}/photos`).
   - **Crucial Reach Protection**: 0 external links inside captions to prevent Facebook organic algorithm penalties. Pure native photo post.

4. **Landing Page Website (`xtra.pages.dev`)**:
   - Clean, minimal dark-mode feed inspired by X/Twitter.
   - Chronological list of translated news cards with source badges, relative timestamps, and expandable original English tweets.
   - Full-resolution photo lightbox modal.
   - Live search and source filter.
   - "Sync Now" button to trigger scraper and test manually anytime.

5. **Cloudflare Cron Trigger (Scheduled Worker)**:
   - Runs automatically every 15 minutes (`*/15 * * * *`) in Cloudflare's serverless edge.

---

## 🚀 Quick Setup & Deployment

### 1. Install Dependencies
```bash
bun install
# or: npm install
```

### 2. Create Cloudflare D1 Database
```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create xtra-db
```
Copy the generated `database_id` and paste it into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "xtra-db"
database_id = "your-actual-database-id-here"
```

### 3. Initialize D1 Tables (Schema Migration)
```bash
# Local testing:
bun run d1:migrate:local

# Production Cloudflare D1:
bun run d1:migrate:prod
```

### 4. Configure Secrets
Set the following secrets in Cloudflare Dashboard (Pages > Settings > Environment Variables) or via CLI:
```bash
# 1. Google Gemini AI Key (Free from https://aistudio.google.com/)
npx wrangler secret put GEMINI_API_KEY

# 2. Facebook Page Credentials (Meta Graph API)
npx wrangler secret put FB_PAGE_ID
npx wrangler secret put FB_PAGE_ACCESS_TOKEN

# 3. Optional Cron Secret (protects /api/sync)
npx wrangler secret put CRON_SECRET
```

### 5. Local Development
```bash
# Run local Vite frontend:
bun run dev

# Run full Cloudflare Pages Functions + D1 locally:
bun run pages:dev
```

### 6. Deploy to Cloudflare Pages (`xtra.pages.dev`)
```bash
bun run deploy
```

---

## 📁 Project Architecture

```
xtra/
├── functions/                     # Cloudflare Pages Functions (API Backend)
│   ├── api/
│   │   ├── posts.ts               # GET: Fetch feed posts with search & pagination
│   │   ├── sync.ts                # GET/POST: Trigger scraper & translation sync
│   │   ├── sources.ts             # GET/POST: Manage active journalist sources
│   │   └── stats.ts               # GET: Stats & execution logs
│   ├── services/
│   │   ├── twitterScraper.ts      # Unauthenticated Twitter GraphQL & HD photo extractor
│   │   ├── geminiTranslator.ts    # Google AI Studio Gemini Mizo translator
│   │   ├── facebookPoster.ts      # Meta Graph API native photo poster
│   │   └── syncService.ts         # Master orchestrator & duplicate prevention
│   └── types.ts                   # TypeScript interfaces
├── src/                           # Vite + React 19 Frontend
│   ├── components/
│   │   ├── Header.tsx             # Brand header with sync trigger & status
│   │   ├── PostCard.tsx           # Feed card (Mizo text, HD photo, tweet toggle)
│   │   ├── Sidebar.tsx            # Desktop info sidebar & source monitor
│   │   ├── ImageModal.tsx         # Full-screen image lightbox
│   │   └── SyncModal.tsx          # Manual scraper runner & live logs
│   ├── App.tsx                    # Main layout, search & filters
│   ├── mockData.tsx               # Preview data
│   └── index.css                  # Tailwind CSS styling
├── worker/
│   └── scheduled.ts               # Cloudflare Scheduled Worker (Cron trigger)
├── schema.sql                     # D1 SQLite schema & seed data
├── wrangler.toml                  # Cloudflare Pages & D1 configuration
└── package.json                   # Scripts & dependencies
```

---

## ➕ Adding More Sources (Modular Configuration)

To add more journalists like Fabrizio Romano:
1. In `functions/services/syncService.ts`, or via the web UI / D1 database:
   ```sql
   INSERT INTO sources (id, name, avatar_url, bio, enabled)
   VALUES (
     'FabrizioRomano',
     'Fabrizio Romano',
     'https://pbs.twimg.com/...',
     'Here We Go. Football transfer journalist.',
     1
   );
   ```
2. The scraper will automatically include `@FabrizioRomano` on the next sync run!
