import React, { useState } from 'react';
import { Post } from '../types';
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Sparkles,
  Maximize2
} from 'lucide-react';

const FacebookIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface PostCardProps {
  post: Post;
  onImageClick: (url: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onImageClick }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recent';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(post.mizo_translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Xtra — ${post.author_name}`,
        text: post.mizo_translation,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <article className="border-b border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900/30 transition-colors duration-150 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.author_avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}
            alt={post.author_name}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-800 bg-zinc-900 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-zinc-100 text-[15px] truncate hover:underline cursor-pointer">
                {post.author_name}
              </span>
              <span className="inline-flex items-center text-sky-400" title="Tier-1 Verified Journalist">
                <CheckCircle2 className="w-4 h-4 fill-sky-500/20" />
              </span>
              <span className="text-zinc-500 text-xs sm:text-sm truncate">
                @{post.author_handle}
              </span>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-zinc-400 text-xs sm:text-sm font-medium">
                {formatTimeAgo(post.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Gemini Mizo
              </span>
              {post.facebook_status === 'published' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded-full">
                  <FacebookIcon className="w-3 h-3 text-blue-400" />
                  Auto-posted
                </span>
              )}
            </div>
          </div>
        </div>

        <a
          href={post.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-800/60 flex-shrink-0"
          title="Open original tweet on X"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Mizo Translated News (Main Highlight) */}
      <div className="text-[15px] sm:text-[16px] leading-relaxed text-zinc-100 font-normal whitespace-pre-line mb-3.5">
        {post.mizo_translation}
      </div>

      {/* Optional Full HD Photo */}
      {post.primary_image_url && (
        <div className="relative mb-3.5 group rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-900 cursor-zoom-in">
          <img
            src={post.primary_image_url}
            alt="Breaking football update photo"
            loading="lazy"
            onClick={() => onImageClick(post.primary_image_url!)}
            className="w-full max-h-[480px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <div 
            onClick={() => onImageClick(post.primary_image_url!)}
            className="absolute bottom-2 right-2 p-1.5 bg-black/70 backdrop-blur-md rounded-lg text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Expand HD photo"
          >
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Expandable Original English Tweet */}
      <div className="mb-3">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showOriginal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showOriginal ? 'Hide original tweet' : 'View original English tweet'}
        </button>

        {showOriginal && (
          <div className="mt-2.5 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/90 text-zinc-300 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-line">
            <div className="text-[11px] font-sans font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Original Tweet (@{post.author_handle})
            </div>
            {post.original_text}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-zinc-400 text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
            title="Copy Mizo translation"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Mizo</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        <a
          href={post.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-sky-400 transition-colors flex items-center gap-1 text-[11px]"
        >
          View source on X &rarr;
        </a>
      </div>
    </article>
  );
};
