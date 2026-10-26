import React, { useState } from 'react';
import { Post } from '../types';
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ArrowUp,
  ArrowDown,
  Share2, 
  Sparkles,
  Maximize2,
  Edit3,
  Send,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Clock
} from 'lucide-react';

const FacebookIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2 22l4.957-1.397C8.411 21.493 10.147 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

const TelegramIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .42z"/>
  </svg>
);

interface PostCardProps {
  post: Post;
  onImageClick: (url: string) => void;
  onPostUpdated?: (updated: Post) => void;
  onPostDeleted?: (id: number) => void;
  queuePosition?: number;
  queueEstimatedMinutes?: number;
  queueScheduledTime?: string;
  isNightPaused?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onImageClick,
  onPostUpdated,
  onPostDeleted,
  queuePosition,
  queueEstimatedMinutes,
  queueScheduledTime,
  isNightPaused,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [captionText, setCaptionText] = useState(post.mizo_translation);
  const [isSavingCaption, setIsSavingCaption] = useState(false);

  // Queue and publishing states
  const [isQueueing, setIsQueueing] = useState(false);
  const [publishingTarget, setPublishingTarget] = useState<'both' | 'fb_only' | 'quad' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const parseUtcDate = (dateStr?: string | null): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('+0000')) return new Date(dateStr);
    const iso = dateStr.includes('T')
      ? (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
      : dateStr.replace(' ', 'T') + 'Z';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date(dateStr) : d;
  };

  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return 'Just now';
    try {
      const date = parseUtcDate(dateStr);
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

  const formatQueueTime = (
    scheduledTime?: string,
    isNight?: boolean
  ) => {
    if (!scheduledTime) return 'Scheduled';
    if (scheduledTime === 'In-post mek...') {
      return 'In-post mek...';
    }
    if (isNight) {
      return `Zing ${scheduledTime}`;
    }
    return `Scheduled: ${scheduledTime}`;
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

      if (onPostUpdated && data.post) {
        onPostUpdated(data.post);
      } else if (onPostUpdated) {
        onPostUpdated({ ...post, facebook_status: targetStatus });
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating queue');
    } finally {
      setIsQueueing(false);
    }
  };

  // 1-Click Instant Post (either to FB Only, Both FB & WhatsApp & Telegram (X/W/T), or QUAD)
  const handlePublishNow = async (target: 'both' | 'fb_only' | 'quad' = 'both') => {
    setPublishingTarget(target);
    setActionError(null);

    const skipWhatsApp = target === 'fb_only';
    const skipTelegram = target === 'fb_only';
    const publishMainFb = target === 'quad';

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          skip_whatsapp: skipWhatsApp,
          skip_telegram: skipTelegram,
          publish_main_fb: publishMainFb,
        }),
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
      setPublishingTarget(null);
    }
  };

  // Permanently delete post from D1 database
  const handleDeletePost = async () => {
    if (!window.confirm('He post hi D1 database atangin i paih (delete) hlen duh tak tak em?')) {
      return;
    }
    setIsDeleting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/posts?id=${post.id}&permanent=true`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete post');
      }

      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const isQueued = post.facebook_status === 'queued';
  const isPublished = post.facebook_status === 'published';
  const isFailed = post.facebook_status === 'failed';
  const isPublishing = post.facebook_status === 'publishing';

  return (
    <article className={`border-b border-stone-200/80 transition-colors duration-150 p-4 sm:p-5 ${
      isQueued || isPublishing ? 'bg-blue-50/50' : 'bg-white hover:bg-[#FAF9F5]'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.author_avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}
            alt={post.author_name}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-stone-200 bg-stone-100 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-stone-900 text-[15px] truncate hover:underline cursor-pointer">
                {post.author_name}
              </span>
              <span className="inline-flex items-center text-sky-600" title="Tier-1 Verified Journalist">
                <CheckCircle2 className="w-4 h-4 fill-sky-500/20" />
              </span>
              <span className="text-stone-500 text-xs sm:text-sm truncate">
                @{post.author_handle}
              </span>
              <span className="text-stone-300 text-xs">•</span>
              <span className="text-stone-500 text-xs sm:text-sm font-medium">
                {formatTimeAgo(post.tweet_created_at || post.created_at)}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Gemini Mizo
              </span>

              {isQueued && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-950 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs"
                  title={queueEstimatedMinutes ? `In-post hun tur: ${queueScheduledTime || ''} (~${queueEstimatedMinutes}m left)` : undefined}
                >
                  <Clock className="w-3 h-3 text-amber-700 animate-pulse flex-shrink-0" />
                  {queuePosition ? (
                    <span>
                      {queuePosition === 1 ? 'Next in queue' : `Queue #${queuePosition}`}{' '}
                      <span className="font-bold text-amber-900">
                        ({formatQueueTime(queueScheduledTime, isNightPaused)})
                      </span>
                    </span>
                  ) : (
                    <span>Scheduled ({formatQueueTime(queueScheduledTime, isNightPaused)})</span>
                  )}
                </span>
              )}

              {isPublishing && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-950 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Loader2 className="w-3 h-3 text-amber-700 animate-spin flex-shrink-0" />
                  <span>In-post mek...</span>
                </span>
              )}

              {isPublished && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  Published to FB
                </span>
              )}

              {isFailed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  FB Post Error
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Queue Reorder buttons (Move Up / Move Down in Schedule) */}
          {isQueued && (onMoveUp || onMoveDown) && (
            <div className="flex items-center bg-stone-100 hover:bg-stone-200/60 border border-stone-200 rounded-lg p-0.5 transition-colors">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.();
                }}
                disabled={!canMoveUp}
                className="p-1 rounded text-stone-600 hover:text-stone-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                title={canMoveUp ? "A hmasa zawk tura sawn chhohna (Move Up)" : "A chung berah a awm tawh"}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                disabled={!canMoveDown}
                className="p-1 rounded text-stone-600 hover:text-stone-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                title={canMoveDown ? "A hnuhnung zawk tura sawn thlakna (Move Down)" : "A hnuaiah midang an awm lo"}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <a
            href={post.tweet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-stone-700 transition-colors p-1.5 rounded-lg hover:bg-stone-100 flex-shrink-0"
            title="Open original tweet on X"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Mizo Translated News (Main Highlight or Inline Editor) */}
      {isEditing ? (
        <div className="mb-4 space-y-3 p-4 sm:p-5 rounded-2xl bg-[#FCFAF6] border border-amber-400/80 shadow-xs">
          <div className="flex items-center justify-between text-xs sm:text-sm text-amber-900 font-semibold">
            <span className="flex items-center gap-1.5">
              <span>✏️</span>
              <span>Facebook Caption Siamremna:</span>
            </span>
            <span className="text-stone-500 text-xs font-normal">
              {captionText.length} characters
            </span>
          </div>
          <textarea
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            rows={8}
            className="w-full bg-white border border-stone-300 rounded-xl p-4 text-[15px] sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 leading-relaxed font-normal min-h-[200px] sm:min-h-[260px] resize-y shadow-inner"
            placeholder="Type Mizo caption here..."
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              💡 Paragraph duhin Enter hmet la, duh tawkin a hnuaiah hian a pawtsei (resize) theih bawk e.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  setCaptionText(post.mizo_translation);
                  setIsEditing(false);
                }}
                className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCaption}
                disabled={isSavingCaption}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSavingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="group/caption relative text-[15px] sm:text-[16px] leading-relaxed text-stone-900 font-normal whitespace-pre-line mb-3.5">
          {post.mizo_translation}
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 ml-2 text-xs text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/70 border border-amber-300/80 px-2 py-0.5 rounded-md opacity-80 hover:opacity-100 transition-opacity"
            title="Edit caption before posting"
          >
            <Edit3 className="w-3 h-3" />
            <span>Siamrem</span>
          </button>
        </div>
      )}

      {/* Action or Background Error message */}
      {(actionError || (isFailed && post.error_message)) && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-red-900">Facebook Post A Hlawhchham (Error):</span>
            <span className="text-red-700 block mt-0.5">{actionError || post.error_message}</span>
          </div>
        </div>
      )}

      {/* Optional Full HD Photo */}
      {post.primary_image_url && (
        <div className="relative mb-3.5 group rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 cursor-zoom-in">
          <img
            src={post.primary_image_url}
            alt="Breaking football update photo"
            loading="lazy"
            onClick={() => onImageClick(post.primary_image_url!)}
            className="w-full max-h-[480px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <div 
            onClick={() => onImageClick(post.primary_image_url!)}
            className="absolute bottom-2 right-2 p-1.5 bg-stone-900/70 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
        >
          {showOriginal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showOriginal ? 'Hide original tweet' : 'View original English tweet'}
        </button>

        {showOriginal && (
          <div className="mt-2.5 p-3 rounded-xl bg-[#F5F3EC] border border-stone-200 text-stone-700 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-line">
            <div className="text-[11px] font-sans font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Original Tweet (@{post.author_handle})
            </div>
            {post.original_text}
          </div>
        )}
      </div>

      {/* Action Footer (Facebook Curation & Sharing) */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-stone-600 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Facebook Curation Button */}
          {!isPublished && (
            <>
              {isPublishing ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Post mek a ni...</span>
                </div>
              ) : isFailed ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handlePublishNow('both')}
                    disabled={publishingTarget !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
                    title="Retry publishing now"
                  >
                    {publishingTarget !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FacebookIcon className="w-3.5 h-3.5" />}
                    <span>Retry FB Now</span>
                  </button>
                  <button
                    onClick={() => handleToggleQueue('queued')}
                    disabled={isQueueing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-medium transition-colors disabled:opacity-50"
                    title="Re-add to queue"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Queue-ah dah leh rawh</span>
                  </button>
                </div>
              ) : isQueued ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handlePublishNow('both')}
                    disabled={publishingTarget !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
                    title="1-Click immediate publish to Facebook, WhatsApp & Telegram"
                  >
                    {publishingTarget === 'both' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <FacebookIcon className="w-3.5 h-3.5" />
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        <TelegramIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span>{publishingTarget === 'both' ? 'Posting...' : 'Post Now'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleQueue('none')}
                    disabled={isQueueing}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors"
                    title="Remove from scheduled queue"
                  >
                    {isQueueing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Queue atanga paih</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                  {/* QUAD: Post to Inkhel Xtra FB + Inkhel.com Main FB + WhatsApp + Telegram */}
                  <button
                    onClick={() => handlePublishNow('quad')}
                    disabled={publishingTarget !== null}
                    className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 whitespace-nowrap min-w-0"
                    title="Xtra Facebook + Inkhel.com Facebook + WhatsApp Channel + Telegram Channel a ruala post na"
                  >
                    {publishingTarget === 'quad' && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>QUAD</span>
                  </button>

                  <button
                    onClick={() => handleToggleQueue('queued')}
                    disabled={isQueueing}
                    className="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-medium text-xs transition-all shadow-xs disabled:opacity-50 whitespace-nowrap min-w-0"
                    title="Add to Facebook queue (posts to Xtra FB, WhatsApp & Telegram)"
                  >
                    {isQueueing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>+ Schedule</span>
                  </button>

                  {/* Post to FB Only */}
                  <button
                    onClick={() => handlePublishNow('fb_only')}
                    disabled={publishingTarget !== null}
                    className="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 whitespace-nowrap min-w-0"
                    title="Facebook Page chiaha post na (No WhatsApp/Telegram)"
                  >
                    {publishingTarget === 'fb_only' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FacebookIcon className="w-3.5 h-3.5" />
                    )}
                    <span>Xtra FB</span>
                  </button>

                  {/* Post to Xtra FB, WhatsApp & Telegram (X/W/T) */}
                  <button
                    onClick={() => handlePublishNow('both')}
                    disabled={publishingTarget !== null}
                    className="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 whitespace-nowrap min-w-0"
                    title="Facebook Page, WhatsApp Channel, leh Telegram Channel-a post rualna"
                  >
                    {publishingTarget === 'both' && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>X/W/T</span>
                  </button>
                </div>
              )}
            </>
          )}

          {isPublished && (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Posted to Facebook
            </span>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
            title="Copy Mizo translation"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied!</span>
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete completely button */}
          <button
            onClick={handleDeletePost}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
            title="Delete this post completely from Xtra database"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px]">Delete</span>
          </button>
        </div>

        <a
          href={post.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-1 text-[11px]"
        >
          View source &rarr;
        </a>
      </div>
    </article>
  );
};
