import { Env } from '../../types';
import { MATCH_CARD_BG_FB, MATCH_CARD_BG_WA } from './card-bg';
import { INKHEL_LOGO_B64, INKHEL_XTRA_LIGHT_B64 } from './inkhel-logo-b64';
import { resolveTeamLogo } from '../../services/clubCrests';
import { resolveLeagueLogo } from '../../services/leagueLogos';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const type = (url.searchParams.get('type') || '').toLowerCase();
  const rawStatus = (url.searchParams.get('status') || 'FT').toUpperCase();
  const isLineup = type === 'lineup' || rawStatus === 'LINEUP' || rawStatus === 'XI' || rawStatus.includes('STARTING');
  const isGoal = type === 'goal' || rawStatus === 'GOAL';
  const isNoGoal = type === 'no_goal' || rawStatus === 'NO_GOAL' || rawStatus === 'NO GOAL' || type === 'disallowed';

  const home = url.searchParams.get('home') || 'Home Team';
  const away = url.searchParams.get('away') || 'Away Team';
  const homeLogo = resolveTeamLogo(home, url.searchParams.get('homeLogo') || '');
  const awayLogo = resolveTeamLogo(away, url.searchParams.get('awayLogo') || '');
  let league = (url.searchParams.get('league') || 'PREMIER LEAGUE').trim();
  if (/indian\s+super\s+league/i.test(league) || league.toUpperCase() === 'ISL') {
    league = 'ISL';
  } else if (/i-league|indian\s+football\s+league/i.test(league) || league.toUpperCase() === 'IL' || league.toUpperCase() === 'IFL') {
    league = 'INDIAN FOOTBALL LEAGUE';
  }
  const bgImage = url.searchParams.get('bgImage') || '';
  const channel = (url.searchParams.get('channel') || 'fb').toLowerCase();
  const isFb = channel === 'fb' || channel === 'facebook' || channel === 'xtra';
  const scorer = (url.searchParams.get('scorer') || '').trim();
  const minute = (url.searchParams.get('minute') || '').trim();

  // EXACT MINIMAL NO GOAL CARD (VAR Disallowed - Red #A80A24)
  if (isNoGoal) {
    const noGoalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${home} vs ${away} - NO GOAL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1000px;
      height: 1000px;
      overflow: hidden;
      background-color: #A80A24;
      position: relative;
      font-family: Impact, "Arial Black", -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .crests-top-right {
      position: absolute;
      top: 44px;
      right: 88px;
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .crest-circle {
      width: 112px;
      height: 112px;
      border-radius: 50%;
      background-color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    }
    .crest-img {
      max-width: 82px;
      max-height: 82px;
      object-fit: contain;
    }
    .goal-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .goal-text {
      font-family: Impact, "Arial Black", "Montserrat", sans-serif;
      font-weight: 900;
      font-size: 185px;
      letter-spacing: 2px;
      color: #FFFFFF;
      text-transform: uppercase;
      line-height: 1;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="crests-top-right">
    <div class="crest-circle">
      ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="crest-img" />` : '<span style="font-size:48px;">⚽</span>'}
    </div>
    <div class="crest-circle">
      ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="crest-img" />` : '<span style="font-size:48px;">⚽</span>'}
    </div>
  </div>

  <div class="goal-center">
    <div class="goal-text">NO GOAL</div>
  </div>
</body>
</html>`;

    return new Response(noGoalHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // EXACT MINIMAL GOAL CARD (100% faithful to user's design)
  if (isGoal) {
    const goalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${home} vs ${away} - GOAL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1000px;
      height: 1000px;
      overflow: hidden;
      background-color: #1481A4;
      position: relative;
      font-family: Impact, "Arial Black", -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .crests-top-right {
      position: absolute;
      top: 44px;
      right: 88px;
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .crest-circle {
      width: 112px;
      height: 112px;
      border-radius: 50%;
      background-color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    }
    .crest-img {
      max-width: 82px;
      max-height: 82px;
      object-fit: contain;
    }
    .goal-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .goal-text {
      font-family: 'Montserrat', "Arial Black", Impact, sans-serif;
      font-weight: 900;
      font-size: 225px;
      letter-spacing: 3px;
      color: #FFFFFF;
      -webkit-text-stroke: 8px #FFFFFF;
      text-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      text-transform: uppercase;
      line-height: 1;
      text-align: center;
    }
    .goal-scorer-info {
      margin-top: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 40px;
      font-weight: 900;
      color: #FFFFFF;
      text-transform: uppercase;
      letter-spacing: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px 38px;
      background: rgba(0, 0, 0, 0.32);
      border-radius: 9999px;
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    }
    .goal-scorer-minute {
      color: #FCD34D;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <div class="crests-top-right">
    <div class="crest-circle">
      ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="crest-img" />` : '<span style="font-size:48px;">⚽</span>'}
    </div>
    <div class="crest-circle">
      ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="crest-img" />` : '<span style="font-size:48px;">⚽</span>'}
    </div>
  </div>

  <div class="goal-center">
    <div class="goal-text">GOAL</div>
    ${(scorer || minute) ? `
    <div class="goal-scorer-info">
      <span>${scorer}</span>
      ${minute ? `<span class="goal-scorer-minute">${minute.includes("'") ? minute : minute + "'"}</span>` : ''}
    </div>` : ''}
  </div>
</body>
</html>`;

    return new Response(goalHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap" rel="stylesheet">
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
      top: 60px;
      left: 62px;
      font-family: Impact, "Arial Black", sans-serif;
      font-style: italic;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #51565A;
      text-transform: uppercase;
    }
    /* 2. Header: LINEUP Centered with Underline */
    .header-box {
      position: absolute;
      top: 145px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header-text {
      font-family: Impact, "Arial Black", sans-serif;
      font-size: 58px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #111111;
      text-transform: uppercase;
      line-height: 1;
      border-bottom: 5px solid #111111;
      padding-bottom: 2px;
    }
    /* 3. Crests and Match Time Row */
    .crests-row {
      position: absolute;
      top: 185px;
      left: 0;
      width: 1024px;
      height: 235px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 85px;
    }
    .crest-container {
      width: 230px;
      height: 230px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .crest-img {
      max-width: 215px;
      max-height: 215px;
      object-fit: contain;
    }
    .match-time {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #AF0725;
      text-align: center;
      white-space: nowrap;
    }
    /* 4. Lineup Player Columns */
    .lineup-columns {
      position: absolute;
      top: 410px;
      left: 0;
      width: 1024px;
      display: flex;
      justify-content: center;
      gap: 190px;
    }
    .xi-column {
      width: 335px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .xi-column.left {
      text-align: right;
      align-items: flex-end;
    }
    .xi-column.right {
      text-align: left;
      align-items: flex-start;
    }
    .player-row {
      font-size: 28px;
      font-weight: 650;
      color: #374151;
      line-height: 1.25;
      white-space: nowrap;
      letter-spacing: -0.2px;
    }
    /* 5. Bottom Center Logo */
    .bottom-logo-box {
      position: absolute;
      bottom: 35px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bottom-logo {
      height: 48px;
      object-fit: contain;
    }
    .bottom-logo-xtra {
      height: 56px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="league-title">${league}</div>
  <div class="header-box">
    <div class="header-text">LINEUP</div>
  </div>
  <div class="crests-row">
    <div class="crest-container">
      ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="crest-img" />` : ''}
    </div>
    <div class="match-time">${matchTime}</div>
    <div class="crest-container">
      ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="crest-img" />` : ''}
    </div>
  </div>
  <div class="lineup-columns">
    <div class="xi-column left">
      ${homeXI.map((p) => `<div class="player-row">${p}</div>`).join('')}
    </div>
    <div class="xi-column right">
      ${awayXI.map((p) => `<div class="player-row">${p}</div>`).join('')}
    </div>
  </div>
  <div class="bottom-logo-box">
    <img src="${isFb ? INKHEL_XTRA_LIGHT_B64 : INKHEL_LOGO_B64}" class="${isFb ? 'bottom-logo-xtra' : 'bottom-logo'}" />
  </div>
</body>
</html>`;

    return new Response(lineupHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // SCORECARD MODE (GOAL / HT / FT) - 1:1 Square Modern Template
    const homeScore = url.searchParams.get('homeScore') || '0';
    const awayScore = url.searchParams.get('awayScore') || '0';
    const isHT = rawStatus === 'HT' || rawStatus.includes('HALF');
    const isFT = rawStatus === 'FT' || rawStatus.includes('FULL');
    const isStatusGoal = rawStatus === 'GOAL' || rawStatus.startsWith('GOAL');
    const statusText = isHT
      ? 'HALF TIME'
      : isFT
      ? 'FULL TIME'
      : isStatusGoal
      ? (rawStatus === 'GOAL' ? 'GOAL!' : rawStatus)
      : rawStatus;

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

    const leagueLogoUrl = resolveLeagueLogo(league);
    const brandLogoB64 = isFb ? INKHEL_XTRA_LIGHT_B64 : INKHEL_LOGO_B64;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${home} vs ${away} - ${statusText}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700;800;900&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap" rel="stylesheet">
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
      background-color: #5F779B;
      background: 
        radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.07) 0%, rgba(0, 0, 0, 0.18) 100%),
        repeating-linear-gradient(
          -45deg,
          rgba(255, 255, 255, 0.035) 0px,
          rgba(255, 255, 255, 0.035) 1.5px,
          transparent 1.5px,
          transparent 28px
        ),
        #5F779B;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      user-select: none;
    }

    /* Top Center League Logo */
    .league-logo-box {
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .league-logo {
      height: 132px;
      object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2));
    }

    /* Top Center Status */
    .status-text {
      position: absolute;
      top: 196px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Fredoka', 'Arial Rounded MT Bold', -apple-system, sans-serif;
      font-weight: 800;
      font-size: 64px;
      letter-spacing: 2.5px;
      color: #FFFFFF;
      text-transform: uppercase;
      text-align: center;
      line-height: 1;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
    }

    /* Center Match Row */
    .match-center-row {
      position: absolute;
      top: 288px;
      left: 0;
      width: 1024px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 95px;
    }

    .crest-container {
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .crest-img {
      max-width: 195px;
      max-height: 195px;
      object-fit: contain;
      filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.22));
    }

    .score-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .score-num {
      font-family: 'Fredoka', 'Arial Rounded MT Bold', -apple-system, sans-serif;
      font-weight: 900;
      font-size: 162px;
      color: #FFFFFF;
      line-height: 1;
      letter-spacing: -2px;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
    }

    .score-hyphen {
      width: 48px;
      height: 22px;
      background-color: #FFFFFF;
      border-radius: 11px;
      margin: 0 10px;
      filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.16));
    }

    /* Scorers & Cards Area */
    .events-section {
      position: absolute;
      top: 498px;
      left: 0;
      width: 1024px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .event-row {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      width: 100%;
    }

    .event-side-left {
      width: 380px;
      text-align: right;
      padding-right: 32px;
      font-size: 27px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.5;
      filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.15));
    }

    .event-icon-box {
      width: 56px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      flex-shrink: 0;
      padding-top: 2px;
    }

    .ball-icon {
      width: 48px;
      height: 48px;
      object-fit: contain;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
    }

    .event-side-right {
      width: 380px;
      text-align: left;
      padding-left: 32px;
      font-size: 27px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.5;
      filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.15));
    }

    .red-card-icon {
      width: 26px;
      height: 38px;
      background-color: #E21B2A;
      border-radius: 3px;
      transform: rotate(14deg);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }

    /* Bottom Center Brand Logo */
    .brand-logo {
      position: absolute;
      bottom: 45px;
      left: 50%;
      transform: translateX(-50%);
      ${isFb ? 'height: 48px;' : 'height: 42px;'}
      object-fit: contain;
      filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.25));
    }
  </style>
</head>
<body>
  <!-- League Logo at Top Center -->
  <div class="league-logo-box">
    <img src="${leagueLogoUrl}" alt="${league}" class="league-logo" />
  </div>

  <!-- Status -->
  <div class="status-text">${statusText}</div>

  <!-- Main Center Row -->
  <div class="match-center-row">
    <div class="crest-container">
      ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="crest-img" />` : ''}
    </div>

    <div class="score-container">
      <span class="score-num">${homeScore}</span>
      <span class="score-hyphen"></span>
      <span class="score-num">${awayScore}</span>
    </div>

    <div class="crest-container">
      ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="crest-img" />` : ''}
    </div>
  </div>

  <!-- Goal Scorers & Cards Section -->
  <div class="events-section">
    ${(homeScorersList.length > 0 || awayScorersList.length > 0) ? `
      <div class="event-row">
        <div class="event-side-left">
          ${homeScorersList.map((s) => `<div>${s}</div>`).join('')}
        </div>
        <div class="event-icon-box">
          <img src="https://xtra-byd.pages.dev/logos/ball.png" alt="⚽" class="ball-icon" />
        </div>
        <div class="event-side-right">
          ${awayScorersList.map((s) => `<div>${s}</div>`).join('')}
        </div>
      </div>
    ` : ''}

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

  <!-- Bottom Left Logo -->
  <img src="${brandLogoB64}" alt="Inkhel" class="brand-logo" />
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
