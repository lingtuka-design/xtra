import { Env } from '../../types';
import { espnService } from '../../services/espnService';
import { fotmobService } from '../../services/fotmobService';
import { facebookPoster } from '../../services/facebookPoster';
import { whatsappPoster } from '../../services/whatsappPoster';
import { telegramPoster } from '../../services/telegramPoster';

// Helper to convert WhatsApp formatted footer to Telegram
function toTelegramCaption(text: string): string {
  return text.replace(/👉 _Inkhel WhatsApp Channel_/g, '👉 _Inkhel Telegram Channel_')
             .replace(/📲 _Inkhel WhatsApp Channel_/g, '📲 _Inkhel Telegram Channel_');
}

// Dynamic hashtag generator based on match competition
function getLeagueHashtag(leagueName: string): string {
  const l = (leagueName || '').toLowerCase();
  if (l.includes('premier')) {
    return '#PremierLeague';
  }
  if (l.includes('champions') || l.includes('ucl')) {
    return '#ChampionsLeague #UCL';
  }
  if (l.includes('indian') || l.includes('isl')) {
    return '#IndianSuperLeague #ISL';
  }
  return '#Football';
}

// Helper to format Mizo Goal Alert
function formatGoalPost(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  scorer: string | undefined,
  minute: string,
  leagueName: string
): string {
  const scorerLine = scorer ? `⚽ Scorer: ${scorer} (${minute})\n` : `⚽ Minute: ${minute}\n`;

  return `🚨 GOAAALLL!! ⚽ (${minute})

${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${scorerLine}🏆 ${leagueName}

#InkhelxtraLive ${getLeagueHashtag(leagueName)} #FootballUpdate`;
}

// Helper to format WhatsApp Goal Alert
function formatWhatsAppGoal(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  scorer: string | undefined,
  minute: string,
  leagueName: string
): string {
  const scorerLine = scorer ? `*Scorer:* ${scorer} (${minute})\n` : `*Time:* ${minute}\n`;

  return `⚽ *GOAAALLL!!* (${minute})
${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${scorerLine}🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
}

// Helper to format Mizo Lineup Alert for Facebook
function formatLineupPost(
  homeTeam: string,
  awayTeam: string,
  homeFormation: string | undefined,
  awayFormation: string | undefined,
  homeStarters: string[],
  awayStarters: string[],
  leagueName: string
): string {
  const homeHeader = homeFormation ? `${homeTeam} XI (${homeFormation})` : `${homeTeam} XI`;
  const awayHeader = awayFormation ? `${awayTeam} XI (${awayFormation})` : `${awayTeam} XI`;

  return `📋 CONFIRMED LINEUPS! ⚽

${homeTeam} vs ${awayTeam}

${homeHeader}:
${homeStarters.join(', ')}

${awayHeader}:
${awayStarters.join(', ')}

🏆 ${leagueName}

#InkhelxtraLive ${getLeagueHashtag(leagueName)} #Lineup`;
}

// Helper to format WhatsApp Lineup Alert
function formatWhatsAppLineup(
  homeTeam: string,
  awayTeam: string,
  homeFormation: string | undefined,
  awayFormation: string | undefined,
  homeStarters: string[],
  awayStarters: string[],
  leagueName: string
): string {
  const homeHeader = homeFormation ? `${homeTeam} XI (${homeFormation})` : `${homeTeam} XI`;
  const awayHeader = awayFormation ? `${awayTeam} XI (${awayFormation})` : `${awayTeam} XI`;

  return `📋 *CONFIRMED LINEUPS!* ⚽

*${homeTeam} vs ${awayTeam}*

*${homeHeader}:*
${homeStarters.join(', ')}

*${awayHeader}:*
${awayStarters.join(', ')}

🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
}

// Helper to format Scorer Name with (OG) or (Pen)
function formatScorerDisplay(ev: any): string {
  let name = ev.athleteName || 'Goal';
  const isOg =
    ev.isOwnGoal ||
    (ev.text || '').toLowerCase().includes('own goal') ||
    (ev.type || '').toLowerCase().includes('own-goal');
  if (isOg && !name.toLowerCase().includes('(og)')) {
    name = `${name} (OG)`;
  }
  return name;
}

// Helper to format Half Time post for Facebook
// Helper to format grouped match scorers: e.g. "(Nicolas Jackson 6', 60')  (Erling Haaland 52')"
function formatMatchScorersDisplay(goalEvents: any[], homeTeamId?: string, awayTeamId?: string): string {
  if (!goalEvents || goalEvents.length === 0) return '';

  const formatTeam = (teamId?: string) => {
    const teamGoals = goalEvents.filter((ev: any) => (teamId && ev.teamId ? ev.teamId === teamId : true));
    if (teamGoals.length === 0) return '';
    const playerMap = new Map<string, string[]>();
    for (const ev of teamGoals) {
      const name = formatScorerDisplay(ev);
      const m = ev.minute ? `${ev.minute.replace(/'/g, '')}'` : '';
      if (!playerMap.has(name)) playerMap.set(name, []);
      if (m) playerMap.get(name)!.push(m);
    }
    const parts: string[] = [];
    for (const [name, mins] of playerMap.entries()) {
      if (mins.length > 0) {
        parts.push(`${name} ${mins.join(', ')}`);
      } else {
        parts.push(name);
      }
    }
    return parts.length > 0 ? `(${parts.join(', ')})` : '';
  };

  const homeGrouped = homeTeamId ? formatTeam(homeTeamId) : '';
  const awayGrouped = awayTeamId ? formatTeam(awayTeamId) : '';

  if (homeGrouped && awayGrouped) {
    return `${homeGrouped}  ${awayGrouped}`;
  } else if (homeGrouped) {
    return homeGrouped;
  } else if (awayGrouped) {
    return awayGrouped;
  }
  return '';
}

function formatHalfTimePost(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  scorersText: string,
  stats: any,
  leagueName: string
): string {
  const scorersSection = scorersText ? `⚽ ${scorersText}\n\n` : '';
  const statsSection = stats
    ? `📊 Match Stats (HT):
Possession: ${stats.home.possession} - ${stats.away.possession}
Shots: ${stats.home.shots} (Target: ${stats.home.shotsOnTarget}) - ${stats.away.shots} (Target: ${stats.away.shotsOnTarget})
Corners: ${stats.home.corners} - ${stats.away.corners}
Fouls: ${stats.home.fouls} - ${stats.away.fouls}\n\n`
    : '';

  return `⏸️ HALF TIME

${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${scorersSection}${statsSection}🏆 ${leagueName}

#InkhelxtraLive ${getLeagueHashtag(leagueName)} #HalfTime`;
}

// Helper to format WhatsApp Half Time post
function formatWhatsAppHalfTime(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  scorersText: string,
  stats: any,
  leagueName: string
): string {
  const scorersSection = scorersText ? `⚽ ${scorersText}\n\n` : '';
  const statsSection = stats
    ? `📊 *Match Stats (HT):*
Possession: ${stats.home.possession} - ${stats.away.possession}
Shots: ${stats.home.shots} (Target: ${stats.home.shotsOnTarget}) - ${stats.away.shots} (Target: ${stats.away.shotsOnTarget})
Corners: ${stats.home.corners} - ${stats.away.corners}
Fouls: ${stats.home.fouls} - ${stats.away.fouls}\n\n`
    : '';

  return `⏸️ *HALF TIME*

*${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}*
${scorersSection}${statsSection}🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
}

// Helper to format Full Time post for Facebook
function formatFullTimePost(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  scorersText: string,
  stats: any,
  leagueName: string
): string {
  const scorersSection = scorersText ? `⚽ ${scorersText}\n\n` : '';
  const statsSection = stats
    ? `📊 Final Match Stats:
Possession: ${stats.home.possession} - ${stats.away.possession}
Shots: ${stats.home.shots} (Target: ${stats.home.shotsOnTarget}) - ${stats.away.shots} (Target: ${stats.away.shotsOnTarget})
Corners: ${stats.home.corners} - ${stats.away.corners}
Fouls: ${stats.home.fouls} - ${stats.away.fouls}\n\n`
    : '';

  return `🏁 FULL TIME RESULT!

${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${scorersSection}${statsSection}🏆 ${leagueName}

#InkhelxtraLive ${getLeagueHashtag(leagueName)} #FullTime`;
}

// Helper to format WhatsApp Full Time post
function formatWhatsAppFullTime(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  scorersText: string,
  stats: any,
  leagueName: string
): string {
  const scorersSection = scorersText ? `⚽ ${scorersText}\n\n` : '';
  const statsSection = stats
    ? `📊 *Final Match Stats:*
Possession: ${stats.home.possession} - ${stats.away.possession}
Shots: ${stats.home.shots} (Target: ${stats.home.shotsOnTarget}) - ${stats.away.shots} (Target: ${stats.away.shotsOnTarget})
Corners: ${stats.home.corners} - ${stats.away.corners}
Fouls: ${stats.home.fouls} - ${stats.away.fouls}\n\n`
    : '';

  return `🏁 *FULL TIME RESULT!*

*${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}*
${scorersSection}${statsSection}🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
}

// Helper to format VAR Disallowed Goal Alert for Facebook
function formatVarDisallowedPost(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  minute: string,
  reason: string | undefined,
  leagueName: string
): string {
  const reasonText = reason ? ` (${reason})` : '';
  return `❌ GOAL DISALLOWED! (VAR) 🖥️

${homeTeam} ${homeScore} - ${awayScore} ${awayTeam} (${minute})

VAR-in endik a nih hnuah goal hi pawm a ni ta lo${reasonText}. Score a ngai: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}.

🏆 ${leagueName}

#InkhelxtraLive #VAR ${getLeagueHashtag(leagueName)}`;
}

// Helper to format WhatsApp VAR Disallowed Goal Alert
function formatWhatsAppVarDisallowed(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  minute: string,
  reason: string | undefined,
  leagueName: string
): string {
  const reasonText = reason ? ` _(${reason})_` : '';
  return `❌ *GOAL DISALLOWED! (VAR)* 🖥️

*${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}* (${minute})

VAR-in endik a nih hnuah goal hi pawm a ni ta lo${reasonText}. Score a ngai: *${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}*.

🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
}

// Helper to format Mizo Player Ratings Post for Facebook
function formatPlayerRatingsPost(
  homeTeam: string,
  awayTeam: string,
  homeStarters: { name: string; rating?: string }[],
  homeSubs: { name: string; rating?: string }[],
  awayStarters: { name: string; rating?: string }[],
  awaySubs: { name: string; rating?: string }[],
  leagueName: string
): string {
  const fmtList = (list: { name: string; rating?: string }[]) =>
    list
      .map((p) => {
        if (!p.rating) return p.name;
        // Prevent Facebook from auto-converting "8)" into sunglasses smiley 😎
        const safeRating = p.rating.endsWith('8') ? `${p.rating}\u200B` : p.rating;
        return `${p.name} (${safeRating})`;
      })
      .join(', ');

  const homeStartersText = fmtList(homeStarters);
  const homeSubsText = homeSubs.length > 0 ? `\n\nSubs : ${fmtList(homeSubs)}` : '';

  const awayStartersText = fmtList(awayStarters);
  const awaySubsText = awaySubs.length > 0 ? `\n\nSubs : ${fmtList(awaySubs)}` : '';

  return `${homeTeam} vs ${awayTeam} inkhel Player ratings :

${homeTeam} : ${homeStartersText}${homeSubsText}

${awayTeam} : ${awayStartersText}${awaySubsText}

🏆 ${leagueName}

#InkhelxtraLive #PlayerRatings ${getLeagueHashtag(leagueName)}`;
}

// Helper to format WhatsApp Player Ratings Post
function formatWhatsAppRatings(
  homeTeam: string,
  awayTeam: string,
  homeStarters: { name: string; rating?: string }[],
  homeSubs: { name: string; rating?: string }[],
  awayStarters: { name: string; rating?: string }[],
  awaySubs: { name: string; rating?: string }[],
  leagueName: string
): string {
  const fmtList = (list: { name: string; rating?: string }[]) =>
    list.map((p) => (p.rating ? `${p.name} (${p.rating})` : p.name)).join(', ');

  const homeStartersText = fmtList(homeStarters);
  const homeSubsText = homeSubs.length > 0 ? `\n\n*Subs :* ${fmtList(homeSubs)}` : '';

  const awayStartersText = fmtList(awayStarters);
  const awaySubsText = awaySubs.length > 0 ? `\n\n*Subs :* ${fmtList(awaySubs)}` : '';

  return `⭐ *${homeTeam} vs ${awayTeam} inkhel Player ratings :*

*${homeTeam} :* ${homeStartersText}${homeSubsText}

*${awayTeam} :* ${awayStartersText}${awaySubsText}

🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
}

// Helper to format Red Card Alert for Facebook
function formatRedCardPost(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  player: string | undefined,
  teamName: string | undefined,
  minute: string,
  leagueName: string
): string {
  const playerLine = player
    ? `🟥 Red Card: ${player}${teamName ? ` (${teamName})` : ''} - ${minute}\n`
    : `🟥 Red Card (${minute})\n`;

  return `🚨 RED CARD!! 🟥 (${minute})

${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${playerLine}🏆 ${leagueName}

#InkhelxtraLive #RedCard ${getLeagueHashtag(leagueName)} #FootballUpdate`;
}

// Helper to format WhatsApp Red Card Alert
function formatWhatsAppRedCard(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  player: string | undefined,
  teamName: string | undefined,
  minute: string,
  leagueName: string
): string {
  const playerLine = player
    ? `*Red Card:* ${player}${teamName ? ` (${teamName})` : ''} - ${minute}\n`
    : `*Red Card:* ${minute}\n`;

  return `🟥 *RED CARD!!* (${minute})
${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${playerLine}🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
}

// Helper to generate 4:5 Match Scorecard Graphic using user's custom design
function buildCardImageUrl(options: {
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
  homeLogo?: string;
  awayLogo?: string;
  status: 'HT' | 'FT';
  leagueName: string;
  homeScorers: string;
  awayScorers: string;
  stats?: any;
  channel: 'fb' | 'wa';
  bgImage?: string;
}): string {
  const q = new URLSearchParams();
  q.set('home', options.home);
  q.set('away', options.away);
  q.set('homeScore', options.homeScore);
  q.set('awayScore', options.awayScore);
  if (options.homeLogo) q.set('homeLogo', options.homeLogo);
  if (options.awayLogo) q.set('awayLogo', options.awayLogo);
  q.set('status', options.status);
  q.set('league', options.leagueName);
  if (options.homeScorers) q.set('homeScorers', options.homeScorers);
  if (options.awayScorers) q.set('awayScorers', options.awayScorers);
  q.set('channel', options.channel);
  if (options.bgImage) q.set('bgImage', options.bgImage);

  if (options.stats) {
    q.set('homePossession', options.stats.home.possession || '50%');
    q.set('awayPossession', options.stats.away.possession || '50%');
    q.set('homeShots', options.stats.home.shots || '0');
    q.set('awayShots', options.stats.away.shots || '0');
    q.set('homeShotsOnTarget', options.stats.home.shotsOnTarget || '0');
    q.set('awayShotsOnTarget', options.stats.away.shotsOnTarget || '0');
    q.set('homeCorners', options.stats.home.corners || '0');
    q.set('awayCorners', options.stats.away.corners || '0');
    q.set('homeFouls', options.stats.home.fouls || '0');
    q.set('awayFouls', options.stats.away.fouls || '0');
    if (options.stats.home.yellowCards) q.set('homeYellowCards', options.stats.home.yellowCards);
    if (options.stats.away.yellowCards) q.set('awayYellowCards', options.stats.away.yellowCards);
    if (options.stats.home.redCards) q.set('homeRedCards', options.stats.home.redCards);
    if (options.stats.away.redCards) q.set('awayRedCards', options.stats.away.redCards);
  }

  const cardEndpoint = `https://xtra-byd.pages.dev/api/live/card?${q.toString()}`;
  return `https://api.microlink.io/?url=${encodeURIComponent(cardEndpoint)}&screenshot=true&embed=screenshot.url&viewport.width=820&viewport.height=1024`;
}

// POST or GET /api/live/poll -> checks all active tracked matches and auto-posts new goals to Xtra FB + WhatsApp
export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handlePoll(context);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handlePoll(context);
};

async function handlePoll(context: EventContext<Env, any, any>) {
  const { env } = context;

  try {
    // 1. Get all actively tracked matches
    const { results: activeMatches } = await env.DB.prepare(
      'SELECT * FROM live_tracked_matches WHERE is_active = 1'
    ).all<any>();

    if (!activeMatches || activeMatches.length === 0) {
      return Response.json({ success: true, message: 'No matches currently tracked', posted: 0 });
    }

    let totalPosted = 0;
    const logDetails: string[] = [];

    for (const match of activeMatches) {
      const leagueSlug =
        match.league === 'UCL'
          ? 'uefa.champions'
          : match.league === 'ISL'
          ? 'ind.1'
          : 'eng.1';
      const leagueName =
        match.league === 'UCL'
          ? 'UEFA Champions League'
          : match.league === 'ISL'
          ? 'Indian Super League'
          : 'Premier League';

      let summary;
      try {
        summary = await espnService.getMatchSummary(leagueSlug, match.event_id);
      } catch (err: any) {
        console.warn(`Summary error for ${match.event_id}:`, err.message);
        continue;
      }

      const isResultsOnly = match.track_mode === 'results_only';

      // 1. Check Confirmed Lineups: Auto-Post if announced before kickoff (or at match start)
      if (!isResultsOnly && summary.lineups && (summary.status.state === 'pre' || match.status !== 'FT')) {
        const lineupEventId = `lineup_${match.event_id}`;
        
        if (summary.status.state === 'pre') {
          // Atomic claim: Try inserting lock into D1 first. If already inserted, skip immediately!
          let claimed = false;
          try {
            const insertLock = await env.DB.prepare(
              'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
            ).bind(match.event_id, lineupEventId, 'lineup', 'Pre-Match', 'Confirmed Lineups').run();
            claimed = Boolean(insertLock.success);
          } catch {
            claimed = false; // Duplicate blocked by unique index!
          }

          if (claimed) {
            const fbLineup = formatLineupPost(
              summary.lineups.home.team || match.home_team,
              summary.lineups.away.team || match.away_team,
              summary.lineups.home.formation,
              summary.lineups.away.formation,
              summary.lineups.home.starters,
              summary.lineups.away.starters,
              leagueName
            );

            const waLineup = formatWhatsAppLineup(
              summary.lineups.home.team || match.home_team,
              summary.lineups.away.team || match.away_team,
              summary.lineups.home.formation,
              summary.lineups.away.formation,
              summary.lineups.home.starters,
              summary.lineups.away.starters,
              leagueName
            );

            // 1. Post to Facebook Page
            if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
              try {
                await facebookPoster.postNews(
                  fbLineup,
                  undefined,
                  env.FB_PAGE_ID,
                  env.FB_PAGE_ACCESS_TOKEN
                );
              } catch (fbErr: any) {
                console.error('FB Lineup Post error:', fbErr.message);
              }
            }

            // 2. Post to WhatsApp Channel
            try {
              await whatsappPoster.postNews(
                waLineup,
                undefined,
                env.WHATSAPP_API_TOKEN,
                env.WHATSAPP_CHANNEL_ID,
                env.WHATSAPP_API_URL
              );
            } catch (waErr: any) {
              console.error('WhatsApp Lineup Post error:', waErr.message);
            }

            // 3. Post to Telegram Channel
            try {
              await telegramPoster.postNews(
                toTelegramCaption(waLineup),
                undefined,
                env.TELEGRAM_BOT_TOKEN,
                env.TELEGRAM_CHANNEL_ID
              );
            } catch (tgErr: any) {
              console.error('Telegram Lineup Post error:', tgErr.message);
            }

            totalPosted++;
            logDetails.push(`Lineup posted: ${match.home_team} vs ${match.away_team}`);
          }
        }
      }

      // 2. Check all events in this match (Goals) - Skipped if results_only
      if (!isResultsOnly) {
        for (let i = 0; i < summary.events.length; i++) {
          const ev = summary.events[i];
          if (ev.type.toLowerCase().includes('goal') || ev.scoringPlay) {
            // Atomic claim: Try inserting lock into D1 first.
            let claimed = false;
            try {
              const insertLock = await env.DB.prepare(
                'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
              ).bind(match.event_id, ev.id, 'goal', ev.minute, ev.text).run();
              claimed = Boolean(insertLock.success);
            } catch {
              claimed = false; // Duplicate blocked!
            }

            if (claimed) {
              // Calculate accurate running score up to this goal:
              // ESPN scoreboard header score often lags 30-60s behind live event feed.
              // We compute score from:
              // 1) Timeline goal count up to this event
              const goalsUpToNow = summary.events
                .slice(0, i + 1)
                .filter((e) => e.type.toLowerCase().includes('goal') || e.scoringPlay);

              let homeGoalsCount = 0;
              let awayGoalsCount = 0;

              if (summary.homeTeamId && summary.awayTeamId) {
                homeGoalsCount = goalsUpToNow.filter((e) => e.teamId === summary.homeTeamId).length;
                awayGoalsCount = goalsUpToNow.filter((e) => e.teamId === summary.awayTeamId).length;
              }

              // 2) Parse score from event text if present (e.g. "Goal! Como 4, Manchester United 0...")
              let parsedHome: number | null = null;
              let parsedAway: number | null = null;
              const textMatch = ev.text.match(/Goal!\s+(.+?)\s+(\d+),\s+(.+?)\s+(\d+)/i);
              if (textMatch) {
                const team1 = textMatch[1].trim().toLowerCase();
                const score1 = parseInt(textMatch[2], 10);
                const score2 = parseInt(textMatch[4], 10);
                const homeName = (match.home_team || '').toLowerCase();
                if (homeName.includes(team1) || team1.includes(homeName)) {
                  parsedHome = score1;
                  parsedAway = score2;
                } else {
                  parsedHome = score2;
                  parsedAway = score1;
                }
              }

              // 3) Resolve the most accurate non-lagging score
              let finalHomeScore = Math.max(
                parseInt(summary.score.home || '0', 10),
                homeGoalsCount,
                parsedHome !== null ? parsedHome : 0
              );
              let finalAwayScore = Math.max(
                parseInt(summary.score.away || '0', 10),
                awayGoalsCount,
                parsedAway !== null ? parsedAway : 0
              );

              if (ev.teamId === summary.homeTeamId && finalHomeScore === 0) {
                finalHomeScore = 1;
              }
              if (ev.teamId === summary.awayTeamId && finalAwayScore === 0) {
                finalAwayScore = 1;
              }

              const scorerName = formatScorerDisplay(ev);

              // New Goal! Auto-Post to Inkhel Xtra Facebook + WhatsApp Channel!
              const fbCaption = formatGoalPost(
                match.home_team,
                match.away_team,
                String(finalHomeScore),
                String(finalAwayScore),
                scorerName,
                ev.minute || 'Goal',
                leagueName
              );

              const waCaption = formatWhatsAppGoal(
                match.home_team,
                match.away_team,
                String(finalHomeScore),
                String(finalAwayScore),
                scorerName,
                ev.minute || 'Goal',
                leagueName
              );

              // 1. Post to Inkhel Xtra Facebook Page
              if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
                try {
                  await facebookPoster.postNews(
                    fbCaption,
                    undefined,
                    env.FB_PAGE_ID,
                    env.FB_PAGE_ACCESS_TOKEN
                  );
                } catch (fbErr: any) {
                  console.error('FB Live Goal Post error:', fbErr.message);
                }
              }

              // 2. Post to WhatsApp Channel
              try {
                await whatsappPoster.postNews(
                  waCaption,
                  undefined,
                  env.WHATSAPP_API_TOKEN,
                  env.WHATSAPP_CHANNEL_ID,
                  env.WHATSAPP_API_URL
                );
              } catch (waErr: any) {
                console.error('WhatsApp Live Goal Post error:', waErr.message);
              }

              // 3. Post to Telegram Channel
              try {
                await telegramPoster.postNews(
                  toTelegramCaption(waCaption),
                  undefined,
                  env.TELEGRAM_BOT_TOKEN,
                  env.TELEGRAM_CHANNEL_ID
                );
              } catch (tgErr: any) {
                console.error('Telegram Live Goal Post error:', tgErr.message);
              }

              totalPosted++;
              logDetails.push(`Goal posted: ${ev.athleteName || 'Goal'} (${ev.minute}) - ${match.home_team} vs ${match.away_team}`);
            }
          }
        }

        // 2b. Check VAR Disallowed Goal Events
        for (const ev of summary.events) {
          const textLower = (ev.text || '').toLowerCase();
          const typeLower = (ev.type || '').toLowerCase();
          const isVarDisallowed =
            (typeLower.includes('var') && (textLower.includes('no goal') || textLower.includes('disallowed') || textLower.includes('overturned'))) ||
            textLower.includes('goal disallowed') ||
            textLower.includes('disallowed goal') ||
            textLower.includes('var decision: no goal') ||
            textLower.includes('decision: no goal');

          if (isVarDisallowed) {
            const varEventId = `var_${match.event_id}_${ev.id}`;
            let claimed = false;
            try {
              const insertLock = await env.DB.prepare(
                'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
              ).bind(match.event_id, varEventId, 'var_disallowed', ev.minute, ev.text).run();
              claimed = Boolean(insertLock.success);
            } catch {
              claimed = false; // Duplicate blocked!
            }

            if (claimed) {
              let reason = 'Offside/Foul';
              if (textLower.includes('offside')) reason = 'Offside';
              else if (textLower.includes('handball')) reason = 'Handball';
              else if (textLower.includes('foul')) reason = 'Foul';

              const fbVar = formatVarDisallowedPost(
                match.home_team,
                match.away_team,
                summary.score.home,
                summary.score.away,
                ev.minute || 'VAR',
                reason,
                leagueName
              );

              const waVar = formatWhatsAppVarDisallowed(
                match.home_team,
                match.away_team,
                summary.score.home,
                summary.score.away,
                ev.minute || 'VAR',
                reason,
                leagueName
              );

              if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
                try {
                  await facebookPoster.postNews(fbVar, undefined, env.FB_PAGE_ID, env.FB_PAGE_ACCESS_TOKEN);
                } catch (fbErr: any) {
                  console.error('FB VAR Alert error:', fbErr.message);
                }
              }

              try {
                await whatsappPoster.postNews(
                  waVar,
                  undefined,
                  env.WHATSAPP_API_TOKEN,
                  env.WHATSAPP_CHANNEL_ID,
                  env.WHATSAPP_API_URL
                );
              } catch (waErr: any) {
                console.error('WhatsApp VAR Alert error:', waErr.message);
              }

              try {
                await telegramPoster.postNews(
                  toTelegramCaption(waVar),
                  undefined,
                  env.TELEGRAM_BOT_TOKEN,
                  env.TELEGRAM_CHANNEL_ID
                );
              } catch (tgErr: any) {
                console.error('Telegram VAR Alert error:', tgErr.message);
              }

              totalPosted++;
              logDetails.push(`VAR Disallowed Goal posted: ${match.home_team} vs ${match.away_team} (${ev.minute})`);
            }
          }
        }

        // 2c. Check Score Decrement (Score dropped after a previously posted goal was overturned)
        if (match.last_score && match.last_score.includes('-')) {
          const [prevHStr, prevAStr] = match.last_score.split('-');
          const prevH = parseInt(prevHStr, 10) || 0;
          const prevA = parseInt(prevAStr, 10) || 0;
          const curH = parseInt(summary.score.home, 10) || 0;
          const curA = parseInt(summary.score.away, 10) || 0;

          if ((curH < prevH || curA < prevA) && (prevH > 0 || prevA > 0)) {
            const varDropEventId = `var_drop_${match.event_id}_${curH}_${curA}`;
            let claimed = false;
            try {
              const insertLock = await env.DB.prepare(
                'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
              ).bind(match.event_id, varDropEventId, 'var_disallowed', summary.status.clock, `Score drop from ${match.last_score} to ${curH}-${curA}`).run();
              claimed = Boolean(insertLock.success);
            } catch {
              claimed = false;
            }

            if (claimed) {
              const fbVar = formatVarDisallowedPost(
                match.home_team,
                match.away_team,
                summary.score.home,
                summary.score.away,
                summary.status.clock || 'VAR',
                'Overturned by VAR',
                leagueName
              );

              const waVar = formatWhatsAppVarDisallowed(
                match.home_team,
                match.away_team,
                summary.score.home,
                summary.score.away,
                summary.status.clock || 'VAR',
                'Overturned by VAR',
                leagueName
              );

              if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
                try {
                  await facebookPoster.postNews(fbVar, undefined, env.FB_PAGE_ID, env.FB_PAGE_ACCESS_TOKEN);
                } catch (fbErr: any) {
                  console.error('FB Score Drop VAR Alert error:', fbErr.message);
                }
              }

              try {
                await whatsappPoster.postNews(
                  waVar,
                  undefined,
                  env.WHATSAPP_API_TOKEN,
                  env.WHATSAPP_CHANNEL_ID,
                  env.WHATSAPP_API_URL
                );
              } catch (waErr: any) {
                console.error('WA Score Drop VAR Alert error:', waErr.message);
              }

              try {
                await telegramPoster.postNews(
                  toTelegramCaption(waVar),
                  undefined,
                  env.TELEGRAM_BOT_TOKEN,
                  env.TELEGRAM_CHANNEL_ID
                );
              } catch (tgErr: any) {
                console.error('Telegram Score Drop VAR Alert error:', tgErr.message);
              }

              totalPosted++;
              logDetails.push(`VAR Score Decrement posted: ${match.home_team} vs ${match.away_team}`);
            }
          }
        }

        // 2d. Check Red Card Events (Skipped if results_only)
        for (const ev of summary.events) {
          const textLower = (ev.text || '').toLowerCase();
          const typeLower = (ev.type || '').toLowerCase();
          const isRedCard =
            (typeLower.includes('red') && typeLower.includes('card')) ||
            textLower.includes('red card') ||
            textLower.includes('shown the red card') ||
            typeLower.includes('second-yellow');

          if (isRedCard) {
            const redCardEventId = `red_${match.event_id}_${ev.id}`;
            let claimed = false;
            try {
              const insertLock = await env.DB.prepare(
                'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
              ).bind(match.event_id, redCardEventId, 'red_card', ev.minute, ev.text).run();
              claimed = Boolean(insertLock.success);
            } catch {
              claimed = false; // Duplicate blocked!
            }

            if (claimed) {
              const teamName =
                ev.teamId === summary.homeTeamId
                  ? match.home_team
                  : ev.teamId === summary.awayTeamId
                  ? match.away_team
                  : undefined;

              const fbRed = formatRedCardPost(
                match.home_team,
                match.away_team,
                summary.score.home,
                summary.score.away,
                ev.athleteName,
                teamName,
                ev.minute || 'Card',
                leagueName
              );

              const waRed = formatWhatsAppRedCard(
                match.home_team,
                match.away_team,
                summary.score.home,
                summary.score.away,
                ev.athleteName,
                teamName,
                ev.minute || 'Card',
                leagueName
              );

              if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
                try {
                  await facebookPoster.postNews(fbRed, undefined, env.FB_PAGE_ID, env.FB_PAGE_ACCESS_TOKEN);
                } catch (fbErr: any) {
                  console.error('FB Red Card Alert error:', fbErr.message);
                }
              }

              try {
                await whatsappPoster.postNews(
                  waRed,
                  undefined,
                  env.WHATSAPP_API_TOKEN,
                  env.WHATSAPP_CHANNEL_ID,
                  env.WHATSAPP_API_URL
                );
              } catch (waErr: any) {
                console.error('WhatsApp Red Card Alert error:', waErr.message);
              }

              try {
                await telegramPoster.postNews(
                  toTelegramCaption(waRed),
                  undefined,
                  env.TELEGRAM_BOT_TOKEN,
                  env.TELEGRAM_CHANNEL_ID
                );
              } catch (tgErr: any) {
                console.error('Telegram Red Card Alert error:', tgErr.message);
              }

              totalPosted++;
              logDetails.push(`Red Card posted: ${ev.athleteName || 'Player'} (${ev.minute}) - ${match.home_team} vs ${match.away_team}`);
            }
          }
        }
      }

      // Always update last_score in live_tracked_matches
      await env.DB.prepare(
        'UPDATE live_tracked_matches SET last_score = ? WHERE event_id = ?'
      ).bind(`${summary.score.home}-${summary.score.away}`, match.event_id).run();

      // 3. Check Half Time Stats
      if (summary.status.isHalftime) {
        const htEventId = `ht_${match.event_id}`;
        let claimed = false;
        // 1. Tier 1 (FotMob) for PL and UCL at Half Time
        let htPhotoToUse = '';
        if (match.league === 'PL' || match.league === 'UCL') {
          try {
            const isHomeLeading = (match.home_score || 0) > (match.away_score || 0);
            const isAwayLeading = (match.away_score || 0) > (match.home_score || 0);
            const leadingTeam = isHomeLeading ? match.home_team : isAwayLeading ? match.away_team : undefined;
            const trailingTeam = isHomeLeading ? match.away_team : isAwayLeading ? match.home_team : undefined;
            const isHtDraw = (match.home_score || 0) === (match.away_score || 0);

            const fotmobRes = await fotmobService.getMatchPhotos({
              homeTeam: match.home_team,
              awayTeam: match.away_team,
              winningTeam: leadingTeam,
              losingTeam: trailingTeam,
              isDraw: isHtDraw,
            });
            if (fotmobRes.bestPhoto) {
              htPhotoToUse = fotmobRes.bestPhoto;
            }
          } catch (e: any) {
            console.warn('[HT Photo] FotMob lookup error:', e.message);
          }
        }
        // Strict: NO ESPN archive photo fallback (avoids older match away jersey file photos). If no FotMob live photo, fallback directly to Scorecard Graphic!

        try {
          const insertLock = await env.DB.prepare(
            'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
          ).bind(match.event_id, htEventId, 'half_time', 'HT', htPhotoToUse).run();
          claimed = Boolean(insertLock.success);
        } catch {
          claimed = false; // Duplicate blocked!
        }

        if (claimed) {
          const goalEvents = summary.events.filter((ev: any) => ev.type.toLowerCase().includes('goal') || ev.scoringPlay);
          const scorersText = formatMatchScorersDisplay(goalEvents, summary.homeTeamId, summary.awayTeamId);

          const homeScorers = goalEvents
            .filter((ev: any) => (summary.homeTeamId && ev.teamId ? ev.teamId === summary.homeTeamId : true))
            .map((ev: any) => `${formatScorerDisplay(ev)} (${ev.minute})`)
            .join(',');

          const awayScorers = goalEvents
            .filter((ev: any) => (summary.awayTeamId && ev.teamId ? ev.teamId === summary.awayTeamId : false))
            .map((ev: any) => `${formatScorerDisplay(ev)} (${ev.minute})`)
            .join(',');

          const fbHT = formatHalfTimePost(
            match.home_team,
            match.away_team,
            summary.score.home,
            summary.score.away,
            scorersText,
            summary.stats,
            leagueName
          );

          const waHT = formatWhatsAppHalfTime(
            match.home_team,
            match.away_team,
            summary.score.home,
            summary.score.away,
            scorersText,
            summary.stats,
            leagueName
          );

          const statsSummary = summary.stats
            ? `Possession: ${summary.stats.home.possession} - ${summary.stats.away.possession}  •  Shots (Target): ${summary.stats.home.shots}(${summary.stats.home.shotsOnTarget}) - ${summary.stats.away.shots}(${summary.stats.away.shotsOnTarget})`
            : '';

          // Facebook Image: Priority #1 Match press photo; fallback to dynamic 4:3 graphic
          const fbImage =
            htPhotoToUse ||
            buildCardImageUrl({
              home: match.home_team,
              away: match.away_team,
              homeScore: summary.score.home,
              awayScore: summary.score.away,
              homeLogo: match.home_logo,
              awayLogo: match.away_logo,
              status: 'HT',
              leagueName,
              homeScorers,
              awayScorers,
              stats: summary.stats,
              channel: 'fb',
              bgImage: htPhotoToUse,
            });

          // WhatsApp Image: Priority #1 Match press photo; fallback to dynamic 4:3 graphic
          const waImage =
            htPhotoToUse ||
            buildCardImageUrl({
              home: match.home_team,
              away: match.away_team,
              homeScore: summary.score.home,
              awayScore: summary.score.away,
              homeLogo: match.home_logo,
              awayLogo: match.away_logo,
              status: 'HT',
              leagueName,
              homeScorers,
              awayScorers,
              stats: summary.stats,
              channel: 'wa',
              bgImage: htPhotoToUse,
            });

          if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
            try {
              await facebookPoster.postNews(fbHT, fbImage, env.FB_PAGE_ID, env.FB_PAGE_ACCESS_TOKEN);
            } catch (fbErr: any) {
              console.error('FB HT Stats error:', fbErr.message);
            }
          }

          try {
            await whatsappPoster.postNews(
              waHT,
              waImage,
              env.WHATSAPP_API_TOKEN,
              env.WHATSAPP_CHANNEL_ID,
              env.WHATSAPP_API_URL
            );
          } catch (waErr: any) {
            console.error('WA HT Stats error:', waErr.message);
          }

          try {
            await telegramPoster.postNews(
              toTelegramCaption(waHT),
              waImage,
              env.TELEGRAM_BOT_TOKEN,
              env.TELEGRAM_CHANNEL_ID
            );
          } catch (tgErr: any) {
            console.error('Telegram HT Stats error:', tgErr.message);
          }

          totalPosted++;
          logDetails.push(`Half Time stats posted: ${match.home_team} vs ${match.away_team}`);
        }
      }

      // 4. Check Full Time Stats & Final Result
      if (summary.status.isFullTime) {
        const ftEventId = `ft_${match.event_id}`;
        let claimed = false;
        try {
          const insertLock = await env.DB.prepare(
            'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
          ).bind(match.event_id, ftEventId, 'full_time', 'FT', 'Full Time Result & Stats').run();
          claimed = Boolean(insertLock.success);
        } catch {
          claimed = false; // Duplicate blocked!
        }

        if (claimed) {
          const goalEvents = summary.events.filter((ev: any) => ev.type.toLowerCase().includes('goal') || ev.scoringPlay);
          const scorersText = formatMatchScorersDisplay(goalEvents, summary.homeTeamId, summary.awayTeamId);

          const homeScorers = goalEvents
            .filter((ev: any) => (summary.homeTeamId && ev.teamId ? ev.teamId === summary.homeTeamId : true))
            .map((ev: any) => `${formatScorerDisplay(ev)} (${ev.minute})`)
            .join(',');

          const awayScorers = goalEvents
            .filter((ev: any) => (summary.awayTeamId && ev.teamId ? ev.teamId === summary.awayTeamId : false))
            .map((ev: any) => `${formatScorerDisplay(ev)} (${ev.minute})`)
            .join(',');

          const fbFT = formatFullTimePost(
            match.home_team,
            match.away_team,
            summary.score.home,
            summary.score.away,
            scorersText,
            summary.stats,
            leagueName
          );

          const waFT = formatWhatsAppFullTime(
            match.home_team,
            match.away_team,
            summary.score.home,
            summary.score.away,
            scorersText,
            summary.stats,
            leagueName
          );

          const statsSummary = summary.stats
            ? `Possession: ${summary.stats.home.possession} - ${summary.stats.away.possession}  •  Shots (Target): ${summary.stats.home.shots}(${summary.stats.home.shotsOnTarget}) - ${summary.stats.away.shots}(${summary.stats.away.shotsOnTarget})`
            : '';

          // Determine FT Photo:
          // Check if Half Time had a photo stored in D1
          let htPhoto = '';
          try {
            const htRow = await env.DB.prepare(
              'SELECT text FROM posted_match_events WHERE match_event_id = ?'
            ).bind(`ht_${match.event_id}`).first<{ text: string }>();
            if (htRow?.text && htRow.text.startsWith('http')) {
              htPhoto = htRow.text;
            }
          } catch {}

          // Determine FT Photo smartly based on match outcome:
          // 1) If Draw: Any match action photo is fine.
          // 2) If Winner: Strictly prioritize photos of the WINNING team and filter out photos celebrating the losing team!
          const homeScoreNum = parseInt(summary.score.home || '0', 10);
          const awayScoreNum = parseInt(summary.score.away || '0', 10);
          const isDraw = homeScoreNum === awayScoreNum;

          const winningTeamName = homeScoreNum > awayScoreNum ? match.home_team : (awayScoreNum > homeScoreNum ? match.away_team : '');
          const losingTeamName = homeScoreNum > awayScoreNum ? match.away_team : (awayScoreNum > homeScoreNum ? match.home_team : '');

          const winningScorers = goalEvents
            .filter((ev: any) => {
              if (homeScoreNum > awayScoreNum) return summary.homeTeamId && ev.teamId ? ev.teamId === summary.homeTeamId : true;
              if (awayScoreNum > homeScoreNum) return summary.awayTeamId && ev.teamId ? ev.teamId === summary.awayTeamId : true;
              return false;
            })
            .map((ev: any) => ev.athleteName)
            .filter(Boolean);

          const photoCandidates = summary.matchPhotos || (summary.matchImages || []).map((u: string) => ({ url: u, caption: '' }));

          let chosenPhoto = '';

          // 1. FotMob live match photo for PL & UCL
          const isPlOrUcl = match.league === 'PL' || match.league === 'UCL';
          if (isPlOrUcl) {
            try {
              const fotmobRes = await fotmobService.getMatchPhotos({
                homeTeam: match.home_team,
                awayTeam: match.away_team,
                winningTeam: isDraw ? undefined : winningTeamName,
                losingTeam: isDraw ? undefined : losingTeamName,
                winningScorers,
                isDraw,
              });
              // Pick best photo strictly avoiding Half Time photo!
              if (fotmobRes.bestPhoto && fotmobRes.bestPhoto !== htPhoto) {
                chosenPhoto = fotmobRes.bestPhoto;
                console.log(`[FT Photo] Selected FotMob best photo: ${chosenPhoto}`);
              } else if (fotmobRes.allPhotos && fotmobRes.allPhotos.length > 0) {
                const runnerUp = fotmobRes.allPhotos.find((p) => p !== htPhoto);
                if (runnerUp) {
                  chosenPhoto = runnerUp;
                  console.log(`[FT Photo] Selected FotMob runner-up photo: ${chosenPhoto}`);
                }
              }
            } catch (fotmobErr: any) {
              console.warn('[FT Photo] FotMob lookup error:', fotmobErr.message);
            }
          }

          // Strict: NO ESPN archive photo fallback (prevents old away jersey file photos). If no fresh FotMob photo, fallback directly to Scorecard Graphic!

          // Facebook Image: Priority #1 Match press photo; fallback to dynamic 4:3 graphic
          const fbImage =
            chosenPhoto ||
            buildCardImageUrl({
              home: match.home_team,
              away: match.away_team,
              homeScore: summary.score.home,
              awayScore: summary.score.away,
              homeLogo: match.home_logo,
              awayLogo: match.away_logo,
              status: 'FT',
              leagueName,
              homeScorers,
              awayScorers,
              stats: summary.stats,
              channel: 'fb',
              bgImage: chosenPhoto,
            });

          // WhatsApp Image: Priority #1 Match press photo; fallback to dynamic 4:3 graphic
          const waImage =
            chosenPhoto ||
            buildCardImageUrl({
              home: match.home_team,
              away: match.away_team,
              homeScore: summary.score.home,
              awayScore: summary.score.away,
              homeLogo: match.home_logo,
              awayLogo: match.away_logo,
              status: 'FT',
              leagueName,
              homeScorers,
              awayScorers,
              stats: summary.stats,
              channel: 'wa',
              bgImage: chosenPhoto,
            });

          if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
            try {
              await facebookPoster.postNews(fbFT, fbImage, env.FB_PAGE_ID, env.FB_PAGE_ACCESS_TOKEN);
            } catch (fbErr: any) {
              console.error('FB FT Stats error:', fbErr.message);
            }
          }

          try {
            await whatsappPoster.postNews(
              waFT,
              waImage,
              env.WHATSAPP_API_TOKEN,
              env.WHATSAPP_CHANNEL_ID,
              env.WHATSAPP_API_URL
            );
          } catch (waErr: any) {
            console.error('WA FT Stats error:', waErr.message);
          }

          try {
            await telegramPoster.postNews(
              toTelegramCaption(waFT),
              waImage,
              env.TELEGRAM_BOT_TOKEN,
              env.TELEGRAM_CHANNEL_ID
            );
          } catch (tgErr: any) {
            console.error('Telegram FT Stats error:', tgErr.message);
          }

          totalPosted++;
          logDetails.push(`Full Time stats posted: ${match.home_team} vs ${match.away_team}`);

          // Save chosenPhoto to D1 so Ratings post knows which photo to avoid duplicating
          if (chosenPhoto) {
            try {
              await env.DB.prepare(
                'UPDATE posted_match_events SET text = ? WHERE match_event_id = ?'
              ).bind(chosenPhoto, ftEventId).run();
            } catch {}
          }
        }

        // Auto untrack completed match (or wait for Ratings if track_ratings is enabled)
        if (Number(match.track_ratings) === 1) {
          await env.DB.prepare(
            'UPDATE live_tracked_matches SET status = "FT_WAIT_RATINGS", updated_at = CURRENT_TIMESTAMP WHERE event_id = ?'
          ).bind(match.event_id).run();
        } else {
          await env.DB.prepare(
            'UPDATE live_tracked_matches SET is_active = 0, status = "FT", updated_at = CURRENT_TIMESTAMP WHERE event_id = ?'
          ).bind(match.event_id).run();
        }
      }

      // 5. Check Player Ratings (if match.track_ratings === 1 and at least 1 minute has passed since Full Time)
      if (Number(match.track_ratings) === 1) {
        try {
          const ftRecord = await env.DB.prepare(
            'SELECT created_at, text FROM posted_match_events WHERE event_id = ? AND match_event_id = ?'
          ).bind(match.event_id, `ft_${match.event_id}`).first<{ created_at: string; text?: string }>();

          if (ftRecord?.created_at) {
            const ftTime = new Date(ftRecord.created_at).getTime();
            const elapsedSec = (Date.now() - ftTime) / 1000;

            // At least 60 seconds (1 minute) delay after FT
            if (elapsedSec >= 60) {
              const ratingsEventId = `ratings_${match.event_id}`;
              let ratingsClaimed = false;
              try {
                const insertLock = await env.DB.prepare(
                  'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
                ).bind(match.event_id, ratingsEventId, 'ratings', 'FT+1m', 'Player Ratings').run();
                ratingsClaimed = Boolean(insertLock.success);
              } catch {
                ratingsClaimed = false;
              }

              if (ratingsClaimed) {
                const ftPhoto = ftRecord.text || '';
                const ratingsRes = await fotmobService.getMatchRatings({
                  homeTeam: match.home_team,
                  awayTeam: match.away_team,
                  excludePhoto: ftPhoto,
                });

                if (ratingsRes.matchFound && ratingsRes.homeStarters.length > 0) {
                  const fbRatings = formatPlayerRatingsPost(
                    match.home_team,
                    match.away_team,
                    ratingsRes.homeStarters,
                    ratingsRes.homeSubs,
                    ratingsRes.awayStarters,
                    ratingsRes.awaySubs,
                    leagueName
                  );

                  const waRatings = formatWhatsAppRatings(
                    match.home_team,
                    match.away_team,
                    ratingsRes.homeStarters,
                    ratingsRes.homeSubs,
                    ratingsRes.awayStarters,
                    ratingsRes.awaySubs,
                    leagueName
                  );

                  // Pick a fresh photo strictly different from the Full Time photo
                  let ratingsPhoto = '';
                  if (ratingsRes.bestPhoto && ratingsRes.bestPhoto !== ftPhoto) {
                    ratingsPhoto = ratingsRes.bestPhoto;
                  } else if (ratingsRes.allPhotos && ratingsRes.allPhotos.length > 0) {
                    const runnerUp = ratingsRes.allPhotos.find((u: string) => u !== ftPhoto);
                    if (runnerUp) ratingsPhoto = runnerUp;
                  }

                  const ratingsCardImage =
                    ratingsPhoto ||
                    buildCardImageUrl({
                      home: match.home_team,
                      away: match.away_team,
                      homeScore: summary.score?.home || '0',
                      awayScore: summary.score?.away || '0',
                      homeLogo: match.home_logo,
                      awayLogo: match.away_logo,
                      status: 'FT',
                      leagueName,
                      homeScorers: '',
                      awayScorers: '',
                      channel: 'fb',
                    });

                  if (env.FB_PAGE_ID && env.FB_PAGE_ACCESS_TOKEN) {
                    try {
                      await facebookPoster.postNews(
                        fbRatings,
                        ratingsPhoto || ratingsCardImage,
                        env.FB_PAGE_ID,
                        env.FB_PAGE_ACCESS_TOKEN
                      );
                    } catch (e: any) {
                      console.error('FB Ratings post error:', e.message);
                    }
                  }

                  try {
                    await whatsappPoster.postNews(
                      waRatings,
                      ratingsPhoto || ratingsCardImage,
                      env.WHATSAPP_API_TOKEN,
                      env.WHATSAPP_CHANNEL_ID,
                      env.WHATSAPP_API_URL
                    );
                  } catch (e: any) {
                    console.error('WA Ratings post error:', e.message);
                  }

                  try {
                    await telegramPoster.postNews(
                      toTelegramCaption(waRatings),
                      ratingsPhoto || ratingsCardImage,
                      env.TELEGRAM_BOT_TOKEN,
                      env.TELEGRAM_CHANNEL_ID
                    );
                  } catch (e: any) {
                    console.error('Telegram Ratings post error:', e.message);
                  }

                  totalPosted++;
                  logDetails.push(`Player Ratings posted: ${match.home_team} vs ${match.away_team}`);
                }

                // Deactivate tracked match once ratings are posted
                await env.DB.prepare(
                  'UPDATE live_tracked_matches SET is_active = 0, status = "FT", updated_at = CURRENT_TIMESTAMP WHERE event_id = ?'
                ).bind(match.event_id).run();
              }
            }
          }
        } catch (ratingsErr: any) {
          console.error('[Ratings Post Error]:', ratingsErr.message);
        }
      }
    }

    return Response.json({
      success: true,
      posted: totalPosted,
      details: logDetails,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
