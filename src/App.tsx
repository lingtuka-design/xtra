import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { Sidebar } from './components/Sidebar';
import { ImageModal } from './components/ImageModal';
import { SyncModal } from './components/SyncModal';
import { Post } from './types';
import { INITIAL_POSTS } from './mockData';
import { Search, SlidersHorizontal, RefreshCw, AlertCircle, ArrowUp } from 'lucide-react';

export default function App() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Fetch real posts from Cloudflare D1 via Pages Functions
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts?limit=50');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPosts(data.data);
        } else {
          // Keep mock data if DB has no posts yet
          setPosts(INITIAL_POSTS);
        }
      } else {
        // Fallback to initial sample posts in dev mode
        setPosts(INITIAL_POSTS);
      }
    } catch (err) {
      console.warn('API /api/posts unavailable, using sample data:', err);
      setPosts(INITIAL_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSource =
        selectedSource === 'all' ||
        post.author_handle.toLowerCase() === selectedSource.toLowerCase();

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesSource;

      const matchesText =
        post.mizo_translation.toLowerCase().includes(query) ||
        post.original_text.toLowerCase().includes(query) ||
        post.author_name.toLowerCase().includes(query);

      return matchesSource && matchesText;
    });
  }, [posts, selectedSource, searchQuery]);

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
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedSource('all')}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                  selectedSource === 'all'
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                All News ({posts.length})
              </button>
              <button
                onClick={() => setSelectedSource('David_Ornstein')}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                  selectedSource === 'David_Ornstein'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>@David_Ornstein</span>
                <span className="text-[10px] bg-zinc-800/80 px-1.5 py-0.2 rounded-full text-zinc-300">
                  Tier 1
                </span>
              </button>
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
                />
              ))
            ) : (
              <div className="p-12 text-center text-zinc-500 space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm font-medium">No breaking news matching your search.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSource('all');
                  }}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Reset filters
                </button>
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
