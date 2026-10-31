import { TwitterScraper } from './twitterScraper';
import { Env } from '../types';

// Map of canonical club names / keywords to their verified Twitter handles
const CLUB_TWITTER_HANDLES: Record<string, string> = {
  // Premier League
  arsenal: 'Arsenal',
  'aston villa': 'AVFCOfficial',
  bournemouth: 'afcbournemouth',
  'afc bournemouth': 'afcbournemouth',
  brentford: 'BrentfordFC',
  brighton: 'OfficialBHAFC',
  'brighton & hove albion': 'OfficialBHAFC',
  chelsea: 'ChelseaFC',
  'crystal palace': 'CPFC',
  everton: 'Everton',
  fulham: 'FulhamFC',
  ipswich: 'IpswichTown',
  'ipswich town': 'IpswichTown',
  leicester: 'LCFC',
  'leicester city': 'LCFC',
  liverpool: 'LFC',
  'manchester city': 'ManCity',
  'man city': 'ManCity',
  'manchester united': 'ManUtd',
  'man united': 'ManUtd',
  'man utd': 'ManUtd',
  newcastle: 'NUFC',
  'newcastle united': 'NUFC',
  'nottingham forest': 'NFFC',
  nottingham: 'NFFC',
  southampton: 'SouthamptonFC',
  tottenham: 'SpursOfficial',
  'tottenham hotspur': 'SpursOfficial',
  spurs: 'SpursOfficial',
  'west ham': 'WestHam',
  'west ham united': 'WestHam',
  wolves: 'Wolves',
  'wolverhampton wanderers': 'Wolves',

  // La Liga
  'real madrid': 'realmadrid',
  barcelona: 'FCBarcelona',
  'atletico madrid': 'Atleti',
  'atletico de madrid': 'Atleti',

  // Bundesliga
  'bayern munich': 'FCBayern',
  bayern: 'FCBayern',
  'borussia dortmund': 'BVB',
  dortmund: 'BVB',
  'bayer leverkusen': 'bayer04fussball',
  leverkusen: 'bayer04fussball',

  // Serie A
  atalanta: 'Atalanta_BC',
  fiorentina: 'acffiorentina',
  inter: 'Inter',
  'inter milan': 'Inter',
  milan: 'acmilan',
  'ac milan': 'acmilan',
  juventus: 'juventusfc',

  // Ligue 1
  'paris saint-germain': 'PSG_inside',
  psg: 'PSG_inside',

  // Indian Super League
  'mohun bagan': 'mohunbagansa',
  'east bengal': 'eastbengal_fc',
  'kerala blasters': 'KeralaBlasters',
  'mumbai city': 'MumbaiCityFC',
  bengaluru: 'bengalurufc',
  'bengaluru fc': 'bengalurufc',
  chennaiyin: 'ChennaiyinFC',
  'fc goa': 'FCGoaOfficial',
  'northeast united': 'NEUtdFC',
  odisha: 'OdishaFC',
  jamshedpur: 'JamshedpurFC',
  hyderabad: 'HydFCOfficial',
  mohammedan: 'MohammedanSC',
};

// Find the Twitter handle for a given team name
export function getClubTwitterHandle(teamName: string): string | null {
  if (!teamName) return null;
  const clean = teamName.toLowerCase().trim();
  
  if (CLUB_TWITTER_HANDLES[clean]) {
    return CLUB_TWITTER_HANDLES[clean];
  }

  // Substring match
  for (const [key, handle] of Object.entries(CLUB_TWITTER_HANDLES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return handle;
    }
  }

  return null;
}

export interface ClubPhotoCandidate {
  url: string;
  tweetText: string;
  isMultiImage: boolean;
  score: number;
}

export class ClubPhotoService {
  private scraper: TwitterScraper;

  constructor() {
    this.scraper = new TwitterScraper();
  }

  /**
   * Filter and score photos to select clean, raw on-pitch action/celebrations
   * Strict avoidance of graphic posters and score overlays.
   */
  private scoreTweetPhotos(
    text: string,
    photos: { url: string }[],
    options: {
      isHalftime?: boolean;
      winningScorers?: string[];
      avoidPhotoUrl?: string;
    }
  ): ClubPhotoCandidate[] {
    if (!photos || photos.length === 0) return [];

    const lower = text.toLowerCase();

    // 1. HARD REJECT: Graphic scorecard, announcement, and template patterns
    const isGraphicPoster =
      /^(full-time|half-time|ft:|ht:|full time:|half time:)/i.test(text.trim()) ||
      lower.includes('starting xi') ||
      lower.includes('team news') ||
      lower.includes('lineup') ||
      lower.includes('line-up') ||
      lower.includes('matchday') ||
      lower.includes('kick-off') ||
      lower.includes('defeat at') ||
      lower.includes('points shared at') ||
      lower.includes('full-time at') ||
      lower.includes('half-time at') ||
      (lower.includes('full-time') && lower.includes('-') && photos.length === 1) ||
      (lower.includes('half-time') && lower.includes('-') && photos.length === 1);

    if (isGraphicPoster) {
      console.log(`[ClubPhoto] Rejected graphic poster tweet: "${text.slice(0, 60)}"`);
      return [];
    }

    let baseScore = 10;

    // 2. High bonus for in-match tweets containing scorelines (e.g. "1-0", "2-0") or match hashtags (#BRENFO)
    const hasScorePattern = /\b\d+\s*[-–]\s*\d+\b/.test(text);
    if (hasScorePattern) {
      baseScore += 50;
    }

    const hasMatchHashtag = /#[A-Z]{5,8}\b/i.test(text);
    if (hasMatchHashtag) {
      baseScore += 30;
    }

    // 3. Goal & Celebration bonuses
    if (
      lower.includes('goal') ||
      lower.includes('yesss') ||
      lower.includes('get in') ||
      lower.includes('lead') ||
      lower.includes('scenes') ||
      lower.includes('limbs') ||
      lower.includes('passion') ||
      lower.includes('strike') ||
      lower.includes('celebrat') ||
      lower.includes('action') ||
      lower.includes('shift') ||
      lower.includes('three points') ||
      lower.includes('treats') ||
      lower.includes('🔥') ||
      lower.includes('⚡') ||
      lower.includes('🎯') ||
      lower.includes('👏')
    ) {
      baseScore += 35;
    }

    // 4. Bonus for multi-photo galleries (action galleries)
    if (photos.length >= 2) {
      baseScore += 30;
    }

    // 5. Bonus if tweet mentions winning scorers or key players
    if (options.winningScorers && options.winningScorers.length > 0) {
      for (const scorer of options.winningScorers) {
        const lastName = scorer.split(' ').pop()?.toLowerCase();
        if (lastName && lastName.length > 3 && lower.includes(lastName)) {
          baseScore += 40;
          break;
        }
      }
    }

    // 6. Halftime vs Fulltime specific bonuses
    if (options.isHalftime) {
      if (lower.includes('break') || lower.includes('first half') || lower.includes('45') || lower.includes('more of the same')) {
        baseScore += 25;
      }
    } else {
      if (lower.includes('three points') || lower.includes('win') || lower.includes('today')) {
        baseScore += 20;
      }
    }

    // 7. Penalty for non-football / commemorative / PR tweets
    if (
      lower.includes('remember them') ||
      lower.includes('rip') ||
      lower.includes('rest in peace') ||
      lower.includes('debt') ||
      lower.includes('birthday') ||
      lower.includes('ticket') ||
      lower.includes('podcast') ||
      lower.includes('shop')
    ) {
      baseScore -= 60;
    }

    const results: ClubPhotoCandidate[] = [];
    for (const p of photos) {
      // Upgrade to high resolution image URL (:orig or name=orig)
      let hdUrl = p.url;
      if (hdUrl.includes('pbs.twimg.com/media/')) {
        if (!hdUrl.includes('name=')) {
          hdUrl = `${hdUrl}?format=jpg&name=orig`;
        }
      }

      // Discard duplicate of half-time photo if specified
      if (options.avoidPhotoUrl && (options.avoidPhotoUrl.includes(p.url) || hdUrl === options.avoidPhotoUrl)) {
        continue;
      }

      results.push({
        url: hdUrl,
        tweetText: text,
        isMultiImage: photos.length > 1,
        score: baseScore,
      });
    }

    return results;
  }

  /**
   * Main entry point to get clean pitch-side action/celebration photos for a match
   */
  async getMatchActionPhoto(options: {
    homeTeam: string;
    awayTeam: string;
    winningTeam?: string;
    losingTeam?: string;
    winningScorers?: string[];
    isDraw?: boolean;
    isHalftime?: boolean;
    avoidPhotoUrl?: string;
    env?: Env;
  }): Promise<string | null> {
    try {
      // Determine which club Twitter accounts to check
      const handlesToCheck: string[] = [];

      if (options.isDraw) {
        // Draw match: check BOTH clubs!
        const homeHandle = getClubTwitterHandle(options.homeTeam);
        const awayHandle = getClubTwitterHandle(options.awayTeam);
        if (homeHandle) handlesToCheck.push(homeHandle);
        if (awayHandle) handlesToCheck.push(awayHandle);
      } else if (options.winningTeam) {
        // One team won: check winning team first, then home team
        const winHandle = getClubTwitterHandle(options.winningTeam);
        if (winHandle) handlesToCheck.push(winHandle);
      } else {
        const homeHandle = getClubTwitterHandle(options.homeTeam);
        if (homeHandle) handlesToCheck.push(homeHandle);
        const awayHandle = getClubTwitterHandle(options.awayTeam);
        if (awayHandle) handlesToCheck.push(awayHandle);
      }

      if (handlesToCheck.length === 0) {
        console.log(`[ClubPhoto] No Twitter handle found for ${options.homeTeam} or ${options.awayTeam}`);
        return null;
      }

      const allCandidates: ClubPhotoCandidate[] = [];

      // Query target club Twitter accounts
      for (const handle of handlesToCheck) {
        try {
          const tweets = await this.scraper.getRecentTweets(handle, 12);
          for (const t of tweets) {
            const candidates = this.scoreTweetPhotos(t.text, t.photos, {
              isHalftime: options.isHalftime,
              winningScorers: options.winningScorers,
              avoidPhotoUrl: options.avoidPhotoUrl,
            });
            allCandidates.push(...candidates);
          }
        } catch (err: any) {
          console.warn(`[ClubPhoto] Error scraping @${handle}:`, err.message);
        }
      }

      if (allCandidates.length === 0) {
        console.log(`[ClubPhoto] No clean action photos found for match.`);
        return null;
      }

      // Sort by highest score (celebrations, multi-photos, scorer mentions first)
      allCandidates.sort((a, b) => b.score - a.score);

      const topCandidate = allCandidates[0];
      console.log(`[ClubPhoto] Selected top clean photo (score=${topCandidate.score}): ${topCandidate.url} | Tweet: "${topCandidate.tweetText.slice(0, 60)}"`);
      return topCandidate.url;
    } catch (err: any) {
      console.error(`[ClubPhoto] Fatal error fetching club photos:`, err.message);
      return null;
    }
  }
}

export const clubPhotoService = new ClubPhotoService();
