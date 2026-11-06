import React, { useState, useEffect, useRef } from 'react';
import { Radio, RefreshCw, CheckCircle2, Circle, Clock, Flame, ShieldAlert, Sparkles, Star, Calendar, Camera, Upload, Link2, X, Trash2, Check, Users, Palette } from 'lucide-react';

interface EspnMatch {
  id: string;
  league: 'PL' | 'UCL' | 'ISL' | 'LL' | 'EFL' | 'BL' | 'IFL' | 'IL';
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
  trackMode?: 'full' | 'results_only' | 'lineup_only' | null;
  trackRatings?: boolean;
  trackLineup?: boolean;
  useGraphic?: boolean;
  manualHtPhoto?: string;
  manualFtPhoto?: string;
}

export const LiveMatchesPanel: React.FC = () => {
  const [matches, setMatches] = useState<EspnMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PL' | 'EFL' | 'LL' | 'BL' | 'UCL' | 'ISL' | 'IFL'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual Photo Modal state
  const [photoModalMatch, setPhotoModalMatch] = useState<EspnMatch | null>(null);
  const [htPhotoInput, setHtPhotoInput] = useState<string>('');
  const [ftPhotoInput, setFtPhotoInput] = useState<string>('');
  const [savingPhotos, setSavingPhotos] = useState<boolean>(false);
  const htFileInputRef = useRef<HTMLInputElement>(null);
  const ftFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMatches = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/live/matches');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && Array.isArray(data.matches)) {
          setMatches(data.matches);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.warn('Error fetching live matches:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // Poll fixtures every 60s
    const interval = setInterval(() => {
      fetchMatches(true);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Goal Detection & Auto-Post Poller
  // When at least 1 match is tracked, poll /api/live/poll every 35s
  useEffect(() => {
    const hasTracked = matches.some((m) => m.isTracked);
    if (!hasTracked) return;

    const pollLiveGoals = async () => {
      try {
        const res = await fetch('/api/live/poll', { method: 'POST' });
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.success && data.posted > 0) {
            setStatusMessage(`⚽ Goal thar ${data.posted} post a ni ta! (Inkhel Xtra FB, WhatsApp & Telegram-ah a lut nghal e)`);
            fetchMatches(true);
          }
        }
      } catch (err) {
        console.warn('Background live goal poller warning:', err);
      }
    };

    // Run once after 5s, then every 35s
    const initialTimeout = setTimeout(pollLiveGoals, 5000);
    const poller = setInterval(pollLiveGoals, 35000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(poller);
    };
  }, [matches]);

  const handleSetTrackMode = async (match: EspnMatch, mode: 'full' | 'results_only' | 'off') => {
    const isModeActive = mode !== 'off';
    const nextLineup = mode === 'full' ? true : Boolean(match.trackLineup);
    const isNowTracked = isModeActive || Boolean(nextLineup);
    const nextMode = isModeActive ? mode : null;
    setUpdatingId(match.id);
    setStatusMessage(null);

    // Optimistic UI update
    setMatches((prev) =>
      prev.map((m) =>
        m.id === match.id
          ? { ...m, isTracked: isNowTracked, trackMode: nextMode, trackLineup: nextLineup }
          : m
      )
    );

    try {
      const res = await fetch('/api/live/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: match.id,
          league: match.league,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          homeLogo: match.homeTeam.logo,
          awayLogo: match.awayTeam.logo,
          matchTime: match.date,
          isTracked: isNowTracked,
          trackMode: nextMode || undefined,
          trackRatings: Boolean(match.trackRatings),
          useGraphic: Boolean(match.useGraphic),
          trackLineup: nextLineup,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update tracking');
      }

      if (mode === 'full') {
        setStatusMessage(
          `🔥 ${match.shortName || match.name}: FULL LIVE TRACKING! Goal tin, lineup, HT & FT zawng zawng a auto-post vek ang.`
        );
      } else if (mode === 'results_only') {
        setStatusMessage(
          `📊 ${match.shortName || match.name}: RESULTS ONLY! Goal tin post lovin, Half Time & Full Time result chauh a auto-post ang.`
        );
      } else {
        setStatusMessage(`⚪ ${match.shortName || match.name} tracking titawp a ni e.`);
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      setMatches((prev) =>
        prev.map((m) =>
          m.id === match.id ? { ...m, isTracked: match.isTracked, trackMode: match.trackMode } : m
        )
      );
      alert('Tracking thlak laiin buaina a awm: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleLineup = async (match: EspnMatch) => {
    const nextLineup = !match.trackLineup;
    setUpdatingId(match.id);
    setStatusMessage(null);

    const isNowTracked = Boolean(match.trackMode) || nextLineup;

    // Optimistic UI update
    setMatches((prev) =>
      prev.map((m) =>
        m.id === match.id
          ? { ...m, trackLineup: nextLineup, isTracked: isNowTracked }
          : m
      )
    );

    try {
      const res = await fetch('/api/live/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: match.id,
          league: match.league,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          homeLogo: match.homeTeam.logo,
          awayLogo: match.awayTeam.logo,
          matchTime: match.date,
          isTracked: isNowTracked,
          trackMode: match.trackMode || undefined,
          trackRatings: Boolean(match.trackRatings),
          useGraphic: Boolean(match.useGraphic),
          trackLineup: nextLineup,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update lineup toggle');
      }

      if (nextLineup) {
        setStatusMessage(
          `👥 ${match.shortName || match.name}: Lineup tracking enabled! Match tan hma darkar 1-ah 1:1 graphic nen Starting XI a auto-post ang.`
        );
      } else {
        setStatusMessage(
          `⚪ ${match.shortName || match.name}: Lineup tracking titawp a ni e.`
        );
      }
    } catch (err: any) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === match.id
            ? { ...m, trackLineup: match.trackLineup, isTracked: match.isTracked }
            : m
        )
      );
      alert('Lineup thlak laiin buaina a awm: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleGraphic = async (match: EspnMatch) => {
    const nextGraphic = !match.useGraphic;
    setUpdatingId(match.id);
    setStatusMessage(null);

    // Optimistic UI update
    setMatches((prev) =>
      prev.map((m) =>
        m.id === match.id ? { ...m, useGraphic: nextGraphic } : m
      )
    );

    try {
      const res = await fetch('/api/live/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: match.id,
          league: match.league,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          homeLogo: match.homeTeam.logo,
          awayLogo: match.awayTeam.logo,
          matchTime: match.date,
          isTracked: Boolean(match.isTracked),
          trackMode: match.trackMode || undefined,
          trackRatings: Boolean(match.trackRatings),
          useGraphic: nextGraphic,
          trackLineup: Boolean(match.trackLineup),
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update graphic toggle');
      }

      if (nextGraphic) {
        setStatusMessage(
          `🎨 ${match.shortName || match.name}: Graphic mode enabled! Half Time leh Full Time-ah photo zawn lovin kan Graphic siamchawp a in-post ang.`
        );
      } else {
        setStatusMessage(
          `📷 ${match.shortName || match.name}: Photo rules pangngai (Club Twitter / FotMob) zawm leh a ni e.`
        );
      }
    } catch (err: any) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === match.id ? { ...m, useGraphic: match.useGraphic } : m
        )
      );
      alert('Graphic mode thlak laiin buaina a awm: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleRatings = async (match: EspnMatch) => {
    const nextRatings = !match.trackRatings;
    setUpdatingId(match.id);
    setStatusMessage(null);

    // If enabling ratings and match was not tracked, default to full tracking
    const isNowTracked = nextRatings ? true : Boolean(match.isTracked);
    const nextMode = match.trackMode || 'full';

    setMatches((prev) =>
      prev.map((m) =>
        m.id === match.id
          ? { ...m, trackRatings: nextRatings, isTracked: isNowTracked, trackMode: nextMode }
          : m
      )
    );

    try {
      const res = await fetch('/api/live/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: match.id,
          league: match.league,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          homeLogo: match.homeTeam.logo,
          awayLogo: match.awayTeam.logo,
          matchTime: match.date,
          isTracked: isNowTracked,
          trackMode: nextMode,
          trackRatings: nextRatings,
          useGraphic: Boolean(match.useGraphic),
          trackLineup: Boolean(match.trackLineup),
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update ratings');
      }

      if (nextRatings) {
        setStatusMessage(
          `⭐ ${match.shortName || match.name}: PLAYER RATINGS ON! Match zawhah Full Time post hnu minute 1-ah Player ratings a auto-post ang.`
        );
      } else {
        setStatusMessage(`⚪ ${match.shortName || match.name}: Player Ratings disabled.`);
      }
    } catch (err: any) {
      setMatches((prev) =>
        prev.map((m) => (m.id === match.id ? { ...m, trackRatings: match.trackRatings } : m))
      );
      alert('Ratings thlak laiin buaina a awm: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openPhotoModal = (match: EspnMatch) => {
    setPhotoModalMatch(match);
    setHtPhotoInput(match.manualHtPhoto || '');
    setFtPhotoInput(match.manualFtPhoto || '');
  };

  const closePhotoModal = () => {
    setPhotoModalMatch(null);
    setHtPhotoInput('');
    setFtPhotoInput('');
  };

  const handleFileUpload = (file: File | undefined, type: 'HT' | 'FT') => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (type === 'HT') setHtPhotoInput(dataUrl);
          else setFtPhotoInput(dataUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhotos = async () => {
    if (!photoModalMatch) return;
    setSavingPhotos(true);
    const trimmedHt = htPhotoInput.trim();
    const trimmedFt = ftPhotoInput.trim();

    try {
      const res = await fetch('/api/live/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: photoModalMatch.id,
          action: 'save_photos',
          league: photoModalMatch.league,
          homeTeam: photoModalMatch.homeTeam.name,
          awayTeam: photoModalMatch.awayTeam.name,
          homeLogo: photoModalMatch.homeTeam.logo,
          awayLogo: photoModalMatch.awayTeam.logo,
          matchTime: photoModalMatch.date,
          manualHtPhoto: trimmedHt,
          manualFtPhoto: trimmedFt,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save photos');
      }

      setMatches((prev) =>
        prev.map((m) =>
          m.id === photoModalMatch.id
            ? { ...m, manualHtPhoto: trimmedHt, manualFtPhoto: trimmedFt }
            : m
        )
      );

      setStatusMessage(
        `📷 ${photoModalMatch.shortName || photoModalMatch.name}: HT & FT photo dah fel a ni ta! (Priority 1-ah a hmang nghal ang).`
      );
      closePhotoModal();
    } catch (err: any) {
      alert('Thlalak save laiin buaina a awm: ' + err.message);
    } finally {
      setSavingPhotos(false);
    }
  };

  const filteredMatches = matches
    .filter((m) => {
      // Hide Full Time / Completed matches as requested
      if (
        m.statusState === 'post' ||
        m.statusDetail?.toUpperCase().includes('FT') ||
        m.statusDetail?.toUpperCase().includes('FINAL')
      ) {
        return false;
      }

      // Strictly only include matches that are currently live OR within the 48-hour window
      const matchTime = new Date(m.date).getTime();
      const nowTime = Date.now();
      const isLive = m.statusState === 'in';
      const isWithin48h = isLive || (matchTime >= nowTime - 4 * 3600 * 1000 && matchTime <= nowTime + 48 * 3600 * 1000);
      if (!isWithin48h) return false;

      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'IFL') return m.league === 'IFL' || (m.league as string) === 'IL';
      return m.league === activeFilter;
    })
    .sort((a, b) => {
      if (a.statusState === 'in' && b.statusState !== 'in') return -1;
      if (b.statusState === 'in' && a.statusState !== 'in') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const todayStr = new Date().toDateString();
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

  const liveMatches = filteredMatches.filter((m) => m.statusState === 'in');
  const todayMatches = filteredMatches.filter(
    (m) => m.statusState !== 'in' && new Date(m.date).toDateString() === todayStr
  );
  const tomorrowMatches = filteredMatches.filter(
    (m) => m.statusState !== 'in' && new Date(m.date).toDateString() === tomorrowStr
  );
  const otherUpcomingMatches = filteredMatches.filter(
    (m) =>
      m.statusState !== 'in' &&
      new Date(m.date).toDateString() !== todayStr &&
      new Date(m.date).toDateString() !== tomorrowStr
  );

  const trackedCount = matches.filter((m) => m.isTracked).length;

  const formatDateHeading = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const formatMatchTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const renderMatchCard = (match: EspnMatch) => {
    const isLive = match.statusState === 'in';
    const isFT = match.statusState === 'post';

    return (
      <div
        key={match.id}
        className={`p-3 rounded-xl border transition-all select-none flex items-center justify-between gap-3 ${
          match.isTracked
            ? 'bg-rose-50/60 border-rose-300 shadow-xs'
            : 'bg-[#FCFAF6] hover:bg-[#F7F4EE] border-stone-200/90'
        }`}
      >
        {/* Match Teams Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase mb-1">
            <span
              className={`px-1.5 py-0.5 rounded font-black text-[10px] tracking-wide ${
                match.league === 'UCL'
                  ? 'bg-blue-100 text-blue-800'
                  : match.league === 'ISL'
                  ? 'bg-emerald-100 text-emerald-800'
                  : match.league === 'IFL' || match.league === 'IL'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : match.league === 'LL'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : match.league === 'BL'
                  ? 'bg-red-100 text-red-900 border border-red-200'
                  : match.league === 'EFL'
                  ? 'bg-teal-100 text-teal-900 border border-teal-200'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {match.league === 'LL' ? 'Liga' : match.league === 'BL' ? 'BL' : match.league === 'EFL' ? 'EFL' : (match.league === 'IFL' || match.league === 'IL') ? 'IFL' : match.league}
            </span>
            {isLive && (
              <span className="flex items-center gap-1 text-rose-600 bg-rose-100/90 px-1.5 py-0.2 rounded animate-pulse font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                LIVE {match.displayClock}
              </span>
            )}
            {isFT && (
              <span className="text-stone-500 bg-stone-200 px-1.5 py-0.2 rounded font-semibold">
                FT
              </span>
            )}
            {!isLive && !isFT && (
              <span className="text-stone-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {formatMatchTime(match.date)}
              </span>
            )}
          </div>

          {/* Teams and Scores */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-900">
              <div className="flex items-center gap-1.5 min-w-0">
                {match.homeTeam.logo ? (
                  <img
                    src={match.homeTeam.logo}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0"
                    loading="lazy"
                  />
                ) : null}
                <span className="truncate">{match.homeTeam.name}</span>
              </div>
              {(isLive || isFT) && (
                <span className="font-extrabold ml-2 text-stone-950 text-sm">
                  {match.homeTeam.score}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-stone-900">
              <div className="flex items-center gap-1.5 min-w-0">
                {match.awayTeam.logo ? (
                  <img
                    src={match.awayTeam.logo}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0"
                    loading="lazy"
                  />
                ) : null}
                <span className="truncate">{match.awayTeam.name}</span>
              </div>
              {(isLive || isFT) && (
                <span className="font-extrabold ml-2 text-stone-950 text-sm">
                  {match.awayTeam.score}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Track Mode Action Buttons (2-col grid) */}
        <div className="shrink-0 flex flex-col items-end gap-1.5 self-center">
          {/* Row 1: Live & HT/FT */}
          <div className="flex items-center gap-1.5">
            {/* Mode 1: Full Live */}
            <button
              type="button"
              disabled={updatingId === match.id}
              onClick={() =>
                handleSetTrackMode(
                  match,
                  match.isTracked && match.trackMode === 'full' ? 'off' : 'full'
                )
              }
              className={`h-8 w-20 px-2.5 rounded-xl flex items-center justify-center gap-1 text-[11px] font-extrabold transition-all ${
                match.isTracked && match.trackMode === 'full'
                  ? 'bg-rose-600 text-white shadow-xs scale-102 ring-2 ring-rose-400'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200/80'
              }`}
              title={
                match.isTracked && match.trackMode === 'full'
                  ? 'Click to turn off'
                  : '🔥 Full Live: Goal tin, Lineup, VAR, HT & FT auto-posts'
              }
            >
              {updatingId === match.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Flame
                  className={`w-3.5 h-3.5 ${
                    match.isTracked && match.trackMode === 'full'
                      ? 'text-amber-200'
                      : 'text-rose-500'
                  }`}
                />
              )}
              <span>Live</span>
            </button>

            {/* Mode 2: Results Only (HT & FT) */}
            <button
              type="button"
              disabled={updatingId === match.id}
              onClick={() =>
                handleSetTrackMode(
                  match,
                  match.isTracked && match.trackMode === 'results_only' ? 'off' : 'results_only'
                )
              }
              className={`h-8 w-20 px-2.5 rounded-xl flex items-center justify-center gap-1 text-[11px] font-extrabold transition-all ${
                match.isTracked && match.trackMode === 'results_only'
                  ? 'bg-amber-600 text-white shadow-xs scale-102 ring-2 ring-amber-400'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200/80'
              }`}
              title={
                match.isTracked && match.trackMode === 'results_only'
                  ? 'Click to turn off'
                  : '📊 Results Only: Half Time & Full Time result chauh (Goal tin post lovin)'
              }
            >
              {updatingId === match.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock
                  className={`w-3.5 h-3.5 ${
                    match.isTracked && match.trackMode === 'results_only'
                      ? 'text-amber-100'
                      : 'text-amber-600'
                  }`}
                />
              )}
              <span>HT/FT</span>
            </button>
          </div>

          {/* Row 2: Ratings (left) & Photos (right) */}
          <div className="flex items-center gap-1.5">
            {/* Player Ratings */}
            <button
              type="button"
              disabled={updatingId === match.id}
              onClick={() => handleToggleRatings(match)}
              className={`h-6 w-20 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold border transition-all ${
                match.trackRatings
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-extrabold ring-1 ring-amber-400'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80'
              }`}
              title={
                match.trackRatings
                  ? '⭐ Player Ratings enabled (Click to turn off)'
                  : '⭐ Click to enable Player Ratings (Posts 1m after Full Time with fresh photo)'
              }
            >
              <Star
                className={`w-2.5 h-2.5 ${
                  match.trackRatings ? 'text-amber-100 fill-amber-100' : 'text-amber-500'
                }`}
              />
              <span>Ratings</span>
            </button>

            {/* Custom Photos */}
            <button
              type="button"
              onClick={() => openPhotoModal(match)}
              className={`h-6 w-20 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold border transition-all ${
                match.manualHtPhoto || match.manualFtPhoto
                  ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-extrabold ring-1 ring-blue-400'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80'
              }`}
              title="📷 Dah chawp HT & FT Thlalak (Priority 1)"
            >
              <Camera className="w-2.5 h-2.5" />
              <span>
                {match.manualHtPhoto && match.manualFtPhoto
                  ? 'HT+FT 📷'
                  : match.manualHtPhoto
                  ? 'HT 📷'
                  : match.manualFtPhoto
                  ? 'FT 📷'
                  : 'Photos'}
              </span>
            </button>
          </div>

          {/* Row 3: Lineup (under Ratings) & Graphic (under Photos) */}
          <div className="flex items-center gap-1.5">
            {/* Lineup Toggle */}
            <button
              type="button"
              disabled={updatingId === match.id}
              onClick={() => handleToggleLineup(match)}
              className={`h-6 w-20 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold border transition-all ${
                match.trackLineup
                  ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-extrabold ring-1 ring-blue-400'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80'
              }`}
              title={
                match.trackLineup
                  ? 'Click to turn off Lineup tracking'
                  : '👥 Click to enable Lineup: Match tan hma darkar 1-ah Starting XI auto-post-na'
              }
            >
              {updatingId === match.id ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Users
                  className={`w-2.5 h-2.5 ${
                    match.trackLineup
                      ? 'text-blue-100'
                      : 'text-blue-600'
                  }`}
                />
              )}
              <span>Lineup</span>
            </button>

            {/* Custom Graphic Toggle */}
            <button
              type="button"
              disabled={updatingId === match.id}
              onClick={() => handleToggleGraphic(match)}
              className={`h-6 w-20 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold border transition-all ${
                match.useGraphic
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs font-extrabold ring-1 ring-indigo-400'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80'
              }`}
              title={
                match.useGraphic
                  ? '🎨 Graphic enabled: HT & FT ah kan Graphic siamchawp a post ang (Click to turn off)'
                  : '🎨 Click to enable Graphic: HT & FT ah photo zawn lovin kan Graphic siamchawp a post ang'
              }
            >
              <Palette
                className={`w-2.5 h-2.5 ${
                  match.useGraphic ? 'text-indigo-100' : 'text-indigo-600'
                }`}
              />
              <span>Graphic</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-stone-900 flex items-center gap-1.5">
                Live Goal Tracker
                
              </h2>
            </div>
          </div>
        </div>

        {/* Filter & Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({filteredMatches.length})
            </button>
            <button
              onClick={() => setActiveFilter('PL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'PL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              PL
            </button>
            <button
              onClick={() => setActiveFilter('EFL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'EFL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              EFL
            </button>
            <button
              onClick={() => setActiveFilter('LL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'LL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Liga
            </button>
            <button
              onClick={() => setActiveFilter('BL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'BL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              BL
            </button>
            <button
              onClick={() => setActiveFilter('UCL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'UCL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              UCL
            </button>
            <button
              onClick={() => setActiveFilter('ISL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'ISL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ISL
            </button>
            <button
              onClick={() => setActiveFilter('IFL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'IFL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              IFL
            </button>
          </div>

          <button
            onClick={() => fetchMatches(false)}
            disabled={loading}
            className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition"
            title="Refresh Fixtures"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Fixtures List */}
      {loading && matches.length === 0 ? (
        <div className="py-8 text-center text-stone-500 text-xs">
          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-stone-400" />
          <span>Fixtures kan la khawm mek...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-8 text-center text-stone-500 text-xs space-y-1">
          <p className="font-semibold text-stone-700">Darkar 48 chhunga match khelh tur a awm rih lo e.</p>
          <p className="text-[11px] text-stone-400">Matchday a thlen hnaih veleh fixtures a lo in-populate nghal ang.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 1. Live Matches (if any) */}
          {liveMatches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  Live Mek ({liveMatches.length})
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {liveMatches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* 2. Today's Matches */}
          {todayMatches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  {formatDateHeading(new Date().toISOString())} ({todayMatches.length})
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {todayMatches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* 3. Tomorrow's Matches (Separated with clean top divider margin) */}
          {tomorrowMatches.length > 0 && (
            <div className={todayMatches.length > 0 || liveMatches.length > 0 ? "mt-7 pt-5 border-t border-stone-200" : "mb-6"}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {formatDateHeading(new Date(Date.now() + 24 * 3600 * 1000).toISOString())} ({tomorrowMatches.length})
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {tomorrowMatches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* 4. Other Upcoming Matches within 48h (if any) */}
          {otherUpcomingMatches.length > 0 && (
            <div className="mt-7 pt-5 border-t border-stone-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  {otherUpcomingMatches.length > 0 ? formatDateHeading(otherUpcomingMatches[0].date) : 'Upcoming'} ({otherUpcomingMatches.length})
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {otherUpcomingMatches.map(renderMatchCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Status */}
      <div className="mt-3.5 pt-3 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Active Tracked Matches: <strong className="text-stone-800">{trackedCount}</strong>
          </span>
        </span>
        <span>
          Auto-posts to <strong>Inkhel Xtra FB</strong> + <strong>WhatsApp</strong> + <strong>Telegram</strong>
        </span>
      </div>

      {/* Manual HT & FT Photos Modal */}
      {photoModalMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 truncate">
                    {photoModalMatch.homeTeam.name} vs {photoModalMatch.awayTeam.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Half Time (HT) &amp; Full Time (FT) Thlalak Dahna
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePhotoModal}
                className="w-7 h-7 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Notice */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>1st Priority Manual Photos</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Hetah hian thlalak i dah chuan, automated Twitter leh FotMob scraper zawng zawng aiin <strong>1st Priority</strong>-ah a hmang nghal ang. Photo file upload emaw web link paste theih a ni ve ve.
              </p>
            </div>

            {/* 1. Half Time (HT) Photo */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Half Time (HT) Picture
                </span>
                {htPhotoInput && (
                  <button
                    type="button"
                    onClick={() => setHtPhotoInput('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Paih rawh
                  </button>
                )}
              </div>

              {/* URL Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={htPhotoInput.startsWith('data:') ? '(Uploaded Image File)' : htPhotoInput}
                    onChange={(e) => setHtPhotoInput(e.target.value)}
                    disabled={htPhotoInput.startsWith('data:')}
                    placeholder="https://... thlalak link paste rawh"
                    className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-stone-800 disabled:bg-stone-100 disabled:text-stone-500"
                  />
                </div>
                <input
                  type="file"
                  ref={htFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'HT')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => htFileInputRef.current?.click()}
                  className="h-8 px-2.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <Upload className="w-3 h-3 text-stone-500" />
                  Upload
                </button>
              </div>

              {/* Preview Thumbnail */}
              {htPhotoInput && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-stone-300 max-h-36 bg-black/5 flex items-center justify-center">
                  <img
                    src={htPhotoInput}
                    alt="HT Preview"
                    className="max-h-36 w-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* 2. Full Time (FT) Photo */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Full Time (FT) Picture
                </span>
                {ftPhotoInput && (
                  <button
                    type="button"
                    onClick={() => setFtPhotoInput('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Paih rawh
                  </button>
                )}
              </div>

              {/* URL Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={ftPhotoInput.startsWith('data:') ? '(Uploaded Image File)' : ftPhotoInput}
                    onChange={(e) => setFtPhotoInput(e.target.value)}
                    disabled={ftPhotoInput.startsWith('data:')}
                    placeholder="https://... thlalak link paste rawh"
                    className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-stone-800 disabled:bg-stone-100 disabled:text-stone-500"
                  />
                </div>
                <input
                  type="file"
                  ref={ftFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'FT')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => ftFileInputRef.current?.click()}
                  className="h-8 px-2.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <Upload className="w-3 h-3 text-stone-500" />
                  Upload
                </button>
              </div>

              {/* Preview Thumbnail */}
              {ftPhotoInput && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-stone-300 max-h-36 bg-black/5 flex items-center justify-center">
                  <img
                    src={ftPhotoInput}
                    alt="FT Preview"
                    className="max-h-36 w-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={closePhotoModal}
                disabled={savingPhotos}
                className="h-9 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors"
              >
                Kharkhawpna
              </button>
              <button
                type="button"
                onClick={handleSavePhotos}
                disabled={savingPhotos}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                {savingPhotos ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Photos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
