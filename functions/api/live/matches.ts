import { Env } from '../../types';
import { espnService, EspnMatch } from '../../services/espnService';
import { facebookPoster } from '../../services/facebookPoster';
import { whatsappPoster } from '../../services/whatsappPoster';

// GET /api/live/matches -> Returns fixtures with tracked state
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const fixtures = await espnService.getFixtures();

    // Query currently tracked matches in D1
    const { results: tracked } = await env.DB.prepare(
      'SELECT event_id, is_active FROM live_tracked_matches WHERE is_active = 1'
    ).all<{ event_id: string; is_active: number }>();

    const trackedSet = new Set((tracked || []).map((t) => t.event_id));

    const enriched = fixtures.map((f) => ({
      ...f,
      isTracked: trackedSet.has(f.id),
    }));

    return Response.json({ success: true, matches: enriched });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

// POST /api/live/matches -> Toggle tracking a match { eventId, league, homeTeam, awayTeam, isTracked }
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      eventId: string;
      league: 'PL' | 'UCL';
      homeTeam: string;
      awayTeam: string;
      homeLogo?: string;
      awayLogo?: string;
      matchTime?: string;
      isTracked: boolean;
    };

    if (!body.eventId) {
      return Response.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    if (body.isTracked) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO live_tracked_matches 
        (event_id, league, home_team, away_team, home_logo, away_logo, match_time, is_active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`
      ).bind(
        body.eventId,
        body.league,
        body.homeTeam,
        body.awayTeam,
        body.homeLogo || null,
        body.awayLogo || null,
        body.matchTime || null
      ).run();
    } else {
      await env.DB.prepare(
        'UPDATE live_tracked_matches SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?'
      ).bind(body.eventId).run();
    }

    return Response.json({ success: true, eventId: body.eventId, isTracked: body.isTracked });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};
