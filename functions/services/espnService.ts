export interface EspnMatch {
  id: string;
  league: 'PL' | 'UCL' | 'ISL';
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
  isOwnGoal?: boolean;
  isPenalty?: boolean;
}

function formatEspnDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export const espnService = {
  // Fetch upcoming 24h schedule & active live matches for PL, UCL, and ISL (excluding finished FT matches)
  async getFixtures(): Promise<EspnMatch[]> {
    const leagues: { key: 'PL' | 'UCL' | 'ISL'; slug: string; name: string }[] = [
      { key: 'PL', slug: 'eng.1', name: 'PL' },
      { key: 'UCL', slug: 'uefa.champions', name: 'UCL' },
      { key: 'ISL', slug: 'ind.1', name: 'ISL' },
    ];

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const dYesterday = formatEspnDate(yesterday);
    const dToday = formatEspnDate(now);
    const dTomorrow = formatEspnDate(tomorrow);
    const dDayAfter = formatEspnDate(dayAfter);

    const allMatches: EspnMatch[] = [];
    const seenIds = new Set<string>();

    for (const l of leagues) {
      const endpoints = [
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.slug}/scoreboard?dates=${dToday}`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.slug}/scoreboard?dates=${dTomorrow}`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.slug}/scoreboard?dates=${dDayAfter}`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.slug}/scoreboard?dates=${dYesterday}`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.slug}/scoreboard`,
      ];

      try {
        const responses = await Promise.all(
          endpoints.map((ep) =>
            fetch(ep, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            })
              .then((r) => (r.ok ? ((r.json() as unknown) as any) : null))
              .catch(() => null)
          )
        );

        for (const data of responses) {
          if (!data) continue;
          const events = data.events || [];

          for (const ev of events) {
            if (seenIds.has(ev.id)) continue;

            const comp = ev.competitions?.[0];
            if (!comp) continue;

            const state = comp.status?.type?.state || 'pre';
            // Automatically hide/exclude full time matches as requested
            if (state === 'post') continue;

            const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
            const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
            if (!home || !away) continue;

            seenIds.add(ev.id);
            allMatches.push({
              id: ev.id,
              league: l.key,
              leagueName: l.name,
              name: ev.name,
              shortName: ev.shortName,
              date: ev.date,
              statusState: state,
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
        }
      } catch (err: any) {
        console.warn(`ESPN fetch error for ${l.key}:`, err.message);
      }
    }

    // Sort: Live matches first, then chronological by kickoff time
    return allMatches.sort((a, b) => {
      if (a.statusState === 'in' && b.statusState !== 'in') return -1;
      if (b.statusState === 'in' && a.statusState !== 'in') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  },

  // Fetch live match events (goals, cards, period changes), confirmed lineups and stats for a specific match
  async getMatchSummary(leagueSlug: string, eventId: string): Promise<{
    score: { home: string; away: string };
    homeTeamId?: string;
    awayTeamId?: string;
    status: {
      state: string;
      clock: string;
      detail: string;
      isHalftime: boolean;
      isFullTime: boolean;
    };
    events: MatchEvent[];
    lineups?: {
      home: { team: string; formation?: string; starters: string[] };
      away: { team: string; formation?: string; starters: string[] };
    };
    stats?: {
      home: { possession: string; shots: string; shotsOnTarget: string; corners: string; fouls: string; yellowCards?: string; redCards?: string };
      away: { possession: string; shots: string; shotsOnTarget: string; corners: string; fouls: string; yellowCards?: string; redCards?: string };
    };
    matchImage?: string;
    matchImages?: string[];
    matchPhotos?: { url: string; caption: string }[];
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
    const events: MatchEvent[] = keyEvents.map((ke: any) => {
      const typeType = (ke.type?.type || '').toLowerCase();
      const typeText = (ke.type?.text || '').toLowerCase();
      const eventText = (ke.text || '').toLowerCase();

      const isOwnGoal =
        typeType.includes('own-goal') ||
        typeText.includes('own goal') ||
        eventText.includes('own goal') ||
        eventText.includes('(og)') ||
        eventText.includes(' og ');

      const isPenalty =
        typeType.includes('penalty-kick') ||
        typeText.includes('penalty') ||
        (eventText.includes('penalty') && !eventText.includes('missed') && !eventText.includes('saved'));

      let athleteName = ke.participants?.[0]?.athlete?.displayName || ke.participants?.[0]?.athlete?.shortName;
      if (!athleteName && isOwnGoal) {
        const ogMatch = ke.text?.match(/own goal by ([^,.]+)/i);
        if (ogMatch) athleteName = ogMatch[1].trim();
      }

      if (athleteName) {
        if (isOwnGoal && !athleteName.toLowerCase().includes('(og)')) {
          athleteName = `${athleteName} (OG)`;
        } else if (isPenalty && !athleteName.toLowerCase().includes('(p)') && !athleteName.toLowerCase().includes('(pen)')) {
          athleteName = `${athleteName} (Pen)`;
        }
      }

      return {
        id: String(ke.id),
        type: ke.type?.type || 'event',
        text: ke.text || '',
        minute: ke.clock?.displayValue || '',
        teamId: ke.team?.id,
        athleteName,
        scoringPlay: Boolean(ke.scoringPlay),
        isOwnGoal,
        isPenalty,
      };
    });

    // Extract official confirmed lineups if available (Both teams must have 11 starters)
    let lineups: {
      home: { team: string; formation?: string; starters: string[] };
      away: { team: string; formation?: string; starters: string[] };
    } | undefined = undefined;

    if (Array.isArray(data.rosters) && data.rosters.length >= 2) {
      const homeRoster =
        data.rosters.find((r: any) => (home?.team?.id && r.team?.id === home.team.id) || r.homeAway === 'home') ||
        data.rosters[0];
      const awayRoster =
        data.rosters.find((r: any) => (away?.team?.id && r.team?.id === away.team.id) || r.homeAway === 'away') ||
        data.rosters[1];

      const homeStarters = (homeRoster?.roster || [])
        .filter((p: any) => p.starter)
        .map((p: any) => p.athlete?.displayName || p.athlete?.shortName)
        .filter(Boolean);

      const awayStarters = (awayRoster?.roster || [])
        .filter((p: any) => p.starter)
        .map((p: any) => p.athlete?.displayName || p.athlete?.shortName)
        .filter(Boolean);

      if (homeStarters.length === 11 && awayStarters.length === 11) {
        lineups = {
          home: {
            team: homeRoster.team?.displayName || home?.team?.displayName || 'Home Team',
            formation: homeRoster.formation,
            starters: homeStarters,
          },
          away: {
            team: awayRoster.team?.displayName || away?.team?.displayName || 'Away Team',
            formation: awayRoster.formation,
            starters: awayStarters,
          },
        };
      }
    }

    // Extract match statistics (Possession, Shots, Shots on target, Corners, Fouls)
    let stats: {
      home: { possession: string; shots: string; shotsOnTarget: string; corners: string; fouls: string; yellowCards?: string; redCards?: string };
      away: { possession: string; shots: string; shotsOnTarget: string; corners: string; fouls: string; yellowCards?: string; redCards?: string };
    } | undefined = undefined;

    const boxTeams = data.boxscore?.teams;
    if (Array.isArray(boxTeams) && boxTeams.length >= 2) {
      const getStat = (t: any, name: string) => {
        return String(t?.statistics?.find((s: any) => s.name === name)?.displayValue || '0');
      };

      const homeBox = boxTeams.find((t: any) => (home?.team?.id && t.team?.id === home.team.id) || t.homeAway === 'home') || boxTeams[0];
      const awayBox = boxTeams.find((t: any) => (away?.team?.id && t.team?.id === away.team.id) || t.homeAway === 'away') || boxTeams[1];

      const homePoss = getStat(homeBox, 'possessionPct');
      const awayPoss = getStat(awayBox, 'possessionPct');

      stats = {
        home: {
          possession: homePoss.includes('%') ? homePoss : `${Math.round(parseFloat(homePoss) || 50)}%`,
          shots: getStat(homeBox, 'totalShots'),
          shotsOnTarget: getStat(homeBox, 'shotsOnTarget'),
          corners: getStat(homeBox, 'wonCorners'),
          fouls: getStat(homeBox, 'foulsCommitted'),
          yellowCards: getStat(homeBox, 'yellowCards'),
          redCards: getStat(homeBox, 'redCards'),
        },
        away: {
          possession: awayPoss.includes('%') ? awayPoss : `${Math.round(parseFloat(awayPoss) || 50)}%`,
          shots: getStat(awayBox, 'totalShots'),
          shotsOnTarget: getStat(awayBox, 'shotsOnTarget'),
          corners: getStat(awayBox, 'wonCorners'),
          fouls: getStat(awayBox, 'foulsCommitted'),
          yellowCards: getStat(awayBox, 'yellowCards'),
          redCards: getStat(awayBox, 'redCards'),
        },
      };
    }

    const statusType = comp?.status?.type || {};
    const statusState = statusType.state || 'pre';
    const statusName = statusType.name || '';
    const statusDesc = statusType.description || '';
    const shortDetail = statusType.shortDetail || '';

    const isHalftime =
      statusName === 'STATUS_HALFTIME' ||
      statusDesc.toLowerCase() === 'halftime' ||
      statusDesc.toLowerCase() === 'half time' ||
      shortDetail === 'HT';

    const isFullTime =
      statusState === 'post' ||
      statusName === 'STATUS_FINAL' ||
      shortDetail === 'FT' ||
      statusDesc.toLowerCase() === 'full time' ||
      statusDesc.toLowerCase() === 'final';

    // Extract match photos strictly from ESPN match recap article or verified match articles
    const matchImages: string[] = [];
    const matchPhotos: { url: string; caption: string }[] = [];

    // 1. Check official dedicated match recap article (data.article)
    if (data.article && Array.isArray(data.article.images)) {
      for (const img of data.article.images) {
        if (img?.url && !matchImages.includes(img.url)) {
          matchImages.push(img.url);
          matchPhotos.push({
            url: img.url,
            caption: `${img.caption || img.name || ''} ${data.article.headline || ''}`.trim(),
          });
        }
      }
    }

    // 2. Check data.news.articles with strict match checking
    if (Array.isArray(data.news?.articles)) {
      const homeName = (home?.team?.displayName || '').toLowerCase().trim();
      const awayName = (away?.team?.displayName || '').toLowerCase().trim();
      const homeShort = (home?.team?.shortDisplayName || '').toLowerCase().trim();
      const awayShort = (away?.team?.shortDisplayName || '').toLowerCase().trim();

      for (const a of data.news.articles) {
        const headline = (a.headline || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        const combined = `${headline} ${desc}`;

        // Strict matching: Must mention both teams, OR one team with match clash keywords
        const mentionsHome = (homeName && combined.includes(homeName)) || (homeShort && combined.includes(homeShort));
        const mentionsAway = (awayName && combined.includes(awayName)) || (awayShort && combined.includes(awayShort));
        const hasMatchKeywords = /vs|against|beat|draw|drew|win|won|defeat|clash|equaliser|held/i.test(combined);

        const isMatch = (mentionsHome && mentionsAway) || ((mentionsHome || mentionsAway) && hasMatchKeywords);

        if (isMatch && Array.isArray(a.images)) {
          for (const img of a.images) {
            if (img?.url && !matchImages.includes(img.url)) {
              matchImages.push(img.url);
              matchPhotos.push({
                url: img.url,
                caption: `${img.caption || img.name || ''} ${a.headline || ''}`.trim(),
              });
            }
          }
        }
      }
    }

    const matchImage = matchImages[0] || undefined;

    return {
      score: {
        home: home?.score || '0',
        away: away?.score || '0',
      },
      homeTeamId: home?.team?.id,
      awayTeamId: away?.team?.id,
      status: {
        state: statusState,
        clock: comp?.status?.displayClock || "0'",
        detail: shortDetail || statusDesc || '',
        isHalftime,
        isFullTime,
      },
      events,
      lineups,
      stats,
      matchImage,
      matchImages,
      matchPhotos,
    };
  },
};
