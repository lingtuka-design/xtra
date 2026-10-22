import React, { useState, useRef } from 'react';
import {
  Download,
  Share2,
  Send,
  Upload,
  RefreshCw,
  Sparkles,
  Trophy,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  Layers,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface GraphicMakerPanelProps {
  onPostCreated?: () => void;
}

const TOURNAMENT_PRESETS = [
  'MIZORAM PREMIER LEAGUE',
  'I-LEAGUE',
  'DURAND CUP',
  'SANTOSH TROPHY',
  'CHAMPIONS LEAGUE',
  'PREMIER LEAGUE',
  'ISL',
  'CLUB FRIENDLY',
];

const MPL_TEAMS = [
  { name: 'Aizawl FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/27/Aizawl_FC_logo.svg/300px-Aizawl_FC_logo.svg.png' },
  { name: 'Chanmari FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Chanmari_FC_logo.png/300px-Chanmari_FC_logo.png' },
  { name: 'Mizoram Police FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Mizoram_Police_FC.png/300px-Mizoram_Police_FC.png' },
  { name: 'SYS FC', logo: '' },
  { name: 'FC Chhinga Veng', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Chhinga_Veng_FC_logo.png/300px-Chhinga_Veng_FC_logo.png' },
  { name: 'Sihphir Venghlun FC', logo: '' },
  { name: 'FC Venghnuai', logo: '' },
  { name: 'Bethlehem VT FC', logo: '' },
  { name: 'Real Madrid', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png' },
  { name: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
  { name: 'Bayern Munich', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png' },
  { name: 'Manchester United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' },
  { name: 'Liverpool', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png' },
  { name: 'Chelsea', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
  { name: 'Barcelona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png' },
  { name: 'Mohun Bagan SG', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/10006.png' },
  { name: 'East Bengal FC', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/9895.png' },
];

export const GraphicMakerPanel: React.FC<GraphicMakerPanelProps> = ({ onPostCreated }) => {
  const [league, setLeague] = useState('MIZORAM PREMIER LEAGUE');
  const [status, setStatus] = useState<'FULL TIME' | 'HALF TIME'>('FULL TIME');

  // Home Team
  const [homeTeam, setHomeTeam] = useState('Aizawl FC');
  const [homeScore, setHomeScore] = useState('2');
  const [homeLogo, setHomeLogo] = useState('https://upload.wikimedia.org/wikipedia/en/thumb/2/27/Aizawl_FC_logo.svg/300px-Aizawl_FC_logo.svg.png');
  const [homeScorers, setHomeScorers] = useState("Lalthanmawia 23', 67'");

  // Away Team
  const [awayTeam, setAwayTeam] = useState('Chanmari FC');
  const [awayScore, setAwayScore] = useState('1');
  const [awayLogo, setAwayLogo] = useState('https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Chanmari_FC_logo.png/300px-Chanmari_FC_logo.png');
  const [awayScorers, setAwayScorers] = useState("David 89'");

  // Stats
  const [includeStats, setIncludeStats] = useState(true);
  const [homePossession, setHomePossession] = useState('54%');
  const [awayPossession, setAwayPossession] = useState('46%');
  const [homeShots, setHomeShots] = useState('14');
  const [awayShots, setAwayShots] = useState('9');
  const [homeShotsOnTarget, setHomeShotsOnTarget] = useState('7');
  const [awayShotsOnTarget, setAwayShotsOnTarget] = useState('4');
  const [homeCorners, setHomeCorners] = useState('6');
  const [awayCorners, setAwayCorners] = useState('3');
  const [homeFouls, setHomeFouls] = useState('11');
  const [awayFouls, setAwayFouls] = useState('12');
  const [homeYellowCards, setHomeYellowCards] = useState('1');
  const [awayYellowCards, setAwayYellowCards] = useState('2');
  const [homeRedCards, setHomeRedCards] = useState('0');
  const [awayRedCards, setAwayRedCards] = useState('0');

  // Background Image
  const [bgImage, setBgImage] = useState('');
  const [channel, setChannel] = useState<'fb' | 'wa'>('fb');

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const homeFileInputRef = useRef<HTMLInputElement>(null);
  const awayFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Generate Card URL parameters
  const getCardQuery = (chan: 'fb' | 'wa') => {
    const q = new URLSearchParams();
    q.set('home', homeTeam.trim() || 'Home Team');
    q.set('away', awayTeam.trim() || 'Away Team');
    q.set('homeScore', homeScore.trim() || '0');
    q.set('awayScore', awayScore.trim() || '0');
    if (homeLogo.trim()) q.set('homeLogo', homeLogo.trim());
    if (awayLogo.trim()) q.set('awayLogo', awayLogo.trim());
    q.set('status', status);
    q.set('league', league.trim() || 'MATCH RESULT');
    if (homeScorers.trim()) q.set('homeScorers', homeScorers.trim());
    if (awayScorers.trim()) q.set('awayScorers', awayScorers.trim());
    q.set('channel', chan);
    if (bgImage.trim()) q.set('bgImage', bgImage.trim());

    if (includeStats) {
      q.set('homePossession', homePossession.trim() || '50%');
      q.set('awayPossession', awayPossession.trim() || '50%');
      q.set('homeShots', homeShots.trim() || '0');
      q.set('awayShots', awayShots.trim() || '0');
      q.set('homeShotsOnTarget', homeShotsOnTarget.trim() || '0');
      q.set('awayShotsOnTarget', awayShotsOnTarget.trim() || '0');
      q.set('homeCorners', homeCorners.trim() || '0');
      q.set('awayCorners', awayCorners.trim() || '0');
      q.set('homeFouls', homeFouls.trim() || '0');
      q.set('awayFouls', awayFouls.trim() || '0');
      q.set('homeYellowCards', homeYellowCards.trim() || '0');
      q.set('awayYellowCards', awayYellowCards.trim() || '0');
      q.set('homeRedCards', homeRedCards.trim() || '0');
      q.set('awayRedCards', awayRedCards.trim() || '0');
    }

    return q.toString();
  };

  const getMicrolinkImageUrl = (chan: 'fb' | 'wa') => {
    const query = getCardQuery(chan);
    const cardEndpoint = `https://xtra-byd.pages.dev/api/live/card?${query}`;
    return `https://api.microlink.io/?url=${encodeURIComponent(cardEndpoint)}&screenshot=true&embed=screenshot.url&viewport.width=820&viewport.height=1024`;
  };

  const currentPreviewCardUrl = `/api/live/card?${getCardQuery(channel)}`;

  // Handle local image upload for Home/Away Logo or Background
  const handleUploadFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Publish to Facebook & WhatsApp
  const handlePublish = async (target: 'both' | 'fb_only' | 'trio') => {
    setIsPublishing(true);
    setPublishSuccess(null);
    setPublishError(null);

    const imageUrl = getMicrolinkImageUrl(target === 'fb_only' ? 'fb' : 'wa');

    // Build automated caption
    const scorersText = [
      homeScorers ? `${homeTeam}: ${homeScorers}` : '',
      awayScorers ? `${awayTeam}: ${awayScorers}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const caption = `🏆 ${league.toUpperCase()} (${status})
⚽ ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

${scorersText ? `${scorersText}\n\n` : ''}👉 Follow @inkhel_xtra for latest football updates!
#Inkhel #${league.replace(/\s+/g, '')} #MatchResult #FootballNews`;

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mizo_translation: caption,
          original_text: caption,
          primary_image_url: imageUrl,
          author_name: 'Inkhel Scorecard',
          publish_now: true,
          skip_whatsapp: target === 'fb_only',
          publish_main_fb: target === 'trio',
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Post publish failed');
      }

      setPublishSuccess(
        target === 'trio'
          ? '🔥 TRIO: Xtra FB, Inkhel.com FB, leh WhatsApp Channel-ah a rualin a in-post fel e!'
          : target === 'fb_only'
          ? '🎉 Xtra Facebook Page-ah chiah hlawhtling takin a in-post e!'
          : '🎉 Facebook Page leh WhatsApp Channel-ah a rualin a in-post fel thlap e!'
      );
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      setPublishError(err.message || 'Post publish laiin buaina a awm');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Graphic Scorecard Maker
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                MPL & LOCAL
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-300 font-medium">
            ESPN-a awm lo local football (MPL, Durand Cup, etc.) match result leh scorecard graphic duang la, FB leh WhatsApp-ah direct-in post rawh.
          </p>
        </div>

        {/* Branding Switch Preview Toggle */}
        <div className="flex items-center bg-stone-800/90 p-1 rounded-2xl border border-stone-700 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChannel('fb')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              channel === 'fb'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Inkhel Xtra (FB)
          </button>
          <button
            type="button"
            onClick={() => setChannel('wa')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              channel === 'wa'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Inkhel (WhatsApp)
          </button>
        </div>
      </div>

      {/* Notifications */}
      {publishSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{publishSuccess}</span>
          <button
            onClick={() => setPublishSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-xs"
          >
            &times;
          </button>
        </div>
      )}
      {publishError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
          <span>{publishError}</span>
          <button
            onClick={() => setPublishError(null)}
            className="text-rose-700 hover:text-rose-950 font-bold ml-2 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Two Column Layout: Editor (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Tournament & Status */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Tournament & Match State
            </h3>

            <div>
              <label className="text-[11px] font-bold text-stone-700 mb-1 block">
                Tournament / League Hming
              </label>
              <input
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="e.g. MIZORAM PREMIER LEAGUE"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
              />
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {TOURNAMENT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLeague(p)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition ${
                      league === p
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-bold text-stone-700">Status:</span>
              <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStatus('FULL TIME')}
                  className={`px-3 py-1 rounded-lg transition ${
                    status === 'FULL TIME'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  FULL TIME
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('HALF TIME')}
                  className={`px-3 py-1 rounded-lg transition ${
                    status === 'HALF TIME'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  HALF TIME
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Teams & Scores */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center justify-between">
              <span>Teams, Scores & Scorers</span>
              <span className="text-[10px] text-stone-400 font-normal">Club logo thlang la emaw paste rawh</span>
            </h3>

            {/* Quick MPL Club Presets */}
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                Quick Select Club:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {MPL_TEAMS.map((team) => (
                  <button
                    key={team.name}
                    type="button"
                    onClick={() => {
                      if (!homeTeam || homeTeam === 'Aizawl FC') {
                        setHomeTeam(team.name);
                        if (team.logo) setHomeLogo(team.logo);
                      } else {
                        setAwayTeam(team.name);
                        if (team.logo) setAwayLogo(team.logo);
                      }
                    }}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800 whitespace-nowrap shrink-0 transition"
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home Team */}
              <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-700 uppercase tracking-wide">
                    Home Team (Veilam)
                  </span>
                  {homeLogo ? (
                    <img src={homeLogo} alt="" className="w-6 h-6 object-contain" />
                  ) : null}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Team Hming</label>
                  <input
                    type="text"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="e.g. Aizawl FC"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Score</label>
                    <input
                      type="number"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Logo</label>
                    <button
                      type="button"
                      onClick={() => homeFileInputRef.current?.click()}
                      className="w-full bg-white hover:bg-stone-100 border border-stone-300 rounded-lg py-1.5 text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    <input
                      ref={homeFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, setHomeLogo)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Goal Scorers (Minute nen)</label>
                  <input
                    type="text"
                    value={homeScorers}
                    onChange={(e) => setHomeScorers(e.target.value)}
                    placeholder="e.g. Lalthanmawia 23', 67'"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Away Team */}
              <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                    Away Team (Dinglam)
                  </span>
                  {awayLogo ? (
                    <img src={awayLogo} alt="" className="w-6 h-6 object-contain" />
                  ) : null}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Team Hming</label>
                  <input
                    type="text"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="e.g. Chanmari FC"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Score</label>
                    <input
                      type="number"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Logo</label>
                    <button
                      type="button"
                      onClick={() => awayFileInputRef.current?.click()}
                      className="w-full bg-white hover:bg-stone-100 border border-stone-300 rounded-lg py-1.5 text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    <input
                      ref={awayFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, setAwayLogo)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Goal Scorers (Minute nen)</label>
                  <input
                    type="text"
                    value={awayScorers}
                    onChange={(e) => setAwayScorers(e.target.value)}
                    placeholder="e.g. David 89'"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Match Stats (Optional 7 Rows) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-500" />
                7 Match Stats (Optional)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 select-none">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>Stats Telh</span>
              </label>
            </div>

            {includeStats && (
              <div className="space-y-2 pt-1 text-xs">
                {/* 1. Possession */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">POSSESSION</span>
                  <input
                    type="text"
                    value={homePossession}
                    onChange={(e) => setHomePossession(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                    placeholder="50%"
                  />
                  <input
                    type="text"
                    value={awayPossession}
                    onChange={(e) => setAwayPossession(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                    placeholder="50%"
                  />
                </div>

                {/* 2. Shots */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">SHOTS</span>
                  <input
                    type="text"
                    value={homeShots}
                    onChange={(e) => setHomeShots(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayShots}
                    onChange={(e) => setAwayShots(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 3. Shots on target */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">SHOTS ON TARGET</span>
                  <input
                    type="text"
                    value={homeShotsOnTarget}
                    onChange={(e) => setHomeShotsOnTarget(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayShotsOnTarget}
                    onChange={(e) => setAwayShotsOnTarget(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 4. Corners */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">CORNERS</span>
                  <input
                    type="text"
                    value={homeCorners}
                    onChange={(e) => setHomeCorners(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayCorners}
                    onChange={(e) => setAwayCorners(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 5. Fouls */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">FOULS</span>
                  <input
                    type="text"
                    value={homeFouls}
                    onChange={(e) => setHomeFouls(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayFouls}
                    onChange={(e) => setAwayFouls(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 6. Yellow Cards */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">YELLOW CARDS</span>
                  <input
                    type="text"
                    value={homeYellowCards}
                    onChange={(e) => setHomeYellowCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayYellowCards}
                    onChange={(e) => setAwayYellowCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 7. Red Cards */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">RED CARDS</span>
                  <input
                    type="text"
                    value={homeRedCards}
                    onChange={(e) => setHomeRedCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayRedCards}
                    onChange={(e) => setAwayRedCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Background Image Upload (Optional) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-800 block">Match Action Photo (Background)</span>
                <span className="text-[11px] text-stone-500">Thlalak awm loh chuan default dark backdrop a in-apply ang</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bgImage && (
                <button
                  type="button"
                  onClick={() => setBgImage('')}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Paih
                </button>
              )}
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-200 flex items-center gap-1 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadFile(e, setBgImage)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Visual Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-3.5">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview (819x1024)
              </span>
              <a
                href={currentPreviewCardUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-rose-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Full tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Iframe Preview Container scaled down nicely */}
            <div className="w-full bg-[#090c13] rounded-2xl overflow-hidden border border-stone-300 shadow-md aspect-[819/1024] relative flex items-center justify-center">
              <iframe
                src={currentPreviewCardUrl}
                title="Scorecard Preview"
                className="w-[819px] h-[1024px] border-0 pointer-events-none origin-top-left"
                style={{
                  transform: 'scale(var(--preview-scale, 0.44))',
                  transformOrigin: 'top left',
                  width: '819px',
                  height: '1024px',
                }}
                ref={(el) => {
                  if (el && el.parentElement) {
                    const parentW = el.parentElement.clientWidth;
                    const scale = parentW / 819;
                    el.style.setProperty('--preview-scale', String(scale));
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {/* Direct Post to FB & WhatsApp */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={() => handlePublish('both')}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition hover:scale-[1.01] active:scale-[0.99]"
              >
                {isPublishing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-amber-400" />
                )}
                <span>1-Click Post: Inkhel Xtra FB & WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => handlePublish('trio')}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition"
                  title="Post to Inkhel Xtra FB, Inkhel.com FB, and WhatsApp"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Post TRIO (All 3)</span>
                </button>

                <a
                  href={getMicrolinkImageUrl(channel)}
                  target="_blank"
                  rel="noreferrer"
                  download={`${homeTeam}-vs-${awayTeam}-scorecard.png`}
                  className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[11px] font-bold border border-stone-200 flex items-center justify-center gap-1.5 transition text-center"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  <span>Download PNG</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
