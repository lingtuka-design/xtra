import { Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const home = url.searchParams.get('home') || 'Home Team';
  const away = url.searchParams.get('away') || 'Away Team';
  const homeScore = url.searchParams.get('homeScore') || '0';
  const awayScore = url.searchParams.get('awayScore') || '0';
  const homeLogo = url.searchParams.get('homeLogo') || '';
  const awayLogo = url.searchParams.get('awayLogo') || '';
  const status = (url.searchParams.get('status') || 'HT').toUpperCase();
  const league = url.searchParams.get('league') || 'UEFA Champions League';
  const homeScorers = url.searchParams.get('homeScorers') || url.searchParams.get('scorers') || '';
  const awayScorers = url.searchParams.get('awayScorers') || '';
  const stats = url.searchParams.get('stats') || '';
  const channel = (url.searchParams.get('channel') || 'fb').toLowerCase();

  const isFT = status === 'FT' || status === 'FULL TIME';
  const statusLabel = isFT ? 'FULL TIME' : 'HALF TIME';
  const statusBadgeBg = isFT
    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';

  const logoUrl = `${url.origin}/inkhel-logo.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${home} vs ${away} - ${statusLabel}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      width: 1200px;
      height: 900px; /* 4:3 Aspect Ratio (1200 / 900) */
      overflow: hidden;
      background: #080b11;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    /* Stadium Vignette & Lighting */
    .bg-gradient {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 50% 25%, rgba(30, 58, 138, 0.45) 0%, transparent 65%),
        radial-gradient(circle at 15% 75%, rgba(220, 38, 38, 0.18) 0%, transparent 55%),
        radial-gradient(circle at 85% 75%, rgba(16, 185, 129, 0.18) 0%, transparent 55%),
        linear-gradient(180deg, #0b0f19 0%, #05070a 100%);
      z-index: 1;
    }
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 48px 48px;
      z-index: 2;
    }
    .content {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 70px;
    }
    /* Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding-bottom: 24px;
    }
    .league-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 10px 22px;
      border-radius: 999px;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #e2e8f0;
    }
    .brand-badge {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 50px;
      height: 50px;
      object-fit: contain;
    }
    .brand-xtra {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2.5px;
      color: #f59e0b;
    }

    /* Main Match Score Area */
    .match-container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin: auto 0;
      padding: 20px 0;
      width: 100%;
    }
    .team-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 18px;
      max-width: 380px;
    }
    .team-logo-wrap {
      width: 170px;
      height: 170px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 32px;
      padding: 24px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
    }
    .team-logo {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.6));
    }
    .team-name {
      font-size: 30px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.25;
      text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    }
    .team-scorers {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }
    .scorer-pill {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 16px;
      border-radius: 999px;
      white-space: nowrap;
    }

    /* Center Score Board */
    .score-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 300px;
      margin-top: 30px;
    }
    .status-pill {
      background: ${statusBadgeBg};
      color: #ffffff;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 2.5px;
      padding: 8px 24px;
      border-radius: 999px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      margin-bottom: 16px;
    }
    .score-digits {
      font-size: 110px;
      font-weight: 900;
      letter-spacing: 16px;
      line-height: 1;
      display: flex;
      align-items: center;
      color: #ffffff;
      text-shadow: 0 0 35px rgba(255, 255, 255, 0.3);
    }
    .score-separator {
      color: #64748b;
      margin: 0 12px;
      font-weight: 300;
    }

    /* Bottom Info */
    .bottom-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 24px;
    }
    .stats-line {
      font-size: 16px;
      font-weight: 700;
      color: #cbd5e1;
      letter-spacing: 0.8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 10px 28px;
      border-radius: 999px;
    }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="grid-pattern"></div>

  <div class="content">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="league-badge">
        <span>🏆</span>
        <span>${league}</span>
      </div>

      <div class="brand-badge">
        <img src="${logoUrl}" alt="Logo" class="brand-logo" />
        ${channel === 'fb' ? '<div class="brand-xtra">XTRA</div>' : ''}
      </div>
    </div>

    <!-- Match Scoreboard -->
    <div class="match-container">
      <!-- Home Team -->
      <div class="team-box">
        <div class="team-logo-wrap">
          ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="team-logo" />` : '<span style="font-size:54px;">⚽</span>'}
        </div>
        <div class="team-name">${home}</div>

        ${homeScorers ? `
          <div class="team-scorers">
            ${homeScorers.split(',').map((s: string) => `<div class="scorer-pill">⚽ ${s.trim()}</div>`).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Center Score -->
      <div class="score-box">
        <div class="status-pill">${statusLabel}</div>
        <div class="score-digits">
          <span>${homeScore}</span>
          <span class="score-separator">-</span>
          <span>${awayScore}</span>
        </div>
      </div>

      <!-- Away Team -->
      <div class="team-box">
        <div class="team-logo-wrap">
          ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="team-logo" />` : '<span style="font-size:54px;">⚽</span>'}
        </div>
        <div class="team-name">${away}</div>

        ${awayScorers ? `
          <div class="team-scorers">
            ${awayScorers.split(',').map((s: string) => `<div class="scorer-pill">⚽ ${s.trim()}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bottom-bar">
      ${stats ? `<div class="stats-line">${stats}</div>` : ''}
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
