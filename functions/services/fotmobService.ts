export interface FotmobMatchResult {
  bestPhoto?: string;
  allPhotos: string[];
  potm?: {
    name: string;
    rating: string;
    team: string;
  };
}

export interface PlayerRatingItem {
  name: string;
  rating?: string;
}

export interface MatchRatingsResult {
  matchFound: boolean;
  homeTeam: string;
  awayTeam: string;
  homeStarters: PlayerRatingItem[];
  homeSubs: PlayerRatingItem[];
  awayStarters: PlayerRatingItem[];
  awaySubs: PlayerRatingItem[];
  potm?: {
    name: string;
    rating: string;
    team: string;
  };
  bestPhoto?: string;
  allPhotos: string[];
}

interface PhotoCandidate {
  url: string;
  title: string;
  text: string;
  elapsed?: number;
  source: 'commentary' | 'content';
}

export const fotmobService = {
  /**
   * Fetch high-resolution pitch-side action photos and POTM from FotMob
   * Priority #1 for Premier League and Champions League matches
   * Includes FotMob Live Ticker Commentary (LTC) photos from IMAGO / pitch-side
   */
  async getMatchPhotos(options: {
    homeTeam: string;
    awayTeam: string;
    dateStr?: string; // YYYYMMDD e.g. 20261024
    winningTeam?: string;
    losingTeam?: string;
    winningScorers?: string[];
    isDraw?: boolean;
  }): Promise<FotmobMatchResult> {
    try {
      // 1. Determine date string in YYYYMMDD
      let date = options.dateStr;
      if (!date) {
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        date = `${y}${m}${d}`;
      }

      // 2. Fetch matches list for the day
      const res = await fetch(`https://www.fotmob.com/api/data/matches?date=${date}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (!res.ok) {
        console.warn(`FotMob matches request failed with status: ${res.status}`);
        return { allPhotos: [] };
      }

      const data = (await res.json()) as any;
      const allMatches: any[] = [];
      if (Array.isArray(data.leagues)) {
        for (const league of data.leagues) {
          if (Array.isArray(league.matches)) {
            allMatches.push(...league.matches);
          }
        }
      }

      // 3. Match search by normalized team names
      const norm = (s: string) =>
        (s || '')
          .toLowerCase()
          .replace(/fc|afc|cf|sc|club/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();

      const hNorm = norm(options.homeTeam);
      const aNorm = norm(options.awayTeam);

      const matched = allMatches.find((m) => {
        const mh = norm(m.home?.name || '');
        const ma = norm(m.away?.name || '');
        const direct = (mh.includes(hNorm) || hNorm.includes(mh)) && (ma.includes(aNorm) || aNorm.includes(ma));
        const reverse = (mh.includes(aNorm) || aNorm.includes(mh)) && (ma.includes(hNorm) || hNorm.includes(ma));
        return direct || reverse;
      });

      if (!matched?.id) {
        console.log(`FotMob match not found for ${options.homeTeam} vs ${options.awayTeam} on ${date}`);
        return { allPhotos: [] };
      }

      // 4. Fetch Match Details & Live Commentary in parallel
      const [detailsRes, ltcRes] = await Promise.all([
        fetch(`https://www.fotmob.com/api/data/matchDetails?matchId=${matched.id}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
          },
        }).catch(() => null),
        fetch(`https://data.fotmob.com/webcl/ltc/gsm/${matched.id}_en.json.gz`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }).catch(() => null),
      ]);

      const candidates: PhotoCandidate[] = [];

      // 5. Extract Live Commentary Photos (IMAGO / pitch-side photos uploaded in real-time)
      if (ltcRes && ltcRes.ok) {
        try {
          const ltcData = (await ltcRes.json()) as any;
          const pulseItems = ltcData.PulseInfo?.Items || [];
          for (const item of pulseItems) {
            const imgContent = item.Content?.find((c: any) => c.Type === 'image' && c.Media?.[0]?.Url);
            if (imgContent?.Media?.[0]?.Url) {
              const url = imgContent.Media[0].Url;
              const title = item.Content?.find((c: any) => c.Type === 'title')?.Translations?.en || '';
              const text = item.Content?.find((c: any) => c.Type === 'text')?.Translations?.en || '';
              candidates.push({
                url,
                title,
                text,
                elapsed: item.Elapsed,
                source: 'commentary',
              });
            }
          }
        } catch (e: any) {
          console.warn('[FotMob LTC] Failed to parse commentary:', e.message);
        }
      }

      // 6. Extract Player of the Match (POTM) & content photos from Match Details
      let potm: { name: string; rating: string; team: string } | undefined = undefined;

      if (detailsRes && detailsRes.ok) {
        try {
          const detailsData = (await detailsRes.json()) as any;
          const content = detailsData.content || {};

          const potmRaw = content.matchFacts?.playerOfTheMatch;
          if (potmRaw?.name) {
            potm = {
              name: potmRaw.name.fullName || `${potmRaw.name.firstName || ''} ${potmRaw.name.lastName || ''}`.trim(),
              rating: String(potmRaw.rating?.num || ''),
              team: potmRaw.teamName || '',
            };
          }

          const contentStr = JSON.stringify(content);
          const regex = /https?:\/\/[^"\s']+\.(?:jpg|jpeg|png|webp)/gi;
          const matches = contentStr.match(regex) || [];

          const contentPhotos = [...new Set(matches)].filter((url) => {
            const u = url.toLowerCase();
            const isActionHost =
              u.includes('performgroup.com') ||
              u.includes('stories.dazn.com') ||
              u.includes('fotmob.com/wp-content') ||
              u.includes('images.fotmob.com/images/pulse') ||
              u.includes('images.fotmob.com/image_resources/playerimages');
            const isUi =
              u.includes('logo') ||
              u.includes('teamlogo') ||
              u.includes('heatmap') ||
              u.includes('fallback') ||
              u.includes('weather') ||
              u.includes('badge');
            return isActionHost && !isUi;
          });

          for (const u of contentPhotos) {
            if (!candidates.some((c) => c.url === u)) {
              candidates.push({
                url: u,
                title: '',
                text: '',
                source: 'content',
              });
            }
          }
        } catch (e: any) {
          console.warn('[FotMob Details] Parse error:', e.message);
        }
      }

      if (candidates.length === 0) {
        return { potm, allPhotos: [] };
      }

      const allPhotos = [...new Set(candidates.map((c) => c.url))];

      // 7. Token setup for Winner / Leading team vs Losing team
      const winTokens: string[] = [];
      if (options.winningTeam) winTokens.push(...options.winningTeam.toLowerCase().split(/\s+/));
      if (options.winningScorers) {
        options.winningScorers.forEach((s) => winTokens.push(...s.toLowerCase().split(/\s+/)));
      }
      if (potm?.name && options.winningTeam && potm.team.toLowerCase().includes(options.winningTeam.toLowerCase())) {
        winTokens.push(...potm.name.toLowerCase().split(/\s+/));
      }

      const loseTokens: string[] = [];
      if (options.losingTeam) loseTokens.push(...options.losingTeam.toLowerCase().split(/\s+/));

      const cleanTokens = (arr: string[]) =>
        [...new Set(arr.filter((t) => t.length >= 3 && !['the', 'and', 'for', 'city', 'town', 'united'].includes(t)))];

      const wTokens = cleanTokens(winTokens);
      const lTokens = cleanTokens(loseTokens);

      // 8. Smart Photo Selection: Prioritize Commentary pitch-side celebration photos
      let bestCandidate = candidates[0];
      let bestScore = -999;

      for (const cand of candidates) {
        let score = 0;
        // Commentary photos are live pitch-side photos from today's game
        if (cand.source === 'commentary') score += 100;

        const info = `${cand.url} ${cand.title} ${cand.text}`.toLowerCase();

        // Check winner / leading mentions
        const hasWinner = wTokens.some((t) => info.includes(t));
        const hasLoser = lTokens.some((t) => info.includes(t));

        if (hasWinner) score += 90;
        if (hasLoser && !hasWinner) score -= 80;

        if (info.includes('goal') || info.includes('celebrat')) score += 30;

        // In draw, latest commentary photo is great
        if (options.isDraw && cand.source === 'commentary') {
          score += 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      }

      return {
        bestPhoto: bestCandidate.url,
        allPhotos,
        potm,
      };
    } catch (err: any) {
      console.error('FotMob service error:', err.message);
      return { allPhotos: [] };
    }
  },

  /**
   * Fetch complete player ratings and an alternative fresh photo for Player Ratings Post
   */
  async getMatchRatings(options: {
    homeTeam: string;
    awayTeam: string;
    dateStr?: string;
    excludePhoto?: string;
  }): Promise<MatchRatingsResult> {
    try {
      let date = options.dateStr;
      if (!date) {
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        date = `${y}${m}${d}`;
      }

      const res = await fetch(`https://www.fotmob.com/api/data/matches?date=${date}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (!res.ok) {
        return {
          matchFound: false,
          homeTeam: options.homeTeam,
          awayTeam: options.awayTeam,
          homeStarters: [],
          homeSubs: [],
          awayStarters: [],
          awaySubs: [],
          allPhotos: [],
        };
      }

      const data = (await res.json()) as any;
      const allMatches: any[] = [];
      if (Array.isArray(data.leagues)) {
        for (const league of data.leagues) {
          if (Array.isArray(league.matches)) {
            allMatches.push(...league.matches);
          }
        }
      }

      const norm = (s: string) =>
        (s || '')
          .toLowerCase()
          .replace(/fc|afc|cf|sc|club/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();

      const hNorm = norm(options.homeTeam);
      const aNorm = norm(options.awayTeam);

      const matched = allMatches.find((m) => {
        const mh = norm(m.home?.name || '');
        const ma = norm(m.away?.name || '');
        const direct = (mh.includes(hNorm) || hNorm.includes(mh)) && (ma.includes(aNorm) || aNorm.includes(ma));
        const reverse = (mh.includes(aNorm) || aNorm.includes(mh)) && (ma.includes(hNorm) || hNorm.includes(ma));
        return direct || reverse;
      });

      if (!matched?.id) {
        return {
          matchFound: false,
          homeTeam: options.homeTeam,
          awayTeam: options.awayTeam,
          homeStarters: [],
          homeSubs: [],
          awayStarters: [],
          awaySubs: [],
          allPhotos: [],
        };
      }

      const [detailsRes, ltcRes] = await Promise.all([
        fetch(`https://www.fotmob.com/api/data/matchDetails?matchId=${matched.id}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
          },
        }).catch(() => null),
        fetch(`https://data.fotmob.com/webcl/ltc/gsm/${matched.id}_en.json.gz`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }).catch(() => null),
      ]);

      const photoList: string[] = [];

      // Extract commentary photos
      if (ltcRes && ltcRes.ok) {
        try {
          const ltcData = (await ltcRes.json()) as any;
          const pulseItems = ltcData.PulseInfo?.Items || [];
          for (const item of pulseItems) {
            const imgContent = item.Content?.find((c: any) => c.Type === 'image' && c.Media?.[0]?.Url);
            if (imgContent?.Media?.[0]?.Url) {
              photoList.push(imgContent.Media[0].Url);
            }
          }
        } catch {}
      }

      let homeStarters: PlayerRatingItem[] = [];
      let homeSubs: PlayerRatingItem[] = [];
      let awayStarters: PlayerRatingItem[] = [];
      let awaySubs: PlayerRatingItem[] = [];
      let potm: { name: string; rating: string; team: string } | undefined = undefined;

      if (detailsRes && detailsRes.ok) {
        try {
          const detailsData = (await detailsRes.json()) as any;
          const content = detailsData.content || {};

          // Extract POTM
          const potmRaw = content.matchFacts?.playerOfTheMatch;
          if (potmRaw?.name) {
            potm = {
              name: potmRaw.name.fullName || `${potmRaw.name.firstName || ''} ${potmRaw.name.lastName || ''}`.trim(),
              rating: String(potmRaw.rating?.num || ''),
              team: potmRaw.teamName || '',
            };
          }

          // Lineup parse
          const lineup = content.lineup || {};
          const parseTeam = (t: any) => {
            const starters: PlayerRatingItem[] = (t?.starters || []).map((p: any) => ({
              name: p.name || p.fullName || 'Player',
              rating: p.performance?.rating ? Number(p.performance.rating).toFixed(1) : undefined,
            }));
            // Only subs who played (have a rating)
            const subs: PlayerRatingItem[] = (t?.subs || [])
              .filter((p: any) => p.performance?.rating)
              .map((p: any) => ({
                name: p.name || p.fullName || 'Sub',
                rating: Number(p.performance.rating).toFixed(1),
              }));
            return { starters, subs };
          };

          const homeParsed = parseTeam(lineup.homeTeam);
          const awayParsed = parseTeam(lineup.awayTeam);

          homeStarters = homeParsed.starters;
          homeSubs = homeParsed.subs;
          awayStarters = awayParsed.starters;
          awaySubs = awayParsed.subs;

          // Content photos
          const contentStr = JSON.stringify(content);
          const regex = /https?:\/\/[^"\s']+\.(?:jpg|jpeg|png|webp)/gi;
          const matches = contentStr.match(regex) || [];
          for (const u of matches) {
            const ul = u.toLowerCase();
            const isAction =
              ul.includes('performgroup.com') ||
              ul.includes('stories.dazn.com') ||
              ul.includes('images.fotmob.com/images/pulse') ||
              ul.includes('images.fotmob.com/image_resources/playerimages');
            const isUi =
              ul.includes('logo') ||
              ul.includes('teamlogo') ||
              ul.includes('heatmap') ||
              ul.includes('fallback') ||
              ul.includes('weather');
            if (isAction && !isUi && !photoList.includes(u)) {
              photoList.push(u);
            }
          }
        } catch (e: any) {
          console.warn('[FotMob Ratings] Parse error:', e.message);
        }
      }

      const allPhotos = [...new Set(photoList)];
      // Pick a fresh photo that is NOT the FT photo
      let bestPhoto: string | undefined = undefined;
      const exclude = options.excludePhoto || '';

      const diffPhoto = allPhotos.find((p) => p !== exclude);
      bestPhoto = diffPhoto || allPhotos[0];

      return {
        matchFound: true,
        homeTeam: options.homeTeam,
        awayTeam: options.awayTeam,
        homeStarters,
        homeSubs,
        awayStarters,
        awaySubs,
        potm,
        bestPhoto,
        allPhotos,
      };
    } catch (err: any) {
      console.error('FotMob getMatchRatings error:', err.message);
      return {
        matchFound: false,
        homeTeam: options.homeTeam,
        awayTeam: options.awayTeam,
        homeStarters: [],
        homeSubs: [],
        awayStarters: [],
        awaySubs: [],
        allPhotos: [],
      };
    }
  },
};
