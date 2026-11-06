import { Env } from '../../types';
import { espnService, EspnMatch } from '../../services/espnService';
import { facebookPoster } from '../../services/facebookPoster';
import { whatsappPoster } from '../../services/whatsappPoster';

// GET /api/live/matches -> Returns fixtures with tracked state
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const fixtures = await espnService.getFixtures();

    // Query currently tracked matches in D1 with track_mode, track_ratings, and manual photos
    const { results: tracked } = await env.DB.prepare(
      'SELECT event_id, is_active, track_mode, track_ratings, manual_ht_photo, manual_ft_photo FROM live_tracked_matches'
    ).all<{
      event_id: string;
      is_active: number;
      track_mode?: string;
      track_ratings?: number;
      manual_ht_photo?: string;
      manual_ft_photo?: string;
    }>();

    const trackedMap = new Map(
      (tracked || []).map((t) => [
        t.event_id,
        {
          isActive: Boolean(t.is_active),
          mode: t.track_mode || 'full',
          trackRatings: Boolean(t.track_ratings),
          manualHtPhoto: t.manual_ht_photo || '',
          manualFtPhoto: t.manual_ft_photo || '',
        },
      ])
    );

    const enriched = fixtures.map((f) => {
      const trackInfo = trackedMap.get(f.id) || null;
      return {
        ...f,
        isTracked: trackInfo ? trackInfo.isActive : false,
        trackMode: trackInfo ? trackInfo.mode : null,
        trackRatings: trackInfo ? trackInfo.trackRatings : false,
        manualHtPhoto: trackInfo ? trackInfo.manualHtPhoto : '',
        manualFtPhoto: trackInfo ? trackInfo.manualFtPhoto : '',
      };
    });

    return Response.json({ success: true, matches: enriched });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

// POST /api/live/matches -> Toggle tracking a match OR update manual HT/FT photos
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      eventId: string;
      league?: 'PL' | 'UCL' | 'ISL' | 'LL' | 'EFL' | 'BL' | 'IL';
      homeTeam?: string;
      awayTeam?: string;
      homeLogo?: string;
      awayLogo?: string;
      matchTime?: string;
      isTracked?: boolean;
      trackMode?: 'full' | 'results_only';
      trackRatings?: boolean;
      manualHtPhoto?: string;
      manualFtPhoto?: string;
      action?: 'toggle_track' | 'save_photos';
    };

    if (!body.eventId) {
      return Response.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    // 1. Photo-only update action
    if (body.action === 'save_photos' || (body.manualHtPhoto !== undefined && body.manualFtPhoto !== undefined && body.isTracked === undefined)) {
      await env.DB.prepare(
        `INSERT INTO live_tracked_matches 
        (event_id, league, home_team, away_team, home_logo, away_logo, match_time, is_active, track_mode, track_ratings, manual_ht_photo, manual_ft_photo, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'full', 0, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(event_id) DO UPDATE SET
          manual_ht_photo = excluded.manual_ht_photo,
          manual_ft_photo = excluded.manual_ft_photo,
          home_team = COALESCE(excluded.home_team, live_tracked_matches.home_team),
          away_team = COALESCE(excluded.away_team, live_tracked_matches.away_team),
          updated_at = CURRENT_TIMESTAMP`
      ).bind(
        body.eventId,
        body.league || 'PL',
        body.homeTeam || '',
        body.awayTeam || '',
        body.homeLogo || null,
        body.awayLogo || null,
        body.matchTime || null,
        body.manualHtPhoto || null,
        body.manualFtPhoto || null
      ).run();

      return Response.json({
        success: true,
        eventId: body.eventId,
        manualHtPhoto: body.manualHtPhoto || '',
        manualFtPhoto: body.manualFtPhoto || '',
      });
    }

    // 2. Tracking toggle action
    if (body.isTracked) {
      const mode = body.trackMode || 'full';
      const ratingsVal = body.trackRatings ? 1 : 0;

      await env.DB.prepare(
        `INSERT INTO live_tracked_matches 
        (event_id, league, home_team, away_team, home_logo, away_logo, match_time, is_active, track_mode, track_ratings, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(event_id) DO UPDATE SET
          is_active = 1,
          track_mode = excluded.track_mode,
          track_ratings = excluded.track_ratings,
          updated_at = CURRENT_TIMESTAMP`
      ).bind(
        body.eventId,
        body.league || 'PL',
        body.homeTeam || '',
        body.awayTeam || '',
        body.homeLogo || null,
        body.awayLogo || null,
        body.matchTime || null,
        mode,
        ratingsVal
      ).run();
    } else {
      await env.DB.prepare(
        'UPDATE live_tracked_matches SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?'
      ).bind(body.eventId).run();
    }

    return Response.json({
      success: true,
      eventId: body.eventId,
      isTracked: body.isTracked,
      trackMode: body.trackMode || null,
      trackRatings: Boolean(body.trackRatings),
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};
