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

🔴 ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam} 🔵

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

${scorerLine}🏆 *${leagueName}*`;
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

      // Check all events in this match
      for (const ev of summary.events) {
        if (ev.type.toLowerCase().includes('goal') || ev.scoringPlay) {
          // Check if we already posted this event
          const alreadyPosted = await env.DB.prepare(
            'SELECT id FROM posted_match_events WHERE match_event_id = ?'
          ).bind(ev.id).first();

          if (!alreadyPosted) {
            // New Goal! Auto-Post to Inkhel Xtra Facebook + WhatsApp Channel!
            const fbCaption = formatGoalPost(
              match.home_team,
              match.away_team,
              summary.score.home,
              summary.score.away,
              ev.athleteName,
              ev.minute || 'Goal',
              leagueName
            );

            const waCaption = formatWhatsAppGoal(
              match.home_team,
              match.away_team,
              summary.score.home,
              summary.score.away,
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

            // Save to posted_match_events in D1 so it never duplicates
            await env.DB.prepare(
              'INSERT INTO posted_match_events (event_id, match_event_id, event_type, minute, text) VALUES (?, ?, ?, ?, ?)'
            ).bind(match.event_id, ev.id, 'goal', ev.minute, ev.text).run();

            totalPosted++;
            logDetails.push(`Goal posted: ${ev.athleteName || 'Goal'} (${ev.minute}) - ${match.home_team} vs ${match.away_team}`);
          }
        }
      }

      // If match is completed, auto untrack
      if (summary.status.state === 'post') {
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
