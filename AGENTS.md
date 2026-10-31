# Xtra Project Guidelines & Design Standards

## Match Graphics & Card Generator Specifications (`functions/api/live/card.ts`)

### 1. Match Scorecard Graphics (`status=HT` or `status=FT`)
- **Background**: Diagonal dark-art base template (`MATCH_CARD_BG_FB` / `MATCH_CARD_BG_WA`). Central white polygon must remain 100% pure solid `#FFFFFF` with 0 ghost text, 0 crest remnants, and 0 smudges.
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

### 3. Workflow & Verification
- Always run `npm run typecheck` before committing.
- Commit and push to `main` branch on `https://github.com/lingtuka-design/xtra.git`.
- Deploy to Cloudflare Pages via `npm run deploy`.
