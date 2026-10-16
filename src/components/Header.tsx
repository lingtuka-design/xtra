import React from 'react';
import { Zap, RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenSync: () => void;
  isSyncing: boolean;
  totalPosts: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSync, isSyncing, totalPosts }) => {
  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-md shadow-amber-500/10">
            <Zap className="w-5 h-5 fill-black stroke-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">Xtra</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                Tier-1 Mizo
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
              Premier League Breaking News & Transfers in authentic Mizo
            </p>
          </div>
        </div>

        {/* Status & Sync Button */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Cloudflare Cron Active</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-200 font-semibold">{totalPosts} Posts</span>
          </div>

          <button
            onClick={onOpenSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50"
            title="Trigger manual scraper sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
