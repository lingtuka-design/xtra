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
  const homeScorersRaw = url.searchParams.get('homeScorers') || url.searchParams.get('scorers') || '';
  const awayScorersRaw = url.searchParams.get('awayScorers') || '';
  const channel = (url.searchParams.get('channel') || 'fb').toLowerCase();
  const bgImage = url.searchParams.get('bgImage') || '';

  // Stats query params
  const homePossession = url.searchParams.get('homePossession') || '50%';
  const awayPossession = url.searchParams.get('awayPossession') || '50%';

  const homeShots = url.searchParams.get('homeShots') || '0';
  const awayShots = url.searchParams.get('awayShots') || '0';

  const homeShotsOnTarget = url.searchParams.get('homeShotsOnTarget') || '0';
  const awayShotsOnTarget = url.searchParams.get('awayShotsOnTarget') || '0';

  const homeCorners = url.searchParams.get('homeCorners') || '0';
  const awayCorners = url.searchParams.get('awayCorners') || '0';

  const homeFouls = url.searchParams.get('homeFouls') || '0';
  const awayFouls = url.searchParams.get('awayFouls') || '0';

  const homeYellowCards = url.searchParams.get('homeYellowCards') || '0';
  const awayYellowCards = url.searchParams.get('awayYellowCards') || '0';

  const homeRedCards = url.searchParams.get('homeRedCards') || '0';
  const awayRedCards = url.searchParams.get('awayRedCards') || '0';

  const isFT = status === 'FT' || status.includes('FULL');
  const statusTop = isFT ? 'FULL' : 'HALF';
  const statusBottom = 'TIME';

  // Parse scorers
  const homeScorersList = homeScorersRaw ? homeScorersRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const awayScorersList = awayScorersRaw ? awayScorersRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const statsList = [
    { label: 'POSSESSION', home: homePossession, away: awayPossession, isPossession: true },
    { label: 'SHOTS', home: homeShots, away: awayShots },
    { label: 'SHOTS ON TARGET', home: homeShotsOnTarget, away: awayShotsOnTarget },
    { label: 'CORNERS', home: homeCorners, away: awayCorners },
    { label: 'FOULS', home: homeFouls, away: awayFouls },
    { label: 'YELLOW CARDS', home: homeYellowCards, away: awayYellowCards },
    { label: 'RED CARDS', home: homeRedCards, away: awayRedCards },
  ];

  // Dot matrix SVG generator
  const dotMatrix = `
    <svg width="64" height="96" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${Array.from({ length: 6 })
        .map((_, r) =>
          Array.from({ length: 4 })
            .map((_, c) => `<circle cx="${c * 17 + 5}" cy="${r * 16 + 6}" r="2.8" fill="white" fill-opacity="0.6"/>`)
            .join('')
        )
        .join('')}
    </svg>
  `;

  // Official Inkhel Vector SVG
  const inkhelSvg = `
    <svg width="150" height="42" viewBox="0 0 6683 1858" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
      <g transform="matrix(1,0,0,1,-8972.54,-259.853)">
        <g transform="matrix(1,0,0,1,8414.76,104.994)">
          <g transform="matrix(4.16667,0,0,4.16667,3652.43,948.396)">
            <g id="Layer-1">
              <path d="M0,64.872L51.933,24.363L29.641,98.383L0,64.872ZM-579.209,-190.449C-616.988,-190.449 -647.724,-159.71 -647.724,-121.927C-647.724,-92.056 -628.504,-66.588 -601.784,-57.235L-682.145,-23.743L-742.717,1.505L-679.427,18.841L-644.472,28.42L-645.195,107.513L-645.241,112.362L-643.287,116.807L-606.952,199.37L-582.329,255.321L-564.698,196.788L-552.394,155.945L-490.23,155.945C-489.806,155.959 -489.242,155.974 -488.552,155.974C-481.012,155.974 -461.705,154.425 -445.278,140.084C-430.359,127.057 -425.537,112.744 -424.301,108.098L-420.395,95.014L-378.813,147.408L-372.039,155.945L-294.525,155.945C-294.02,155.966 -293.416,155.98 -292.72,155.98C-288.985,155.98 -281.952,155.532 -273.559,152.839L-274.494,155.945L-180.832,155.945C-180.612,155.948 -180.337,155.952 -180.01,155.952C-174.514,155.952 -155.29,154.894 -138.627,141.275C-131.556,135.497 -126.626,129.354 -123.208,123.846L-103.53,147.73L-96.762,155.945L12.312,155.945L12.297,155.986L42.699,155.945L80.557,155.945L80.507,155.893L105.834,155.858C106.387,155.883 107.06,155.899 107.837,155.899C114.396,155.899 131.448,154.492 148.041,141.408C163.96,128.861 169.255,112.969 170.538,108.217L174.714,94.423L196.469,94.423L186.653,126.844L177.835,155.945L271.383,155.945C271.655,155.952 271.998,155.959 272.41,155.959C276.147,155.959 283.333,155.524 291.842,152.863L290.863,156.113L524.866,156.113C525.182,156.121 525.581,156.127 526.053,156.127C529.159,156.127 536.539,155.773 545.521,152.919L544.607,155.945L783.833,155.945C784.046,155.948 784.316,155.952 784.634,155.952C790.115,155.952 809.327,154.866 826.438,140.893C841.958,128.224 847.29,112.538 848.466,108.437L852.241,96.002L861.094,66.88L715.319,66.88L740.883,-18.329L749.592,-47.373L656.545,-47.373C656.118,-47.388 655.571,-47.4 654.917,-47.4C651.134,-47.4 644.04,-46.947 635.599,-44.235L636.493,-47.205L402.629,-47.205C402.127,-47.226 401.522,-47.241 400.819,-47.241C397.088,-47.241 390.179,-46.799 381.957,-44.199L382.91,-47.373L289.69,-47.373C289.23,-47.39 288.688,-47.402 288.068,-47.402C281.76,-47.402 265.301,-46.084 248.758,-33.874C231.591,-21.2 225.816,-3.542 224.539,1.13L220.637,14.149L198.843,14.149L208.586,-18.329L217.299,-47.373L123.82,-47.373C123.664,-47.375 123.466,-47.376 123.232,-47.376C123.053,-47.376 122.853,-47.375 122.64,-47.373L-49.462,-47.373L-55.65,-42.407L-75.642,-26.364L-69.268,-47.373L-162.653,-47.373C-163.076,-47.388 -163.616,-47.399 -164.265,-47.399C-168.087,-47.399 -175.244,-46.94 -183.743,-44.199L-182.787,-47.373L-274.65,-47.373C-274.995,-47.381 -275.446,-47.392 -275.995,-47.392C-283.147,-47.392 -301.598,-45.965 -318.421,-32.766C-332.627,-21.621 -338.371,-7.765 -340.335,-1.62L-368.453,-38.492L-375.226,-47.373L-471.003,-47.373C-471.332,-47.381 -471.753,-47.388 -472.261,-47.388C-476.185,-47.388 -483.557,-46.94 -492.102,-44.221L-485.632,-65.695L-471.869,-111.386L-515.914,-93.028L-517.381,-92.417C-513.096,-101.357 -510.694,-111.366 -510.694,-121.927C-510.694,-159.71 -541.429,-190.449 -579.209,-190.449M447.044,36.72L504.19,36.652L509.493,19.4L452.283,19.4L447.044,36.72M400.819,-24.68C401.613,-24.68 402.051,-24.644 402.051,-24.644L606.144,-24.644L586.61,40.274C586.61,40.274 583.409,51.883 573.435,60.722C561.575,71.236 548.582,72.059 544.818,72.059C544.12,72.059 543.743,72.03 543.743,72.03L436.44,72.03L431.164,89.607L571.783,89.607L567.917,102.396C567.917,102.396 564.551,114.143 554.619,122.61C542.562,132.892 529.321,133.567 526.053,133.567C525.564,133.567 525.297,133.55 525.297,133.55L321.217,133.55L359.19,7.448C359.19,7.448 362.188,-4.874 373.314,-14.179C384.878,-23.848 396.987,-24.68 400.819,-24.68M-275.995,-24.83C-275.406,-24.83 -275.085,-24.811 -275.085,-24.811L-213.142,-24.811L-251.396,102.237C-251.396,102.237 -254.841,114.645 -265.711,123.384C-277.203,132.618 -288.978,133.417 -292.72,133.417C-293.508,133.417 -293.939,133.385 -293.939,133.385L-361.141,133.385L-429.631,47.082L-446.045,102.062C-446.045,102.062 -448.523,112.965 -460.114,123.089C-471.072,132.653 -484.553,133.413 -488.552,133.413C-489.307,133.413 -489.722,133.385 -489.722,133.385L-552.322,133.385L-514.35,7.281C-514.35,7.281 -511.477,-4.941 -498.969,-15.296C-488.209,-24.205 -475.579,-24.827 -472.261,-24.827C-471.723,-24.827 -471.431,-24.811 -471.431,-24.811L-386.394,-24.811L-331.438,47.254L-319.172,6.374C-319.172,6.374 -316.179,-5.849 -304.496,-15.015C-292.82,-24.177 -279.542,-24.83 -275.995,-24.83M-164.265,-24.837C-163.582,-24.837 -163.209,-24.811 -163.209,-24.811L-99.69,-24.811L-118.408,36.884L-41.53,-24.811L78.292,-24.811L-32.798,61.843L30.48,133.385L-86.118,133.385L-131.004,78.904L-138.007,102.092C-138.007,102.092 -140.421,113.605 -152.904,123.808C-164.027,132.894 -177.261,133.389 -180.01,133.389C-180.345,133.389 -180.525,133.385 -180.525,133.385L-244.139,133.385L-206.183,7.332C-206.183,7.332 -202.969,-5.284 -191.922,-14.412C-180.227,-24.072 -167.886,-24.837 -164.265,-24.837M654.917,-24.839C655.607,-24.839 655.981,-24.811 655.981,-24.811L719.273,-24.811L684.996,89.442L830.658,89.442L826.813,102.088C826.813,102.088 823.574,114.106 812.17,123.418C800.575,132.888 787.327,133.389 784.634,133.389C784.312,133.389 784.141,133.385 784.141,133.385L574.965,133.385L612.721,8.003C612.721,8.003 615.803,-4.976 627.52,-14.562C639.146,-24.075 651.313,-24.839 654.917,-24.839M288.068,-24.841C288.768,-24.841 289.147,-24.811 289.147,-24.811L352.554,-24.811L314.305,102.214C314.305,102.214 311.612,114.813 298.206,124.701C287.129,132.871 275.278,133.396 272.41,133.396C271.983,133.396 271.759,133.385 271.759,133.385L208.243,133.385L226.877,71.861L157.976,71.861L148.817,102.092C148.817,102.092 145.848,114.411 134.074,123.692C122.885,132.51 111.662,133.34 107.837,133.34C106.948,133.34 106.458,133.294 106.458,133.294L42.667,133.385L80.637,7.278C80.637,7.278 83.733,-5.8 96.642,-15.751C107.875,-24.417 120.931,-24.816 123.232,-24.816C123.466,-24.816 123.588,-24.811 123.588,-24.811L186.975,-24.811L168.521,36.713L237.422,36.713L246.25,7.278C246.25,7.278 249.469,-6.354 262.157,-15.722C273.551,-24.129 284.643,-24.841 288.068,-24.841M-507.236,-72.204L-586.3,190.286L-622.635,107.719L-621.751,11.251L-673.467,-2.916L-507.236,-72.204M-579.209,-167.887C-553.826,-167.887 -533.255,-147.313 -533.255,-121.927C-533.255,-96.555 -553.826,-75.977 -579.209,-75.977C-604.587,-75.977 -625.162,-96.555 -625.162,-121.927C-625.162,-147.313 -604.587,-167.887 -579.209,-167.887" style="fill:white;fill-rule:nonzero;"/>
            </g>
          </g>
        </g>
        <g transform="matrix(1,0,0,1,8414.76,104.994)">
          <g id="Layer-2" transform="matrix(4.16667,0,0,4.16667,0.644454,0.00583)">
            <g transform="matrix(1,0,0,-1,0,-308.736)">
              <path d="M282.495,-370.873C275.726,-373.162 269.663,-376.985 264.721,-381.929C261.603,-385.049 258.931,-388.615 256.809,-392.524C253.275,-399.035 251.267,-406.494 251.267,-414.423C251.267,-425.477 255.173,-435.62 261.679,-443.549C262.64,-444.72 263.658,-445.843 264.728,-446.913C269.67,-451.854 275.73,-455.675 282.498,-457.964C287.121,-459.526 292.072,-460.373 297.22,-460.373C309.911,-460.373 321.399,-455.229 329.715,-446.913C330.785,-445.844 331.803,-444.72 332.763,-443.55C339.27,-435.621 343.174,-425.477 343.174,-414.423C343.174,-406.494 341.167,-399.035 337.634,-392.524C335.512,-388.615 332.841,-385.049 329.722,-381.929C321.406,-373.609 309.916,-368.463 297.22,-368.463C292.071,-368.463 287.118,-369.31 282.495,-370.873Z" style="fill:rgb(20,168,220);fill-rule:nonzero;"/>
            </g>
            <g transform="matrix(1,0,0,-1,0,53.209)">
              <path d="M256.19,-149.303C238.448,-156.698 220.705,-164.092 202.963,-171.489C207.337,-172.686 211.713,-173.885 216.088,-175.084C228.952,-178.608 241.816,-182.132 254.678,-185.655C254.417,-214.27 254.155,-242.886 253.893,-271.5C253.86,-275.042 253.827,-278.582 253.795,-282.123C258.652,-293.162 263.51,-304.202 268.368,-315.241C275.622,-331.723 282.875,-348.207 290.129,-364.69C292.32,-357.418 294.511,-350.143 296.702,-342.869C298.412,-337.192 300.122,-331.514 301.832,-325.837C322.096,-258.564 342.358,-191.293 362.622,-124.022C364.812,-116.749 367.003,-109.475 369.193,-102.201C331.526,-117.902 293.858,-133.602 256.19,-149.303Z" style="fill:rgb(0,168,219);fill-rule:nonzero;"/>
            </g>
          </g>
        </g>
      </g>
    </svg>
  `;

  const bgStyle = bgImage
    ? `background-image: linear-gradient(180deg, rgba(7, 10, 16, 0.84) 0%, rgba(4, 6, 10, 0.94) 100%), url('${bgImage}'); background-size: cover; background-position: center;`
    : `background: radial-gradient(circle at 50% 18%, rgba(20, 28, 48, 0.4) 0%, rgba(5, 7, 12, 0.95) 80%), linear-gradient(180deg, #121824 0%, #06080e 100%);`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${home} vs ${away} - ${statusTop} ${statusBottom}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      width: 820px;
      height: 1024px;
      overflow: hidden;
      background: #06080d;
      position: relative;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 34px 30px 22px;
    }
    .bg-layer {
      position: absolute;
      inset: 0;
      ${bgStyle}
      z-index: 1;
    }
    .vignette-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 30%, transparent 40%, rgba(0,0,0,0.75) 100%);
      z-index: 2;
    }
    .dot-accent-tr {
      position: absolute;
      top: 36px;
      right: 36px;
      z-index: 4;
    }
    .dot-accent-bl {
      position: absolute;
      bottom: 100px;
      left: 36px;
      z-index: 4;
    }
    .main-wrap {
      position: relative;
      z-index: 10;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .league-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
      margin-bottom: 18px;
    }
    .status-badge {
      background: #ffffff;
      width: 126px;
      height: 70px;
      border-radius: 6px 6px 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: -1px;
      z-index: 12;
      box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.35);
    }
    .status-text {
      font-family: Impact, "Arial Black", -apple-system, sans-serif;
      font-size: 30px;
      line-height: 0.94;
      font-weight: 900;
      color: #7E0A0A;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .score-card {
      width: 670px;
      height: 135px;
      display: flex;
      align-items: stretch;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
      margin-bottom: 12px;
    }
    .crest-box {
      background: #ffffff;
      width: 175px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
    }
    .team-logo {
      max-width: 96px;
      max-height: 96px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15));
    }
    .score-center {
      background: #7E0A0A;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .score-digits {
      font-family: Impact, "Arial Black", -apple-system, sans-serif;
      font-size: 96px;
      line-height: 1;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 8px;
      text-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      transform: translateY(-2px);
    }
    .scorers-wrap {
      width: 670px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      min-height: 48px;
      padding: 0 6px;
    }
    .home-scorers {
      text-align: left;
      font-size: 14.5px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.35;
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.9);
      max-width: 320px;
    }
    .away-scorers {
      text-align: right;
      font-size: 14.5px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.35;
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.9);
      max-width: 320px;
    }
    .stats-table {
      width: 670px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .stat-pill {
      background: #ffffff;
      border-radius: 13px;
      height: 47px;
      padding: 0 26px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }
    .stat-num {
      font-size: 24px;
      font-weight: 900;
      color: #0B1B3D;
      width: 65px;
    }
    .stat-num.left {
      text-align: left;
    }
    .stat-num.right {
      text-align: right;
    }
    .stat-mid {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 250px;
    }
    .stat-label {
      font-size: 12.5px;
      font-weight: 800;
      color: #0B1B3D;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .stat-bar-track {
      width: 230px;
      height: 5.5px;
      background: #D1D5DB;
      border-radius: 999px;
      position: relative;
      overflow: hidden;
      display: flex;
    }
    .bar-fill-home {
      background: #B91C1C;
      height: 100%;
      border-radius: 999px 0 0 999px;
    }
    .bar-fill-away {
      background: #D1D5DB;
      height: 100%;
      border-radius: 0 999px 999px 0;
    }
    .footer-brand {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
    }
    .brand-svg-box {
      display: flex;
      align-items: center;
      justify-content: center;
      transform: scale(0.95);
    }
    .brand-xtra-text {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.6px;
      margin-top: -3px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
    }
  </style>
</head>
<body>
  <div class="bg-layer"></div>
  <div class="vignette-overlay"></div>

  <div class="dot-accent-tr">${dotMatrix}</div>
  <div class="dot-accent-bl">${dotMatrix}</div>

  <div class="main-wrap">
    <div class="league-title">${league}</div>

    <div class="status-badge">
      <div class="status-text">${statusTop}</div>
      <div class="status-text">${statusBottom}</div>
    </div>

    <div class="score-card">
      <div class="crest-box">
        ${homeLogo ? `<img src="${homeLogo}" alt="${home}" class="team-logo" />` : '<span style="font-size:48px;">⚽</span>'}
      </div>
      <div class="score-center">
        <div class="score-digits">${homeScore} : ${awayScore}</div>
      </div>
      <div class="crest-box">
        ${awayLogo ? `<img src="${awayLogo}" alt="${away}" class="team-logo" />` : '<span style="font-size:48px;">⚽</span>'}
      </div>
    </div>

    <div class="scorers-wrap">
      <div class="home-scorers">
        ${homeScorersList.map((s) => `<div>${s}</div>`).join('')}
      </div>
      <div class="away-scorers">
        ${awayScorersList.map((s) => `<div>${s}</div>`).join('')}
      </div>
    </div>

    <div class="stats-table">
      ${statsList
        .map((s) => {
          let homePct = 50;
          let awayPct = 50;
          const hVal = parseFloat(String(s.home).replace('%', '')) || 0;
          const aVal = parseFloat(String(s.away).replace('%', '')) || 0;
          const total = hVal + aVal;

          if (s.isPossession) {
            homePct = hVal || 50;
            awayPct = 100 - homePct;
          } else if (total > 0) {
            homePct = Math.round((hVal / total) * 100);
            awayPct = 100 - homePct;
          }

          return `
            <div class="stat-pill">
              <div class="stat-num left">${s.home}</div>
              <div class="stat-mid">
                <div class="stat-label">${s.label}</div>
                <div class="stat-bar-track">
                  <div class="bar-fill-home" style="width: ${homePct}%;"></div>
                  <div class="bar-fill-away" style="width: ${awayPct}%;"></div>
                </div>
              </div>
              <div class="stat-num right">${s.away}</div>
            </div>
          `;
        })
        .join('')}
    </div>
  </div>

  <div class="footer-brand">
    <div class="brand-svg-box">
      ${inkhelSvg}
    </div>
    ${channel === 'fb' ? '<div class="brand-xtra-text">Xtra</div>' : ''}
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
