import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw, Radio, Download, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onOpenSync: () => void;
  isSyncing: boolean;
  totalPosts: number;
  currentUser?: { username: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSync,
  isSyncing,
  totalPosts,
  currentUser,
  onLogout,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App anga dah turin: Browser menu-ah kal la, 'Install app' emaw 'Add to Home screen' tih thlang rawh le!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-stone-950 font-black shadow-xs">
            <Zap className="w-5 h-5 fill-stone-950 stroke-stone-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-stone-900">Xtra</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200/80 text-stone-700 px-1.5 py-0.5 rounded border border-stone-300">
                Tier-1 Mizo
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
              Premier League Breaking News & Transfers in authentic Mizo
            </p>
          </div>
        </div>

        {/* Status & Sync Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-stone-600 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Cloudflare Cron Active</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-900 font-bold">{totalPosts} Posts</span>
          </div>

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-xs hover:shadow transition-all"
              title="Install Xtra on your device as an App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={onOpenSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-50 font-semibold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-xs hover:shadow transition-all disabled:opacity-50"
            title="Trigger manual scraper sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-stone-200/70 hover:bg-rose-100 text-stone-700 hover:text-rose-700 border border-stone-300/80 font-medium text-xs px-2.5 sm:px-3 py-1.5 rounded-full transition-all cursor-pointer"
              title={`Logged in as ${currentUser.username} - Hmet la chhuak rawh`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">{currentUser.username}</span>
              <LogOut className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
