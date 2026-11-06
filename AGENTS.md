# Xtra Project Guidelines & Design Standards

## Match Graphics & Card Generator Specifications (`functions/api/live/card.ts`)

### 1. Match Scorecard Graphics (`status=HT` or `status=FT`)
- **Background**: Diagonal dark-art base template (`MATCH_CARD_BG_FB` / `MATCH_CARD_BG_WA`). Central white polygon must remain 100% pure solid `#FFFFFF` with 0 ghost text, 0 crest remnants, and 0 smudges.
- **League Title**:
  - Always uppercase, italic bold.
  - Important: For Indian Super League matches, **ALWAYS use `ISL`** on graphics (never write out the full 'Indian Super League' as it is too long).
- **Header**: `FULL TIME` or `HALF TIME` in black Impact font, centered, with solid underline (`border-bottom: 5px solid #000000`).
- **Score**: In maroon/crimson (`#9E0A24`), Impact font.
- **Team Badges**:
  - Always use official club crests from ESPN.
  - Important: Atalanta is ESPN `105.png` (`https://a.espncdn.com/i/teamlogos/soccer/500/105.png`). Do NOT confuse with Bologna (`107.png`).
- **Scorers & Events**:
  - Home scorers right-aligned on left; Away scorers left-aligned on right.
  - Soccer ball icon in center. Red card icon in center for send-offs.
- **Channel Branding**:
  - **Facebook (`channel=fb`)**: `Inkhel Xtra` logo at the bottom-left on the dark pattern.
  - **WhatsApp / Telegram (`channel=wa`)**: Normal `Inkhel` logo at bottom-right on the white area.

---

### 2. Starting XI Lineup Graphics (`type=lineup` or `status=LINEUP`)
- **Background**: Solid pure white (`#FFFFFF`) with a black diagonal triangle in the bottom-right corner (`clip-path: polygon(100% 0, 100% 100%, 0 100%)`).
- **Top-Left**: League competition name (e.g. `PREMIER LEAGUE`, `SERIE A`, `CHAMPIONS LEAGUE`, `LA LIGA`, `BUNDESLIGA`, `LIGUE 1`, `INDIAN SUPER LEAGUE`) in italic bold Impact/Arial Black, color `#51565A`.
- **Top-Center**: Header MUST be **`LINEUP`** in black Impact font with a solid underline (`border-bottom: 5px solid #111111`). Never use "STARTING XI".
- **Crests & Time Row**:
  - Left: Home club crest (size ~220px). **NO club name text**.
  - Center: Match Kickoff Time (e.g. `6:00 PM` or `11:00 PM`) in maroon red (`#b51a36`, Impact font). **STRICT: NEVER append "IST"** (only the time).
  - Right: Away club crest (size ~220px). **NO club name text**.
  - **NO "VS" badge** in this row.
- **Lineup Columns**:
  - Home XI on left: **Right-aligned** (`text-align: right`), color `#4B5563`, font-size: ~29px.
  - Away XI on right: **Left-aligned** (`text-align: left`), color `#4B5563`, font-size: ~29px.
  - **NO vertical divider line** between the two columns.
- **Bottom Center Logo**:
  - **Facebook (`channel=fb`)**: Official light-background **Inkhel Xtra** logo (`public/inkhel-xtra-light.png` / `INKHEL_XTRA_LIGHT_B64`).
  - **WhatsApp / Telegram (`channel=wa`)**: Official clean **Inkhel** logo (`INKHEL_LOGO_B64`).
  - No ghost text or artifacts above or around the logo.

---

### 3. Live Goal Graphic (`type=goal` or `status=GOAL`)
- **Background**: Solid teal / petrol blue (`#1481A4`), 1000x1000 / 1024x1024.
- **Top-Right**: Two circular white badge containers (diameter 112px, border-radius 50%, white background with soft drop-shadow) displaying the two opposing club crests side-by-side.
- **Center**: Massive, chunky, solid white **`GOAL`** text in Impact / Arial Black (`font-size: 215px`, `font-weight: 900`, `letter-spacing: 2px`).
- **Automation**: Attached automatically as the HD photo for every real-time goal alert post on Facebook, WhatsApp, and Telegram, while keeping the full standard Mizo text caption intact.

---

### 4. Indian Football League (IFL) & Chanmari FC Guidelines
- **Competition Name**: Always use **`Indian Football League`** (or **`IFL`** on tabs/badges). Never use "I-League".
- **Team Filter**: Strictly only matches involving **Chanmari FC** are tracked and displayed.
- **Official Logos**: Always use high-definition vector SVGs (`public/logos/chanmari-fc.svg` and `public/logos/shillong-lajong.svg`).
- **No Dummy Stats**: For IFL (and any match without tracked statistics), the match stats block (`Possession: 50%-50%`, `Shots: 0-0`) is completely hidden from Half Time (HT) and Full Time (FT) posts.
- **No Fake VAR Alerts**: Competitions without VAR (IFL, ISL) strictly block any "VAR Disallowed" or score drop alerts. VAR alerts are exclusive to PL, UCL, LL, and BL.

---

### 5. Competitions & Fixture Tracking (`functions/services/espnService.ts`)
- Supported competitions: Premier League (`PL`), League Cup (`EFL`), La Liga (`LL`), Bundesliga (`BL`), Champions League (`UCL`), Indian Super League (`ISL`), Indian Football League (`IFL` - Chanmari FC only).
- **Club Filtering Rules**:
  - **La Liga (`LL`)**: Strictly only Barcelona and Real Madrid matches with their opponents.
  - **Bundesliga (`BL`)**: Strictly only **Bayern Munich** matches with their opponents (ID: `132`).
  - **Indian Football League (`IFL`)**: Strictly only **Chanmari FC** matches.
- **Hashtags**: 
  - IFL: `#IndianFootballLeague #IFL #ChanmariFC #IndianFootball`
  - Bundesliga: `#Bundesliga #FCBayern`
  - Champions League: `#ChampionsLeague #UCL`

---

### 6. Official Club Twitter Match Photography Pipeline (`functions/services/clubPhotoService.ts`)
- **Primary Source**: At Half Time (HT) and Full Time (FT), clean pitch-side photography is fetched directly from the verified official Club Twitter account(s) (`@BrentfordFC`, `@NFFC`, `@FCBayern`, `@Arsenal`, etc.).
- **Strict Clean Photo Rules**:
  - Automatically filters out graphic posters, score templates, matchday cards, and announcement graphics (`FULL-TIME`, `HALF-TIME`, `FT:`, `Lineup`, etc.).
  - Prioritizes raw on-pitch action, goal celebrations, team hugs, striker passion, and multi-photo galleries.
  - For Draw matches: scans both clubs to select the best celebration or high-intensity match action photo.
  - HT vs FT deduplication: ensures the Full Time post does not reuse the Half Time celebration photo.
- **Fallback**: If no club Twitter action photo is available, falls back to FotMob, and then to official dynamic scorecard graphics.

---

### 5. Workflow & Verification
- Always run `npm run typecheck` before committing.
- Commit and push to `main` branch on `https://github.com/lingtuka-design/xtra.git`.
- Deploy to Cloudflare Pages via `npm run deploy`.
