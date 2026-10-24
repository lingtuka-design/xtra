export interface FotmobMatchResult {
  bestPhoto?: string;
  allPhotos: string[];
  potm?: {
    name: string;
    rating: string;
    team: string;
  };
}

export const fotmobService = {
  /**
   * Fetch high-resolution pitch-side action photos and POTM from FotMob
   * Priority #1 for Premier League and Champions League matches
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

      // 4. Fetch Match Details
      const detailsRes = await fetch(`https://www.fotmob.com/api/data/matchDetails?matchId=${matched.id}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (!detailsRes.ok) {
        console.warn(`FotMob matchDetails failed with status: ${detailsRes.status}`);
        return { allPhotos: [] };
      }

      const detailsData = (await detailsRes.json()) as any;
      const content = detailsData.content || {};

      // 5. Extract Player of the Match (POTM) if available
      let potm: { name: string; rating: string; team: string } | undefined = undefined;
      const potmRaw = content.matchFacts?.playerOfTheMatch;
      if (potmRaw?.name) {
        potm = {
          name: potmRaw.name.fullName || `${potmRaw.name.firstName || ''} ${potmRaw.name.lastName || ''}`.trim(),
          rating: String(potmRaw.rating?.num || ''),
          team: potmRaw.teamName || '',
        };
      }

      // 6. Extract action photos (Perform Group / Omnisport / DAZN / Editorial)
      const contentStr = JSON.stringify(content);
      const regex = /https?:\/\/[^"\s']+\.(?:jpg|jpeg|png|webp)/gi;
      const matches = contentStr.match(regex) || [];

      // Filter only real pitch action / press images (exclude UI logos, icons, banners, heatmaps)
      const actionPhotos = [...new Set(matches)].filter((url) => {
        const u = url.toLowerCase();
        const isActionHost =
          u.includes('performgroup.com') ||
          u.includes('stories.dazn.com') ||
          u.includes('fotmob.com/wp-content') ||
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

      if (actionPhotos.length === 0) {
        return { potm, allPhotos: [] };
      }

      // 7. Smart Winner / Draw Photo Selection
      if (options.isDraw) {
        return {
          bestPhoto: actionPhotos[0],
          allPhotos: actionPhotos,
          potm,
        };
      }

      // Score candidates to prioritize winning team celebration
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

      let bestPhoto = actionPhotos[0];
      let bestScore = -999;

      for (const url of actionPhotos) {
        const u = url.toLowerCase();
        let score = 0;

        const hasWinner = wTokens.some((t) => u.includes(t));
        const hasLoser = lTokens.some((t) => u.includes(t));

        if (hasWinner) score += 80;
        if (hasLoser && !hasWinner) score -= 80; // Penalize losing player / celebration photo

        if (score > bestScore) {
          bestScore = score;
          bestPhoto = url;
        }
      }

      return {
        bestPhoto: bestScore >= 0 ? bestPhoto : actionPhotos[0],
        allPhotos: actionPhotos,
        potm,
      };
    } catch (err: any) {
      console.error('FotMob service error:', err.message);
      return { allPhotos: [] };
    }
  },
};
