import { Env } from '../../types';
import { espnService } from '../../services/espnService';
import { facebookPoster } from '../../services/facebookPoster';
import { whatsappPoster } from '../../services/whatsappPoster';

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

#InkhelxtraLive #PremierLeague #ChampionsLeague #FootballUpdate`;
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

#InkhelxtraLive #PremierLeague #ChampionsLeague #Lineup`;
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

// Helper to format Half Time post for Facebook
function formatHalfTimePost(
  homeTeam: string,
  awayTeam: string,
  homeScore: string,
  awayScore: string,
  scorersText: string,
  stats: any,
  leagueName: string
): string {
  const scorersSection = scorersText ? `⚽ Scorers: ${scorersText}\n\n` : '';
  const statsSection = stats
    ? `📊 Match Stats (HT):
Possession: ${stats.home.possession} - ${stats.away.possession}
Shots (On Target): ${stats.home.shots} (${stats.home.shotsOnTarget}) - ${stats.away.shots} (${stats.away.shotsOnTarget})
Corners: ${stats.home.corners} - ${stats.away.corners}
Fouls: ${stats.home.fouls} - ${stats.away.fouls}\n\n`
    : '';

  return `⏸️ HALF TIME

${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${scorersSection}${statsSection}🏆 ${leagueName}

#InkhelxtraLive #PremierLeague #ChampionsLeague #HalfTime`;
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
Shots (On Target): ${stats.home.shots} (${stats.home.shotsOnTarget}) - ${stats.away.shots} (${stats.away.shotsOnTarget})
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
  const scorersSection = scorersText ? `⚽ Scorers: ${scorersText}\n\n` : '';
  const statsSection = stats
    ? `📊 Final Match Stats:
Possession: ${stats.home.possession} - ${stats.away.possession}
Shots (On Target): ${stats.home.shots} (${stats.home.shotsOnTarget}) - ${stats.away.shots} (${stats.away.shotsOnTarget})
Corners: ${stats.home.corners} - ${stats.away.corners}
Fouls: ${stats.home.fouls} - ${stats.away.fouls}\n\n`
    : '';

  return `🏁 FULL TIME RESULT!

${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${scorersSection}${statsSection}🏆 ${leagueName}

#InkhelxtraLive #PremierLeague #ChampionsLeague #FullTime`;
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
Shots (On Target): ${stats.home.shots} (${stats.home.shotsOnTarget}) - ${stats.away.shots} (${stats.away.shotsOnTarget})
Corners: ${stats.home.corners} - ${stats.away.corners}
Fouls: ${stats.home.fouls} - ${stats.away.fouls}\n\n`
    : '';

  return `🏁 *FULL TIME RESULT!*

*${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}*
${scorersSection}${statsSection}🏆 *${leagueName}*

👉 _Inkhel WhatsApp Channel_`;
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
      const leagueSlug = match.league === 'UCL' ? 'uefa.champions' : 'eng.1';
      const leagueName = match.league === 'UCL' ? 'UEFA Champions League' : 'Premier League';

      let summary;
      try {
        summary = await espnService.getMatchSummary(leagueSlug, match.event_id);
      } catch (err: any) {
        console.warn(`Summary error for ${match.event_id}:`, err.message);
        continue;
      }

      // 1. Check Confirmed Lineups: Auto-Post if announced before kickoff (or at match start)
      if (summary.lineups && (summary.status.state === 'pre' || match.status !== 'FT')) {
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

            totalPosted++;
            logDetails.push(`Lineup posted: ${match.home_team} vs ${match.away_team}`);
          }
        }
      }

      // 2. Check all events in this match (Goals)
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

            // New Goal! Auto-Post to Inkhel Xtra Facebook + WhatsApp Channel!
            const fbCaption = formatGoalPost(
              match.home_team,
              match.away_team,
              String(finalHomeScore),
              String(finalAwayScore),
              ev.athleteName,
              ev.minute || 'Goal',
              leagueName
            );

            const waCaption = formatWhatsAppGoal(
              match.home_team,
              match.away_team,
              String(finalHomeScore),
              String(finalAwayScore),
              ev.athleteName,
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

            totalPosted++;
            logDetails.push(`Goal posted: ${ev.athleteName || 'Goal'} (${ev.minute}) - ${match.home_team} vs ${match.away_team}`);
          }
        }
      }

      // 3. Check Half Time Stats
      if (summary.status.isHalftime) {
        const htEventId = `ht_${match.event_id}`;
        let claimed = false;
        const htPhotoToUse = summary.matchImages?.[0] || summary.matchImage || '';
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
          const scorersText = goalEvents.map((ev: any) => `${ev.athleteName || 'Goal'} (${ev.minute})`).join(', ');

          const homeScorers = goalEvents
            .filter((ev: any) => (summary.homeTeamId && ev.teamId ? ev.teamId === summary.homeTeamId : true))
            .map((ev: any) => `${ev.athleteName || 'Goal'} (${ev.minute})`)
            .join(',');

          const awayScorers = goalEvents
            .filter((ev: any) => (summary.awayTeamId && ev.teamId ? ev.teamId === summary.awayTeamId : false))
            .map((ev: any) => `${ev.athleteName || 'Goal'} (${ev.minute})`)
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
            `https://api.microlink.io/?url=${encodeURIComponent(
              `https://xtra-byd.pages.dev/api/live/card?home=${encodeURIComponent(match.home_team)}&away=${encodeURIComponent(
                match.away_team
              )}&homeScore=${summary.score.home}&awayScore=${summary.score.away}&status=HT&league=${encodeURIComponent(
                leagueName
              )}&homeScorers=${encodeURIComponent(homeScorers)}&awayScorers=${encodeURIComponent(
                awayScorers
              )}&homeLogo=${encodeURIComponent(match.home_logo || '')}&awayLogo=${encodeURIComponent(
                match.away_logo || ''
              )}&stats=${encodeURIComponent(statsSummary)}&channel=fb`
            )}&screenshot=true&embed=screenshot.url&viewport.width=1200&viewport.height=900`;

          // WhatsApp Image: Priority #1 Match press photo; fallback to dynamic 4:3 graphic
          const waImage =
            htPhotoToUse ||
            `https://api.microlink.io/?url=${encodeURIComponent(
              `https://xtra-byd.pages.dev/api/live/card?home=${encodeURIComponent(match.home_team)}&away=${encodeURIComponent(
                match.away_team
              )}&homeScore=${summary.score.home}&awayScore=${summary.score.away}&status=HT&league=${encodeURIComponent(
                leagueName
              )}&homeScorers=${encodeURIComponent(homeScorers)}&awayScorers=${encodeURIComponent(
                awayScorers
              )}&homeLogo=${encodeURIComponent(match.home_logo || '')}&awayLogo=${encodeURIComponent(
                match.away_logo || ''
              )}&stats=${encodeURIComponent(statsSummary)}&channel=wa`
            )}&screenshot=true&embed=screenshot.url&viewport.width=1200&viewport.height=900`;

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
          const scorersText = goalEvents.map((ev: any) => `${ev.athleteName || 'Goal'} (${ev.minute})`).join(', ');

          const homeScorers = goalEvents
            .filter((ev: any) => (summary.homeTeamId && ev.teamId ? ev.teamId === summary.homeTeamId : true))
            .map((ev: any) => `${ev.athleteName || 'Goal'} (${ev.minute})`)
            .join(',');

          const awayScorers = goalEvents
            .filter((ev: any) => (summary.awayTeamId && ev.teamId ? ev.teamId === summary.awayTeamId : false))
            .map((ev: any) => `${ev.athleteName || 'Goal'} (${ev.minute})`)
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

          const availablePhotos = summary.matchImages || (summary.matchImage ? [summary.matchImage] : []);
          // Prefer a photo that is different from Half Time photo
          const diffPhoto = availablePhotos.find((p) => p !== htPhoto);
          // If a new/different photo exists, use it! Otherwise, reuse the match photo (as requested)
          const chosenPhoto = diffPhoto || availablePhotos[0] || summary.matchImage || '';

          // Facebook Image: Priority #1 Match press photo; fallback to dynamic 4:3 graphic
          const fbImage =
            chosenPhoto ||
            `https://api.microlink.io/?url=${encodeURIComponent(
              `https://xtra-byd.pages.dev/api/live/card?home=${encodeURIComponent(match.home_team)}&away=${encodeURIComponent(
                match.away_team
              )}&homeScore=${summary.score.home}&awayScore=${summary.score.away}&status=FT&league=${encodeURIComponent(
                leagueName
              )}&homeScorers=${encodeURIComponent(homeScorers)}&awayScorers=${encodeURIComponent(
                awayScorers
              )}&homeLogo=${encodeURIComponent(match.home_logo || '')}&awayLogo=${encodeURIComponent(
                match.away_logo || ''
              )}&stats=${encodeURIComponent(statsSummary)}&channel=fb`
            )}&screenshot=true&embed=screenshot.url&viewport.width=1200&viewport.height=900`;

          // WhatsApp Image: Priority #1 Match press photo; fallback to dynamic 4:3 graphic
          const waImage =
            chosenPhoto ||
            `https://api.microlink.io/?url=${encodeURIComponent(
              `https://xtra-byd.pages.dev/api/live/card?home=${encodeURIComponent(match.home_team)}&away=${encodeURIComponent(
                match.away_team
              )}&homeScore=${summary.score.home}&awayScore=${summary.score.away}&status=FT&league=${encodeURIComponent(
                leagueName
              )}&homeScorers=${encodeURIComponent(homeScorers)}&awayScorers=${encodeURIComponent(
                awayScorers
              )}&homeLogo=${encodeURIComponent(match.home_logo || '')}&awayLogo=${encodeURIComponent(
                match.away_logo || ''
              )}&stats=${encodeURIComponent(statsSummary)}&channel=wa`
            )}&screenshot=true&embed=screenshot.url&viewport.width=1200&viewport.height=900`;

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

          totalPosted++;
          logDetails.push(`Full Time stats posted: ${match.home_team} vs ${match.away_team}`);
        }

        // Auto untrack completed match
        await env.DB.prepare(
          'UPDATE live_tracked_matches SET is_active = 0, status = "FT", updated_at = CURRENT_TIMESTAMP WHERE event_id = ?'
        ).bind(match.event_id).run();
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
