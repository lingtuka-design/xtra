import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { ImageModal } from './components/ImageModal';
import { CreatePostCard } from './components/CreatePostCard';
import { LiveMatchesPanel } from './components/LiveMatchesPanel';
import { GraphicMakerPanel } from './components/GraphicMakerPanel';
import { LoginModal } from './components/LoginModal';
import { Post } from './types';
import { Search, AlertCircle, ArrowUp, Clock, PenSquare, Radio, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(() => {
    try {
      const saved = localStorage.getItem('xtra_auth_user');
      const token = localStorage.getItem('xtra_auth_token');
      if (saved && token) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'graphic' | 'create' | 'live' | 'queue' | 'published'>('graphic');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const handleLogout = () => {
    localStorage.removeItem('xtra_auth_token');
    localStorage.removeItem('xtra_auth_user');
    setCurrentUser(null);
  };

  // Fetch only active / queued / published posts from Cloudflare D1
  const fetchPosts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/posts?limit=50');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && Array.isArray(data.data)) {
          setPosts(data.data);
        }
      }
    } catch (err) {
      console.warn('API /api/posts error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(false);

    // Auto-refresh queue and published posts every 25 seconds
    const interval = setInterval(() => {
      fetchPosts(true);
    }, 25000);

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

  // Count scheduled/queued posts
  const queueCount = useMemo(() => {
    return posts.filter((p) => p.facebook_status === 'queued' || p.facebook_status === 'failed').length;
  }, [posts]);

  // Count published posts
  const publishedCount = useMemo(() => {
    return posts.filter((p) => p.facebook_status === 'published').length;
  }, [posts]);

  // FIFO sorted queued posts for drip scheduling
  const queuedSortedList = useMemo(() => {
    return posts
      .filter((p) => p.facebook_status === 'queued')
      .sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeA - timeB;
      });
  }, [posts]);

  // Map queue position & estimate
  const queueInfoMap = useMemo(() => {
    const map = new Map<number, { position: number; estimatedMinutes: number }>();
    queuedSortedList.forEach((post, index) => {
      map.set(post.id, {
        position: index + 1,
        estimatedMinutes: index * 45,
      });
    });
    return map;
  }, [queuedSortedList]);

  // Filter posts based on activeTab (Queue or Published)
  const filteredPosts = useMemo(() => {
    let list = posts.filter((post) => {
      if (activeTab === 'queue' && post.facebook_status !== 'queued' && post.facebook_status !== 'failed') return false;
      if (activeTab === 'published' && post.facebook_status !== 'published') return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      return (
        post.mizo_translation?.toLowerCase().includes(query) ||
        post.original_text?.toLowerCase().includes(query) ||
        post.author_name?.toLowerCase().includes(query)
      );
    });

    if (activeTab === 'queue') {
      list = [...list].sort((a, b) => {
        const posA = queueInfoMap.get(a.id)?.position ?? 9999;
        const posB = queueInfoMap.get(b.id)?.position ?? 9999;
        return posA - posB;
      });
    }

    return list;
  }, [posts, activeTab, searchQuery, queueInfoMap]);

  // Handle reordering of queued posts
  const handleReorderQueue = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = queuedSortedList.findIndex((p) => p.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= queuedSortedList.length) return;

    const currentPost = queuedSortedList[currentIndex];
    const targetPost = queuedSortedList[targetIndex];

    const currentPostTime = currentPost.updated_at || currentPost.created_at;
    const targetPostTime = targetPost.updated_at || targetPost.created_at;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === currentPost.id) return { ...p, updated_at: targetPostTime };
        if (p.id === targetPost.id) return { ...p, updated_at: currentPostTime };
        return p;
      })
    );

    try {
      await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'swap_queue_order',
          postAId: currentPost.id,
          postBId: targetPost.id,
        }),
      });
      fetchPosts(true);
    } catch {
      fetchPosts(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-stone-900 flex flex-col font-sans">
      {!currentUser && (
        <LoginModal
          onLoginSuccess={(token, user) => {
            setCurrentUser(user);
          }}
        />
      )}

      <Header
        onRefresh={() => fetchPosts(false)}
        isRefreshing={loading}
        totalPosts={posts.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Main Column */}
        <main className={`flex-1 min-w-0 w-full mx-auto ${activeTab === 'graphic' ? 'max-w-5xl' : 'max-w-2xl'}`}>
          {/* Top Primary Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFECE6] border border-stone-300/80 rounded-2xl mb-3.5 text-xs font-bold uppercase tracking-wide overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('graphic')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-wide whitespace-nowrap ${
                activeTab === 'graphic'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>GRAPHIC</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-wide whitespace-nowrap ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>CREATE POST</span>
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-wide whitespace-nowrap ${
                activeTab === 'live'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${activeTab === 'live' ? 'animate-pulse' : 'text-rose-600'}`} />
              <span>LIVE MATCHES</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-wide whitespace-nowrap ${
                activeTab === 'queue'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>SCHEDULED</span>
              {queueCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'queue'
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-wide whitespace-nowrap ${
                activeTab === 'published'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>PUBLISHED</span>
              {publishedCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'published'
                      ? 'bg-white text-emerald-800'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {publishedCount}
                </span>
              )}
            </button>
          </div>

          {/* Conditional: Graphic Panel vs Create Post vs Live Matches vs Queue/Published Views */}
          {activeTab === 'live' ? (
            <LiveMatchesPanel />
          ) : activeTab === 'graphic' ? (
            <GraphicMakerPanel onPostCreated={fetchPosts} />
          ) : activeTab === 'create' ? (
            <CreatePostCard
              onPostCreated={handlePostCreated}
              onSwitchToQueue={() => setActiveTab('queue')}
            />
          ) : (
            <>
              {/* FB Queue Explainer Banner when on Queue tab */}
              {activeTab === 'queue' && (
                <div className="p-3 mb-4 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between gap-3 text-xs text-blue-900 shadow-xs">
                  <div className="flex items-center gap-2 font-medium min-w-0">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate sm:whitespace-normal">
                      <strong>Scheduled Queue:</strong> Minute 45 dan zelin Facebook & WhatsApp-ah a in-post ang (Active hours: 7:00 AM – 11:00 PM IST)
                    </span>
                  </div>
                  <span className="font-semibold text-blue-700 bg-white border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap flex-shrink-0 shadow-2xs">
                    {queueCount} queued
                  </span>
                </div>
              )}

              {/* Search Bar for Queue / Published */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-2xl pl-10 pr-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
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
              </div>

              {/* List Container */}
              <div className="border border-stone-200/90 rounded-2xl overflow-hidden bg-white divide-y divide-stone-200/80 shadow-xs">
                {loading && posts.length === 0 ? (
                  <div className="p-12 text-center text-stone-500 space-y-3">
                    <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-stone-200 border-t-amber-500" />
                    <p className="text-sm font-medium text-stone-500">Post lakkhawm mek a ni...</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => {
                    const qPos = queueInfoMap.get(post.id)?.position;
                    const isQ = post.facebook_status === 'queued';
                    const canMoveUp = isQ && typeof qPos === 'number' && qPos > 1;
                    const canMoveDown = isQ && typeof qPos === 'number' && qPos < queuedSortedList.length;

                    return (
                      <PostCard
                        key={post.id || post.tweet_id}
                        post={post}
                        onImageClick={(url) => setSelectedImage(url)}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={handlePostDeleted}
                        queuePosition={qPos}
                        queueEstimatedMinutes={queueInfoMap.get(post.id)?.estimatedMinutes}
                        onMoveUp={() => handleReorderQueue(post.id, 'up')}
                        onMoveDown={() => handleReorderQueue(post.id, 'down')}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                      />
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-stone-500 space-y-3">
                    <AlertCircle className="w-8 h-8 mx-auto text-stone-400" />
                    <p className="text-sm font-medium">
                      {activeTab === 'queue'
                        ? 'Scheduled queue-ah post a awm rih lo! Create Post emaw Graphic aṭangin "+ Add to Queue" i ti thei e.'
                        : 'Post zawn hmuh a awm lo.'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
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
    </div>
  );
}
