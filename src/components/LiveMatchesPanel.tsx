import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, CheckCircle2, Circle, Clock, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface EspnMatch {
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

export const LiveMatchesPanel: React.FC = () => {
  const [matches, setMatches] = useState<EspnMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PL' | 'UCL'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
            setStatusMessage(`⚽ Goal thar ${data.posted} post a ni ta! (Inkhel Xtra FB & WhatsApp-ah a lut nghal e)`);
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

  const handleToggleTrack = async (match: EspnMatch) => {
    const nextState = !match.isTracked;
    setUpdatingId(match.id);
    setStatusMessage(null);

    // Optimistic UI update
    setMatches((prev) =>
      prev.map((m) => (m.id === match.id ? { ...m, isTracked: nextState } : m))
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
          isTracked: nextState,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update tracking');
      }

      setStatusMessage(
        nextState
          ? `🟢 ${match.shortName || match.name} hi track a ni ta! Goal a luh veleh Inkhel Xtra FB & WhatsApp-ah auto-post zel a ni ang.`
          : `⚪ ${match.shortName || match.name} tracking titawp a ni e.`
      );
    } catch (err: any) {
      // Revert optimistic update on failure
      setMatches((prev) =>
        prev.map((m) => (m.id === match.id ? { ...m, isTracked: !nextState } : m))
      );
      alert('Tracking thlak laiin buaina a awm: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (activeFilter === 'ALL') return true;
    return m.league === activeFilter;
  });

  const trackedCount = matches.filter((m) => m.isTracked).length;

  const formatMatchTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
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
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                  UCL & PL ONLY
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Match duh thlang (tick) la, Goal a luh veleh <strong>Inkhel Xtra FB</strong> leh <strong>WhatsApp Channel</strong>-ah auto-post zel a ni ang.
            </p>
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
              All ({matches.length})
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
              onClick={() => setActiveFilter('UCL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'UCL'
                  ? 'bg-white text-stone-950 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              UCL
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
          <span>Premier League leh UCL fixtures kan la khawm mek...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-8 text-center text-stone-500 text-xs space-y-1">
          <p className="font-semibold text-stone-700">Vawiin/Naktukah match a awm rih lo e.</p>
          <p className="text-[11px] text-stone-400">Matchday a thlen veleh fixtures a lo in-populate nghal ang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredMatches.map((match) => {
            const isLive = match.statusState === 'in';
            const isFT = match.statusState === 'post';

            return (
              <div
                key={match.id}
                onClick={() => handleToggleTrack(match)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                  match.isTracked
                    ? 'bg-rose-50/60 border-rose-300 shadow-xs'
                    : 'bg-[#FCFAF6] hover:bg-[#F7F4EE] border-stone-200/90'
                }`}
              >
                {/* Match Teams Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase mb-1">
                    <span
                      className={`px-1.5 py-0.2 rounded ${
                        match.league === 'UCL'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {match.leagueName}
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

                {/* Track Switch Action */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    disabled={updatingId === match.id}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      match.isTracked
                        ? 'bg-rose-600 text-white shadow-xs scale-105'
                        : 'bg-stone-200/80 hover:bg-stone-300 text-stone-600'
                    }`}
                    title={match.isTracked ? 'Click to untrack' : 'Click to track'}
                  >
                    {updatingId === match.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : match.isTracked ? (
                      <CheckCircle2 className="w-5 h-5 fill-white stroke-rose-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-tight ${
                      match.isTracked ? 'text-rose-700' : 'text-stone-400'
                    }`}
                  >
                    {match.isTracked ? 'Tracked' : 'Track'}
                  </span>
                </div>
              </div>
            );
          })}
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
          Auto-posts to <strong>Inkhel Xtra FB</strong> + <strong>WhatsApp</strong>
        </span>
      </div>
    </div>
  );
};
