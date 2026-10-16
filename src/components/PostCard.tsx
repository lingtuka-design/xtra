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
  Maximize2,
  Edit3,
  Send,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';

const FacebookIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface PostCardProps {
  post: Post;
  onImageClick: (url: string) => void;
  onPostUpdated?: (updated: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onImageClick, onPostUpdated }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [captionText, setCaptionText] = useState(post.mizo_translation);
  const [isSavingCaption, setIsSavingCaption] = useState(false);

  // Queue and publishing states
  const [isQueueing, setIsQueueing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // Save edited Mizo caption
  const handleSaveCaption = async () => {
    if (!captionText.trim()) return;
    setIsSavingCaption(true);
    setActionError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          mizo_translation: captionText.trim(),
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save caption');
      }

      setIsEditing(false);
      if (onPostUpdated) {
        onPostUpdated({ ...post, mizo_translation: captionText.trim() });
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating caption');
    } finally {
      setIsSavingCaption(false);
    }
  };

  // Toggle in/out of Facebook Queue
  const handleToggleQueue = async (targetStatus: 'queued' | 'none') => {
    setIsQueueing(true);
    setActionError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          facebook_status: targetStatus,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update queue');
      }

      if (onPostUpdated) {
        onPostUpdated({ ...post, facebook_status: targetStatus });
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating queue');
    } finally {
      setIsQueueing(false);
    }
  };

  // 1-Click Instant Post to Facebook Page
  const handlePublishNow = async () => {
    setIsPublishing(true);
    setActionError(null);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Publish failed');
      }

      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          facebook_status: 'published',
          facebook_post_id: data.postId,
        });
      }
    } catch (err: any) {
      setActionError(err.message || 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const isQueued = post.facebook_status === 'queued';
  const isPublished = post.facebook_status === 'published';
  const isFailed = post.facebook_status === 'failed';

  return (
    <article className={`border-b border-zinc-800/80 transition-colors duration-150 p-4 sm:p-5 ${
      isQueued ? 'bg-blue-950/15' : 'bg-zinc-950/40 hover:bg-zinc-900/30'
    }`}>
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

            {/* Badges */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Gemini Mizo
              </span>

              {isQueued && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/50 border border-amber-800/50 px-2.5 py-0.5 rounded-full animate-pulse">
                  <FacebookIcon className="w-3 h-3 text-amber-300" />
                  In FB Queue (Drip 15m)
                </span>
              )}

              {isPublished && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/50 border border-blue-800/50 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                  Published to FB
                </span>
              )}

              {isFailed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-950/50 border border-red-800/50 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  FB Post Error
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

      {/* Mizo Translated News (Main Highlight or Inline Editor) */}
      {isEditing ? (
        <div className="mb-3.5 space-y-2 p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/50">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>✏️ Edit Mizo Caption for Facebook:</span>
            <span>{captionText.length} characters</span>
          </div>
          <textarea
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 leading-relaxed"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setCaptionText(post.mizo_translation);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCaption}
              disabled={isSavingCaption}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSavingCaption ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="group/caption relative text-[15px] sm:text-[16px] leading-relaxed text-zinc-100 font-normal whitespace-pre-line mb-3.5">
          {post.mizo_translation}
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 ml-2 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md opacity-80 hover:opacity-100 transition-opacity"
            title="Edit caption before posting"
          >
            <Edit3 className="w-3 h-3" />
            <span>Siamrem</span>
          </button>
        </div>
      )}

      {/* Action Error message if any */}
      {actionError && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

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

      {/* Action Footer (Facebook Curation & Sharing) */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-900 text-zinc-400 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Facebook Curation Button */}
          {!isPublished && (
            <>
              {isQueued ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePublishNow}
                    disabled={isPublishing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                    title="1-Click immediate publish to Facebook Page"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isPublishing ? 'Posting...' : 'Post to FB Now'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleQueue('none')}
                    disabled={isQueueing}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 text-xs transition-colors"
                    title="Remove from scheduled queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleToggleQueue('queued')}
                  disabled={isQueueing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-blue-950/60 text-zinc-200 hover:text-blue-300 border border-zinc-700/80 hover:border-blue-600/60 font-medium text-xs transition-all shadow-sm disabled:opacity-50"
                  title="Add to Facebook queue (will auto-drip every 15m or post now)"
                >
                  {isQueueing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>+ Add to FB Queue</span>
                </button>
              )}
            </>
          )}

          {isPublished && (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Posted to Facebook
            </span>
          )}

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
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <a
          href={post.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-sky-400 transition-colors flex items-center gap-1 text-[11px]"
        >
          View source &rarr;
        </a>
      </div>
    </article>
  );
};
