import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { Sidebar } from './components/Sidebar';
import { ImageModal } from './components/ImageModal';
import { SyncModal } from './components/SyncModal';
import { Post } from './types';
import { INITIAL_POSTS } from './mockData';
import { Search, AlertCircle, ArrowUp, Send, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function App() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'queue' | 'published'>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const [sources, setSources] = useState<{ id: string; name: string }[]>([
    { id: 'David_Ornstein', name: 'David Ornstein' },
    { id: 'footballontnt', name: 'TNT Sports' },
    { id: 'ESPNUK', name: 'ESPN UK' },
    { id: '433', name: '433' },
    { id: 'MadridXtra', name: 'Madrid Xtra' },
    { id: 'brfootball', name: 'B/R Football' },
    { id: 'Squawka', name: 'Squawka' },
    { id: 'UtdDistrict', name: 'United District' },
  ]);

  // Fetch real posts from Cloudflare D1 via Pages Functions
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts?limit=100');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPosts(data.data);
        } else {
          setPosts(INITIAL_POSTS);
        }
      } else {
        setPosts(INITIAL_POSTS);
      }
    } catch (err) {
      console.warn('API /api/posts unavailable, using sample data:', err);
      setPosts(INITIAL_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setSources(data.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchPosts();
    fetchSources();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostUpdated = (updated: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handlePostDeleted = (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAllQueue = async () => {
    if (
      !window.confirm(
        `FB Queue-a post awm zawng zawng (${queueCount}) hi i paihfai (remove) vek duh tak tak em?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/posts?clear_queue=true', { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.facebook_status === 'queued' ? { ...p, facebook_status: 'none' } : p))
        );
      }
    } catch (e) {
      console.error('Failed to clear queue:', e);
    }
  };

  // Counts
  const queueCount = useMemo(
    () => posts.filter((p) => p.facebook_status === 'queued').length,
    [posts]
  );
  const publishedCount = useMemo(
    () => posts.filter((p) => p.facebook_status === 'published').length,
    [posts]
  );

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // 1. Tab filter
      if (activeTab === 'queue' && post.facebook_status !== 'queued') return false;
      if (activeTab === 'published' && post.facebook_status !== 'published') return false;

      // 2. Source filter
      const matchesSource =
        selectedSource === 'all' ||
        post.author_handle.toLowerCase() === selectedSource.toLowerCase();

      // 3. Search query
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesSource;

      const matchesText =
        post.mizo_translation.toLowerCase().includes(query) ||
        post.original_text.toLowerCase().includes(query) ||
        post.author_name.toLowerCase().includes(query);

      return matchesSource && matchesText;
    });
  }, [posts, activeTab, selectedSource, searchQuery]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <Header
        onOpenSync={() => setSyncModalOpen(true)}
        isSyncing={isSyncing}
        totalPosts={posts.length}
      />

      <div className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 flex gap-6">
        {/* Main Feed Column */}
        <main className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
          {/* Top Primary Tabs: Feed vs FB Queue vs Published */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800/80 rounded-2xl mb-3.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Scraped Feed ({posts.length})
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>📌 FB Queue</span>
              {queueCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'queue' ? 'bg-white text-blue-700' : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                }`}>
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'published'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>✓ Published</span>
              {publishedCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'published' ? 'bg-white text-emerald-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                }`}>
                  {publishedCount}
                </span>
              )}
            </button>
          </div>

          {/* FB Queue Explainer Banner when on Queue tab */}
          {activeTab === 'queue' && (
            <div className="p-3.5 mb-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-transparent border border-blue-800/40 text-xs text-blue-200 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-300 text-[13px]">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Facebook Auto-Drip Scheduler Active ({queueCount} in queue)</span>
                </div>
                {queueCount > 0 && (
                  <button
                    onClick={handleClearAllQueue}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/70 text-rose-300 hover:text-rose-100 text-[11px] font-semibold transition-colors"
                    title="Remove all posts from FB queue"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Queue zawng zawng paihfai rawh</span>
                  </button>
                )}
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Heta post awm ho hi **minute 15 danah 1 zelin** Cloudflare Cron trigger hmangin Facebook Page-ah a post chho zel dawn e. Post nghal duh chu **"Post to FB Now"** hmetin vawi 1 click-in i post nghal thei bawk e!
              </p>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="mb-4 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transfer news, player, or club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Source selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                onClick={() => setSelectedSource('all')}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedSource === 'all'
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                All Sources
              </button>
              {sources.map((s) => {
                const count = posts.filter(
                  (p) => p.author_handle.toLowerCase() === s.id.toLowerCase()
                ).length;
                const isSelected = selectedSource.toLowerCase() === s.id.toLowerCase();
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSource(s.id)}
                    className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-zinc-950 shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <span>@{s.id}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-black/20 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feed Container */}
          <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-950/60 divide-y divide-zinc-800/60 shadow-xl">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id || post.tweet_id}
                  post={post}
                  onImageClick={(url) => setSelectedImage(url)}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            ) : (
              <div className="p-12 text-center text-zinc-500 space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm font-medium">
                  {activeTab === 'queue'
                    ? 'Awm lo rih! Feed atangin "+ Add to FB Queue" hmet la, heta a lo lang ang.'
                    : 'No breaking news matching your search.'}
                </p>
                {activeTab !== 'all' && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    View all feed &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar for Desktop */}
        <Sidebar />
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-full text-zinc-200 shadow-xl backdrop-blur-md transition-all hover:scale-105"
          title="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Full Resolution Photo Lightbox */}
      <ImageModal
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* Scraper Sync Modal */}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSyncSuccess={() => {
          fetchPosts();
        }}
      />
    </div>
  );
}
