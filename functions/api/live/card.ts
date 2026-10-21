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
  const scorers = url.searchParams.get('scorers') || '';
  const stats = url.searchParams.get('stats') || '';
  const channel = (url.searchParams.get('channel') || 'fb').toLowerCase();

  const isFT = status === 'FT' || status === 'FULL TIME';
  const statusLabel = isFT ? 'FULL TIME' : 'HALF TIME';
  const statusBadgeBg = isFT
    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';

  // Branding: FB gets "INKHEL XTRA", WhatsApp gets "INKHEL"
  const brandText = channel === 'fb' ? 'INKHEL XTRA' : 'INKHEL';
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
      height: 675px;
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
        radial-gradient(circle at 50% 20%, rgba(30, 58, 138, 0.35) 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
        linear-gradient(180deg, #0b0f19 0%, #05070a 100%);
      z-index: 1;
    }
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
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
      padding: 40px 60px;
    }
    /* Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding-bottom: 20px;
    }
    .league-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #e2e8f0;
    }
    .brand-badge {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #ffffff;
    }
    .brand-xtra {
      color: #f59e0b;
      margin-left: 2px;
    }

    /* Main Match Score Area */
    .match-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: auto 0;
      padding: 20px 0;
    }
    .team-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      max-width: 360px;
    }
    .team-logo-wrap {
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 28px;
      padding: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .team-logo {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.5));
    }
    .team-name {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    }

    /* Center Score Board */
    .score-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 280px;
    }
    .status-pill {
      background: ${statusBadgeBg};
      color: #ffffff;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 2px;
      padding: 6px 20px;
      border-radius: 999px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      margin-bottom: 12px;
    }
    .score-digits {
      font-size: 96px;
      font-weight: 900;
      letter-spacing: 12px;
      line-height: 1;
      display: flex;
      align-items: center;
      color: #ffffff;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.25);
    }
    .score-separator {
      color: #64748b;
      margin: 0 10px;
      font-weight: 300;
    }

    /* Bottom Info */
    .bottom-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 18px;
    }
    .scorers-line {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 6px 20px;
      border-radius: 999px;
    }
    .stats-line {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
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
        <img src="${logoUrl}" alt="Inkhel" class="brand-logo" />
        <div class="brand-name">
          INKHEL${channel === 'fb' ? '<span class="brand-xtra">XTRA</span>' : ''}
        </div>
      </div>
    </div>

    <!-- Match Scoreboard -->
    <div class="match-container">
      <!-- Home Team -->
      <div class="team-box">
        <div class="team-logo-wrap">
          ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="team-logo" />` : '<span style="font-size:48px;">⚽</span>'}
        </div>
        <div class="team-name">${home}</div>
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
          ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="team-logo" />` : '<span style="font-size:48px;">⚽</span>'}
        </div>
        <div class="team-name">${away}</div>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bottom-bar">
      ${scorers ? `<div class="scorers-line">⚽ ${scorers}</div>` : ''}
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
