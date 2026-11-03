import { Env } from '../../types';
import { MATCH_CARD_BG_FB, MATCH_CARD_BG_WA } from './card-bg';
import { INKHEL_LOGO_B64, INKHEL_XTRA_LIGHT_B64 } from './inkhel-logo-b64';
import { resolveTeamLogo } from '../../services/clubCrests';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const type = (url.searchParams.get('type') || '').toLowerCase();
  const rawStatus = (url.searchParams.get('status') || 'FT').toUpperCase();
  const isLineup = type === 'lineup' || rawStatus === 'LINEUP' || rawStatus === 'XI' || rawStatus.includes('STARTING');

  const home = url.searchParams.get('home') || 'Home Team';
  const away = url.searchParams.get('away') || 'Away Team';
  const homeLogo = resolveTeamLogo(home, url.searchParams.get('homeLogo') || '');
  const awayLogo = resolveTeamLogo(away, url.searchParams.get('awayLogo') || '');
  let league = (url.searchParams.get('league') || 'PREMIER LEAGUE').trim();
  if (/indian\s+super\s+league/i.test(league) || league.toUpperCase() === 'ISL') {
    league = 'ISL';
  }
  const bgImage = url.searchParams.get('bgImage') || '';
  const channel = (url.searchParams.get('channel') || 'fb').toLowerCase();
  const isFb = channel === 'fb' || channel === 'facebook' || channel === 'xtra';

  // Helper to parse lists
  const parseList = (raw: string): string[] => {
    if (!raw || !raw.trim()) return [];
    const lines = raw.includes('\n') ? raw.split('\n') : raw.includes(';') ? raw.split(';') : raw.split(',');
    return lines.map((s) => s.trim()).filter(Boolean);
  };

  if (isLineup) {
    // EXACT LINEUP MODE - 100% faithful to user's uploaded design
    const homeXI = parseList(url.searchParams.get('homeXI') || url.searchParams.get('homeStarters') || '');
    const awayXI = parseList(url.searchParams.get('awayXI') || url.searchParams.get('awayStarters') || '');
    let matchTime = url.searchParams.get('matchTime') || url.searchParams.get('time') || '06:00 PM';
    matchTime = matchTime.replace(/\s*IST\s*/gi, '').trim();

    const lineupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${home} vs ${away} - Lineup</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1024px;
      height: 1024px;
      overflow: hidden;
      background-color: #FFFFFF;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    /* 1. League Title: Top Left */
    .league-title {
      position: absolute;
      top: 50px;
      left: 55px;
      font-family: Impact, "Arial Black", sans-serif;
      font-style: italic;
      font-size: 30px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #51565A;
      text-transform: uppercase;
    }
    /* 2. Header: LINEUP Centered with Underline */
    .header-box {
      position: absolute;
      top: 115px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header-text {
      font-family: Impact, "Arial Black", sans-serif;
      font-size: 54px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #111111;
      text-transform: uppercase;
      line-height: 1;
      border-bottom: 5px solid #111111;
      padding-bottom: 3px;
    }
    /* 3. Main Lineup Container: 3 Columns perfectly aligned (Home Team, Center Time, Away Team) */
    .lineup-container {
      position: absolute;
      top: 190px;
      left: 50%;
      transform: translateX(-50%);
      width: 920px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    /* Left / Home Column */
    .team-column.home {
      width: 350px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    /* Right / Away Column */
    .team-column.away {
      width: 350px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    /* Crest Container: sized in optical balance and aligned with player column */
    .crest-box {
      width: 100%;
      height: 165px;
      display: flex;
      align-items: center;
      margin-bottom: 22px;
    }
    .team-column.home .crest-box {
      justify-content: flex-end;
      padding-right: 25px;
    }
    .team-column.away .crest-box {
      justify-content: flex-start;
      padding-left: 25px;
    }
    .crest-img {
      max-width: 160px;
      max-height: 155px;
      object-fit: contain;
    }
    /* Center Column: Match Kickoff Time */
    .center-column {
      width: 220px;
      height: 165px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .match-time {
      font-family: Impact, "Arial Black", sans-serif;
      font-size: 44px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #b51a36;
      text-align: center;
      white-space: nowrap;
    }
    /* Players List */
    .players-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .team-column.home .players-list {
      align-items: flex-end;
      text-align: right;
      padding-right: 10px;
    }
    .team-column.away .players-list {
      align-items: flex-start;
      text-align: left;
      padding-left: 10px;
    }
    .player-row {
      font-size: 26px;
      font-weight: 650;
      color: #374151;
      line-height: 1.25;
      white-space: nowrap;
      letter-spacing: -0.2px;
    }
    /* 5. Bottom Center Logo */
    .bottom-logo-box {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bottom-logo {
      height: 46px;
      object-fit: contain;
    }
    .bottom-logo-xtra {
      height: 54px;
      object-fit: contain;
    }
    /* 6. Bottom Right Corner Black Triangle */
    .br-triangle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 110px;
      height: 120px;
      background-color: #000000;
      clip-path: polygon(100% 0, 100% 100%, 0 100%);
    }
  </style>
</head>
<body>
  <div class="league-title">${league}</div>
  <div class="header-box">
    <div class="header-text">LINEUP</div>
  </div>
  <div class="lineup-container">
    <div class="team-column home">
      <div class="crest-box">
        ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="crest-img" />` : ''}
      </div>
      <div class="players-list">
        ${homeXI.map((p) => `<div class="player-row">${p}</div>`).join('')}
      </div>
    </div>
    <div class="center-column">
      <div class="match-time">${matchTime}</div>
    </div>
    <div class="team-column away">
      <div class="crest-box">
        ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="crest-img" />` : ''}
      </div>
      <div class="players-list">
        ${awayXI.map((p) => `<div class="player-row">${p}</div>`).join('')}
      </div>
    </div>
  </div>
  <div class="bottom-logo-box">
    <img src="${isFb ? INKHEL_XTRA_LIGHT_B64 : INKHEL_LOGO_B64}" class="${isFb ? 'bottom-logo-xtra' : 'bottom-logo'}" />
  </div>
  <div class="br-triangle"></div>
</body>
</html>`;

    return new Response(lineupHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Background style: uses exact base template containing user's official background and channel-specific logo
  const defaultBg = isFb ? MATCH_CARD_BG_FB : MATCH_CARD_BG_WA;
  const cardBgUrl = bgImage && bgImage.startsWith('http') ? bgImage : defaultBg;

  // SCORECARD MODE (HT / FT)
    const homeScore = url.searchParams.get('homeScore') || '0';
    const awayScore = url.searchParams.get('awayScore') || '0';
    const isHT = rawStatus === 'HT' || rawStatus.includes('HALF');
    const isFT = rawStatus === 'FT' || rawStatus.includes('FULL');
    const statusText = isHT ? 'HALF TIME' : isFT ? 'FULL TIME' : rawStatus;

    // Helper to parse scorers into list of lines
    const parseScorers = (raw: string): string[] => {
      if (!raw || !raw.trim()) return [];
      const lines = raw.includes('\n') ? raw.split('\n') : raw.includes(';') ? raw.split(';') : [raw];
      const results: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const segments = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
        let currentPlayer = '';

        for (const seg of segments) {
          const hasLetters = /[a-zA-Z]{2,}/.test(seg);
          if (!hasLetters && currentPlayer) {
            currentPlayer += `, ${seg}`;
          } else {
            if (currentPlayer) results.push(currentPlayer);
            currentPlayer = seg;
          }
        }
        if (currentPlayer) results.push(currentPlayer);
      }
      return results;
    };

    const homeScorersList = parseScorers(url.searchParams.get('homeScorers') || url.searchParams.get('scorers') || '');
    const awayScorersList = parseScorers(url.searchParams.get('awayScorers') || '');
    const cleanRedCards = (raw: string): string[] => {
      const parsed = parseScorers(raw);
      return parsed.filter((item) => {
        const trimmed = item.trim();
        if (!trimmed || trimmed === '0') return false;
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num === 0 && !/[a-zA-Z]/.test(trimmed)) return false;
        return true;
      });
    };

    const homeRedCardList = cleanRedCards(
      url.searchParams.get('homeRedCardScorers') ||
      url.searchParams.get('homeRedCards') ||
      url.searchParams.get('homeRedCardsList') ||
      ''
    );
    const awayRedCardList = cleanRedCards(
      url.searchParams.get('awayRedCardScorers') ||
      url.searchParams.get('awayRedCards') ||
      url.searchParams.get('awayRedCardsList') ||
      ''
    );

    const bodyHtml = `
  <!-- 1. League Title -->
  <div class="league-title">${league}</div>

  <!-- 2. Status Badge -->
  <div class="status-container">
    <div class="status-text">${statusText}</div>
  </div>

  <!-- 3. Scoreboard Row -->
  <div class="scoreboard-row">
    <div class="crest-box">
      ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="team-logo" />` : '<span style="font-size:80px;">⚽</span>'}
    </div>
    <div class="score-center">
      <div class="score-digits">${homeScore}-${awayScore}</div>
    </div>
    <div class="crest-box">
      ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="team-logo" />` : '<span style="font-size:80px;">⚽</span>'}
    </div>
  </div>

  <!-- 4. Goal Scorers & Red Cards -->
  <div class="events-container">
    <!-- Goals -->
    ${(homeScorersList.length > 0 || awayScorersList.length > 0) ? `
      <div class="event-row">
        <div class="event-side-left">
          ${homeScorersList.map((s) => `<div>${s}</div>`).join('')}
        </div>
        <div class="event-icon-box">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
            <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#000000" stroke-width="1.3"/>
            <polygon points="12,7.5 15.5,10 14.2,14 9.8,14 8.5,10" fill="#111827"/>
            <line x1="12" y1="7.5" x2="12" y2="2" stroke="#111827" stroke-width="1.3"/>
            <line x1="15.5" y1="10" x2="20.5" y2="7.5" stroke="#111827" stroke-width="1.3"/>
            <line x1="14.2" y1="14" x2="18" y2="19.5" stroke="#111827" stroke-width="1.3"/>
            <line x1="9.8" y1="14" x2="6" y2="19.5" stroke="#111827" stroke-width="1.3"/>
            <line x1="8.5" y1="10" x2="3.5" y2="7.5" stroke="#111827" stroke-width="1.3"/>
          </svg>
        </div>
        <div class="event-side-right">
          ${awayScorersList.map((s) => `<div>${s}</div>`).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Red Cards -->
    ${(homeRedCardList.length > 0 || awayRedCardList.length > 0) ? `
      <div class="event-row">
        <div class="event-side-left">
          ${homeRedCardList.map((s) => `<div>${s}</div>`).join('')}
        </div>
        <div class="event-icon-box">
          <div class="red-card-icon"></div>
        </div>
        <div class="event-side-right">
          ${awayRedCardList.map((s) => `<div>${s}</div>`).join('')}
        </div>
      </div>
    ` : ''}
  </div>
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${home} vs ${away}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      width: 1024px;
      height: 1024px;
      overflow: hidden;
      position: relative;
      background: #FFFFFF url('${cardBgUrl}') no-repeat center center;
      background-size: cover;
      color: #111827;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* 1. League Title (Top-Right) */
    .league-title {
      position: absolute;
      top: 36px;
      right: 84px;
      font-size: 38px;
      font-weight: 900;
      font-style: italic;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #3D4347;
      text-align: right;
      z-index: 10;
    }

    /* 2. Header (Center) */
    .status-container {
      margin-top: ${isLineup ? '136px' : '146px'};
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 10;
    }
    .status-text {
      font-family: Impact, "Arial Black", -apple-system, sans-serif;
      font-size: ${isLineup ? '54px' : '60px'};
      font-weight: 900;
      letter-spacing: 5px;
      text-transform: uppercase;
      color: #000000;
      line-height: 1;
      border-bottom: 5px solid #000000;
      padding-bottom: 2px;
      display: inline-block;
    }

    /* 3. Logos & Score Row (Scorecard Mode) */
    .scoreboard-row {
      margin-top: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 890px;
      z-index: 10;
    }
    .crest-box {
      width: 220px;
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .team-logo {
      max-width: 210px;
      max-height: 210px;
      object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12));
    }
    .score-center {
      width: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .score-digits {
      font-family: Impact, "Arial Black", -apple-system, sans-serif;
      font-size: 144px;
      line-height: 0.95;
      font-weight: 900;
      color: #9E0A24;
      letter-spacing: 2px;
    }

    /* 4. Events Section (Goals & Cards) */
    .events-container {
      margin-top: 24px;
      width: 880px;
      display: flex;
      flex-direction: column;
      gap: 22px;
      z-index: 10;
    }
    .event-row {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      width: 100%;
    }
    .event-side-left {
      flex: 1;
      text-align: right;
      padding-right: 36px;
      font-size: 26px;
      font-weight: 700;
      color: #2B3440;
      line-height: 1.45;
    }
    .event-icon-box {
      width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding-top: 1px;
    }
    .event-side-right {
      flex: 1;
      text-align: left;
      padding-left: 36px;
      font-size: 26px;
      font-weight: 700;
      color: #2B3440;
      line-height: 1.45;
    }
    .red-card-icon {
      width: 26px;
      height: 38px;
      background-color: #D91A2A;
      border-radius: 3px;
      transform: rotate(14deg);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
