export interface EspnMatch {
  id: string;
  league: 'PL' | 'UCL';
  leagueName: string;
  name: string;
  shortName: string;
  date: string;
  statusState: 'pre' | 'in' | 'post';
  statusDetail: string;
  displayClock: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    abbreviation: string;
    logo: string;
    score: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    abbreviation: string;
    logo: string;
    score: string;
  };
  isTracked?: boolean;
}

export interface MatchEvent {
  id: string;
  type: string;
  text: string;
  minute: string;
  teamId?: string;
  athleteName?: string;
  scoringPlay: boolean;
}

export const espnService = {
  // Fetch upcoming & today's Premier League and Champions League matches
  async getFixtures(): Promise<EspnMatch[]> {
    const leagues: { key: 'PL' | 'UCL'; slug: string; name: string }[] = [
      { key: 'PL', slug: 'eng.1', name: 'Premier League' },
      { key: 'UCL', slug: 'uefa.champions', name: 'UEFA Champions League' },
    ];

    const allMatches: EspnMatch[] = [];

    for (const l of leagues) {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.slug}/scoreboard`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
        );
        if (!res.ok) continue;

        const data = (await res.json()) as any;
        const events = data.events || [];

        for (const ev of events) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;

          const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
          const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
          if (!home || !away) continue;

          allMatches.push({
            id: ev.id,
            league: l.key,
            leagueName: l.name,
            name: ev.name,
            shortName: ev.shortName,
            date: ev.date,
            statusState: comp.status?.type?.state || 'pre',
            statusDetail: comp.status?.type?.shortDetail || comp.status?.type?.description || 'Scheduled',
            displayClock: comp.status?.displayClock || "0'",
            homeTeam: {
              id: home.team?.id || '',
              name: home.team?.displayName || 'Home Team',
              shortName: home.team?.shortDisplayName || home.team?.name || 'Home',
              abbreviation: home.team?.abbreviation || 'HOM',
              logo: home.team?.logo || '',
              score: home.score || '0',
            },
            awayTeam: {
              id: away.team?.id || '',
              name: away.team?.displayName || 'Away Team',
              shortName: away.team?.shortDisplayName || away.team?.name || 'Away',
              abbreviation: away.team?.abbreviation || 'AWY',
              logo: away.team?.logo || '',
              score: away.score || '0',
            },
          });
        }
      } catch (err) {
        console.warn(`ESPN fetch error for ${l.key}:`, err);
      }
    }

    return allMatches;
  },

  // Fetch live match events (goals, cards, period changes) for a specific match
  async getMatchSummary(leagueSlug: string, eventId: string): Promise<{
    score: { home: string; away: string };
    status: { state: string; clock: string; detail: string };
    events: MatchEvent[];
  }> {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/summary?event=${eventId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch summary for event ${eventId}`);
    }

    const data = (await res.json()) as any;
    const comp = data.header?.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');

    const keyEvents = data.keyEvents || [];
    const events: MatchEvent[] = keyEvents.map((ke: any) => ({
      id: String(ke.id),
      type: ke.type?.type || 'event',
      text: ke.text || '',
      minute: ke.clock?.displayValue || '',
      teamId: ke.team?.id,
      athleteName: ke.participants?.[0]?.athlete?.displayName,
      scoringPlay: Boolean(ke.scoringPlay),
    }));

    return {
      score: {
        home: home?.score || '0',
        away: away?.score || '0',
      },
      status: {
        state: comp?.status?.type?.state || 'pre',
        clock: comp?.status?.displayClock || "0'",
        detail: comp?.status?.type?.shortDetail || '',
      },
      events,
    };
  },
};
