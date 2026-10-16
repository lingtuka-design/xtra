import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSyncSuccess }) => {
  const [source, setSource] = useState('David_Ornstein');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunSync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let url = source ? `/api/sync?source=${encodeURIComponent(source)}` : '/api/sync';
      if (secret.trim()) {
        url += (url.includes('?') ? '&' : '?') + `secret=${encodeURIComponent(secret.trim())}`;
      }

      const res = await fetch(url, {
        method: 'POST',
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResult(data);
      onSyncSuccess();
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-zinc-100 text-lg">Trigger Scraper Sync</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Source Account
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">⚡ All Active Sources (Batch Sync)</option>
              <option value="David_Ornstein">@David_Ornstein (The Athletic - Premier League)</option>
              <option value="footballontnt">@footballontnt (TNT Sports Football)</option>
              <option value="ESPNUK">@ESPNUK (ESPN UK)</option>
              <option value="433">@433 (Global Football)</option>
              <option value="MadridXtra">@MadridXtra (Real Madrid)</option>
              <option value="brfootball">@brfootball (B/R Football)</option>
              <option value="Squawka">@Squawka (Squawka Stats)</option>
              <option value="UtdDistrict">@UtdDistrict (United District)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              CRON Secret (Optional)
            </label>
            <input
              type="password"
              placeholder="Leave empty if CRON_SECRET not set"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Automated 3-Step Pipeline:
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1. Scrapes original tweet + HD photo from X.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              2. Translates to natural Mizo with Gemini 2.0 / 1.5 Flash.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              3. Posts HD photo to Facebook Page & saves to D1.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <div>{error}</div>
            </div>
          )}

          {result && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                Sync Finished Successfully!
              </div>
              {result.results?.map((r: any, idx: number) => (
                <div key={idx} className="text-zinc-300">
                  @{r.source}: {r.message} ({r.tweetsNew} new saved)
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRunSync}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all shadow-md shadow-amber-500/10 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Sync...
                </>
              ) : (
                'Run Scraper Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
