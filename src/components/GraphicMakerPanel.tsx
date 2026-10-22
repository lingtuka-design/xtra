import React, { useState, useRef } from 'react';
import {
  Download,
  Sparkles,
  Trophy,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

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

export const GraphicMakerPanel: React.FC = () => {
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

  // Branding: 'fb' = Inkhel Xtra, 'wa' = Inkhel
  const [brandLogo, setBrandLogo] = useState<'fb' | 'wa'>('fb');

  // Generation & Download States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const homeFileInputRef = useRef<HTMLInputElement>(null);
  const awayFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Generate Card URL query parameters
  const buildCardQuery = () => {
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
    q.set('channel', brandLogo);
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

  const currentPreviewCardUrl = `/api/live/card?${buildCardQuery()}`;

  // Handle local file uploads
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

  // Generate image via Microlink / Cloudflare
  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedImageUrl(null);

    const query = buildCardQuery();
    const cardEndpoint = `https://xtra-byd.pages.dev/api/live/card?${query}`;
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(
      cardEndpoint
    )}&screenshot=true&embed=screenshot.url&viewport.width=820&viewport.height=1024`;

    try {
      // Preload image to verify generation
      const img = new Image();
      img.src = microlinkUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Image render failed'));
      });

      setGeneratedImageUrl(microlinkUrl);
    } catch (err: any) {
      // Even if preload fails (due to cors or network), still set the direct URL so user can view/download
      setGeneratedImageUrl(microlinkUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct download handler
  const handleDownloadImage = async () => {
    if (!generatedImageUrl) return;
    setIsDownloading(true);

    const fileName = `${homeTeam}-vs-${awayTeam}-${status.replace(/\s+/g, '')}.png`;

    try {
      const res = await fetch(generatedImageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback
      window.open(generatedImageUrl, '_blank');
    } finally {
      setIsDownloading(false);
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
            Mizoram local football leh match result te graphic mawi takin duang la, Cloudflare hmanga generate-in HD PNG-in download rawh.
          </p>
        </div>

        {/* Branding Logo Picker (Inkhel Xtra vs Inkhel) */}
        <div className="flex flex-col gap-1 self-start sm:self-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Logo Thlang Rawh:
          </span>
          <div className="flex items-center bg-stone-800/90 p-1 rounded-2xl border border-stone-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setBrandLogo('fb');
                setGeneratedImageUrl(null);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                brandLogo === 'fb'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>Inkhel Xtra</span>
              {brandLogo === 'fb' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setBrandLogo('wa');
                setGeneratedImageUrl(null);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                brandLogo === 'wa'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>Inkhel (Normal)</span>
              {brandLogo === 'wa' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-950 font-bold ml-2 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Two Column Layout: Editor (Left 7) & Live Preview / Download (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Tournament & Match State */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Tournament & Status
            </h3>

            <div>
              <label className="text-[11px] font-bold text-stone-700 mb-1 block">
                Tournament / League Hming
              </label>
              <input
                type="text"
                value={league}
                onChange={(e) => {
                  setLeague(e.target.value);
                  setGeneratedImageUrl(null);
                }}
                placeholder="e.g. MIZORAM PREMIER LEAGUE"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {TOURNAMENT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setLeague(p);
                      setGeneratedImageUrl(null);
                    }}
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
                  onClick={() => {
                    setStatus('FULL TIME');
                    setGeneratedImageUrl(null);
                  }}
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
                  onClick={() => {
                    setStatus('HALF TIME');
                    setGeneratedImageUrl(null);
                  }}
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

          {/* 2. Teams & Scores */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center justify-between">
              <span>Teams, Scores & Scorers</span>
              <span className="text-[10px] text-stone-400 font-normal">Club logo thlang la emaw upload rawh</span>
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
                      setGeneratedImageUrl(null);
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
                    onChange={(e) => {
                      setHomeTeam(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
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
                      onChange={(e) => {
                        setHomeScore(e.target.value);
                        setGeneratedImageUrl(null);
                      }}
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
                    onChange={(e) => {
                      setHomeScorers(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
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
                    onChange={(e) => {
                      setAwayTeam(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
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
                      onChange={(e) => {
                        setAwayScore(e.target.value);
                        setGeneratedImageUrl(null);
                      }}
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
                    onChange={(e) => {
                      setAwayScorers(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    placeholder="e.g. David 89'"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Match Stats (7 Rows) */}
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
                  onChange={(e) => {
                    setIncludeStats(e.target.checked);
                    setGeneratedImageUrl(null);
                  }}
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
                    onChange={(e) => {
                      setHomePossession(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                    placeholder="50%"
                  />
                  <input
                    type="text"
                    value={awayPossession}
                    onChange={(e) => {
                      setAwayPossession(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
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
                    onChange={(e) => {
                      setHomeShots(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayShots}
                    onChange={(e) => {
                      setAwayShots(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 3. Shots on target */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">SHOTS ON TARGET</span>
                  <input
                    type="text"
                    value={homeShotsOnTarget}
                    onChange={(e) => {
                      setHomeShotsOnTarget(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayShotsOnTarget}
                    onChange={(e) => {
                      setAwayShotsOnTarget(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 4. Corners */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">CORNERS</span>
                  <input
                    type="text"
                    value={homeCorners}
                    onChange={(e) => {
                      setHomeCorners(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayCorners}
                    onChange={(e) => {
                      setAwayCorners(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 5. Fouls */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">FOULS</span>
                  <input
                    type="text"
                    value={homeFouls}
                    onChange={(e) => {
                      setHomeFouls(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayFouls}
                    onChange={(e) => {
                      setAwayFouls(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 6. Yellow Cards */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">YELLOW CARDS</span>
                  <input
                    type="text"
                    value={homeYellowCards}
                    onChange={(e) => {
                      setHomeYellowCards(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayYellowCards}
                    onChange={(e) => {
                      setAwayYellowCards(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 7. Red Cards */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">RED CARDS</span>
                  <input
                    type="text"
                    value={homeRedCards}
                    onChange={(e) => {
                      setHomeRedCards(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayRedCards}
                    onChange={(e) => {
                      setAwayRedCards(e.target.value);
                      setGeneratedImageUrl(null);
                    }}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Match Action Photo Background (Optional) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-800 block">Match Photo (Background)</span>
                <span className="text-[11px] text-stone-500">Thlalak awm loh chuan default dark visual a hmang ang</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bgImage && (
                <button
                  type="button"
                  onClick={() => {
                    setBgImage('');
                    setGeneratedImageUrl(null);
                  }}
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

        {/* Right Column: Live Preview & Generator Actions */}
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
                <span>Full screen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Preview Iframe / Image */}
            <div className="w-full bg-[#090c13] rounded-2xl overflow-hidden border border-stone-300 shadow-md aspect-[819/1024] relative flex items-center justify-center">
              {generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt="Generated Scorecard"
                  className="w-full h-full object-cover"
                />
              ) : (
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
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {/* Generate Button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.01] active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Cloudflare-ah Image Generate mek a ni...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Generate Graphic ({brandLogo === 'fb' ? 'Inkhel Xtra' : 'Inkhel'})</span>
                  </>
                )}
              </button>

              {/* Download Button (Active when generated) */}
              {generatedImageUrl ? (
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownloadImage}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>⬇️ Download HD Image (819x1024 PNG)</span>
                </button>
              ) : (
                <p className="text-[11px] text-center text-stone-500 font-medium">
                  "Generate Graphic" hmet la, Cloudflare-in a render zawhah HD PNG-in i download thei nghal ang.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
