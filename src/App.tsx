import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { Sidebar } from './components/Sidebar';
import { ImageModal } from './components/ImageModal';
import { SyncModal } from './components/SyncModal';
import { CreatePostCard } from './components/CreatePostCard';
import { Post } from './types';
import { INITIAL_POSTS } from './mockData';
import { Search, AlertCircle, ArrowUp, Send, CheckCircle2, Clock, Trash2, PenSquare } from 'lucide-react';

export default function App() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'queue' | 'create' | 'published'>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const [sources, setSources] = useState<{ id: string; name: string }[]>([
    { id: 'FabrizioRomano', name: 'Fabrizio Romano' },
    { id: 'DeadlineDayLive', name: 'Deadline Day Live' },
    { id: 'TheAthleticFC', name: 'The Athletic FC' },
    { id: 'centregoals', name: 'CentreGoals' },
    { id: 'onefootball', name: 'OneFootball' },
    { id: 'brfootball', name: 'B/R Football' },
    { id: 'Squawka', name: 'Squawka' },
    { id: 'UtdDistrict', name: 'United District' },
    { id: 'BBCSport', name: 'BBC Sport' },
    { id: 'David_Ornstein', name: 'David Ornstein' },
  ]);

  // Fetch real posts from Cloudflare D1 via Pages Functions
  const fetchPosts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/posts?limit=100');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPosts(data.data);
        } else if (!silent) {
          setPosts(INITIAL_POSTS);
        }
      } else if (!silent) {
        setPosts(INITIAL_POSTS);
      }
    } catch (err) {
      console.warn('API /api/posts unavailable, using sample data:', err);
      if (!silent) setPosts(INITIAL_POSTS);
    } finally {
      if (!silent) setLoading(false);
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
    fetchPosts(false);
    fetchSources();

    // Live sync polling: auto-refresh every 20s so published posts vanish from queue automatically
    const interval = setInterval(() => {
      fetchPosts(true);
    }, 20000);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostUpdated = (updated: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
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

  // Real-time ticker (updates countdowns every 30s)
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Counts
  const queueCount = useMemo(
    () => posts.filter((p) => p.facebook_status === 'queued' || p.facebook_status === 'failed').length,
    [posts]
  );
  const publishedCount = useMemo(
    () => posts.filter((p) => p.facebook_status === 'published').length,
    [posts]
  );

  const DRIP_INTERVAL_MS = 20 * 60 * 1000;
  const SCHEDULED_START_TIME = new Date('2026-10-16T15:15:00.000Z').getTime(); // Tonight 8:45 PM IST

  // Active queued posts sorted by FIFO order (updated_at ASC, id ASC)
  const queuedSortedList = useMemo(() => {
    return posts
      .filter((p) => p.facebook_status === 'queued')
      .sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.id - b.id;
      });
  }, [posts]);

  // Calculate live position and estimated minutes left for each queued post
  const queueInfoMap = useMemo(() => {
    const map = new Map<number, { position: number; estimatedMinutes: number }>();
    if (queuedSortedList.length === 0) return map;

    // Find the last published post
    const lastPublishedPost = posts
      .filter((p) => p.facebook_status === 'published' && p.updated_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

    const lastPubTime = lastPublishedPost ? new Date(lastPublishedPost.updated_at).getTime() : 0;
    const timeSinceLastPub = lastPubTime ? nowTick - lastPubTime : DRIP_INTERVAL_MS;

    let baseDelay = 1;
    if (nowTick < SCHEDULED_START_TIME) {
      // Waiting for scheduled 8:45 PM launch
      baseDelay = Math.max(1, Math.ceil((SCHEDULED_START_TIME - nowTick) / 60000));
    } else if (timeSinceLastPub < DRIP_INTERVAL_MS) {
      // Waiting for 20-minute gap since last post
      baseDelay = Math.max(1, Math.ceil((DRIP_INTERVAL_MS - timeSinceLastPub) / 60000));
    }

    queuedSortedList.forEach((post, index) => {
      // Each subsequent post in queue is spaced out by 20 minutes
      const estimatedMinutes = baseDelay + (index * 20);

      map.set(post.id, {
        position: index + 1,
        estimatedMinutes,
      });
    });

    return map;
  }, [posts, queuedSortedList, nowTick]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    let list = posts.filter((post) => {
      // 1. Tab filter (include both queued and failed posts in the Queue view)
      if (activeTab === 'queue' && post.facebook_status !== 'queued' && post.facebook_status !== 'failed') return false;
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

    if (activeTab === 'queue') {
      // Order queued posts ascending (FIFO) so #1 (next out) is at the top
      list = [...list].sort((a, b) => {
        const posA = queueInfoMap.get(a.id)?.position ?? 9999;
        const posB = queueInfoMap.get(b.id)?.position ?? 9999;
        return posA - posB;
      });
    }

    return list;
  }, [posts, activeTab, selectedSource, searchQuery, queueInfoMap]);

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-stone-900 flex flex-col font-sans">
      <Header
        onOpenSync={() => setSyncModalOpen(true)}
        isSyncing={isSyncing}
        totalPosts={posts.length}
      />

      <div className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 flex gap-6">
        {/* Main Feed Column */}
        <main className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
          {/* Top Primary Tabs: Feed vs FB Queue vs Published */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFECE6] border border-stone-300/80 rounded-2xl mb-3.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center ${
                activeTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Scraped Feed ({posts.length})
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>📌 FB Queue</span>
              {queueCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'queue' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>✍️ Post</span>
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'published'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>✓ Published</span>
              {publishedCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'published' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {publishedCount}
                </span>
              )}
            </button>
          </div>

          {/* Conditional: Create Post Screen vs Feed Views */}
          {activeTab === 'create' ? (
            <CreatePostCard
              onPostCreated={handlePostCreated}
              onSwitchToQueue={() => setActiveTab('queue')}
            />
          ) : (
            <>
              {/* FB Queue Explainer Banner when on Queue tab */}
              {activeTab === 'queue' && (
            <div className="p-3.5 mb-4 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs text-blue-950 space-y-2 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[13px]">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Facebook Auto-Drip Scheduler Active ({queueCount} in queue)</span>
                </div>
                {queueCount > 0 && (
                  <button
                    onClick={handleClearAllQueue}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 text-[11px] font-semibold transition-colors"
                    title="Remove all posts from FB queue"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Queue zawng zawng paihfai rawh</span>
                  </button>
                )}
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Heta post awm ho hi **minute 20 danah 1 zelin** (Zanin 8:45 PM aṭangin) Facebook Page leh WhatsApp Channel-ah automatic-in a post chho zel dawn e. Post nghal duh chu **"Post to FB Now"** hmetin vawi 1 click-in i post nghal thei bawk e!
              </p>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="mb-4 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transfer news, player, or club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500 hover:text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200"
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
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-xs'
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
                        ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                        : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-xs'
                    }`}
                  >
                    <span>@{s.id}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-black/15 text-stone-950 font-bold' : 'bg-stone-100 text-stone-600 border border-stone-200'
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
          <div className="border border-stone-200/90 rounded-2xl overflow-hidden bg-white divide-y divide-stone-200/80 shadow-xs">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id || post.tweet_id}
                  post={post}
                  onImageClick={(url) => setSelectedImage(url)}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  queuePosition={queueInfoMap.get(post.id)?.position}
                  queueEstimatedMinutes={queueInfoMap.get(post.id)?.estimatedMinutes}
                />
              ))
            ) : (
              <div className="p-12 text-center text-stone-500 space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-stone-400" />
                <p className="text-sm font-medium">
                  {activeTab === 'queue'
                    ? 'Awm lo rih! Feed atangin "+ Add to FB Queue" hmet la, heta a lo lang ang.'
                    : 'No breaking news matching your search.'}
                </p>
                {activeTab !== 'all' && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className="text-xs text-amber-600 hover:underline font-semibold"
                  >
                    View all feed &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
            </>
          )}
        </main>

        {/* Sidebar for Desktop */}
        <Sidebar />
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-full text-stone-700 shadow-lg backdrop-blur-md transition-all hover:scale-105"
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
