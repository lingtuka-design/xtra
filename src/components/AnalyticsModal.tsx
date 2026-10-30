import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Flame, Award, ThumbsUp, MessageSquare, Share2, RefreshCw, X, ExternalLink, BarChart3, Users } from 'lucide-react';

interface PeakHour {
  hour: number;
  hourLabel: string;
  totalEngagement: number;
  postsCount: number;
}

interface AnalyticsPost {
  id: string;
  message: string;
  createdTime: string;
  istHour: number;
  reactions: number;
  comments: number;
  shares: number;
  totalEngagement: number;
  permalinkUrl?: string;
}

interface AnalyticsData {
  success: boolean;
  analyzedPostsCount: number;
  overview: {
    totalEngagements: number;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    avgEngagementPerPost: number;
  };
  topPeakHours: PeakHour[];
  hourlyStats: {
    hour: number;
    hourLabel: string;
    postsCount: number;
    totalEngagement: number;
  }[];
  topPosts: AnalyticsPost[];
}

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json() as any;
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load analytics');
      }
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxHourlyEngagement = data
    ? Math.max(...data.hourlyStats.map((h) => h.totalEngagement), 1)
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] border border-stone-300 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-stone-900">
                  Xtra Facebook Analytics
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                  Page API
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Peak Hours (Mipui luh tam hun) leh Top Performing Posts Ranking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 text-stone-600 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && !data ? (
            <div className="py-16 text-center text-stone-500 space-y-2">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-500" />
              <p className="text-sm font-semibold text-stone-700">Facebook Page data kan chhiar mek...</p>
              <p className="text-xs text-stone-400">Post reaction, comment leh timestamp-te chhut mek a ni.</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
              <p className="font-bold mb-1">Data lak laiin buaina a awm:</p>
              <p>{error}</p>
            </div>
          ) : data ? (
            <>
              {/* 1. Quick Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                    <span>Reactions</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    {data.overview.totalReactions.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Engagement</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    {data.overview.totalEngagements.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Avg/Post</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    ~{data.overview.avgEngagementPerPost}
                  </div>
                </div>

                <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Share2 className="w-3.5 h-3.5 text-purple-500" />
                    <span>Shares</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    {data.overview.totalShares.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 2. Peak Hours Recommendation Banner */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-extrabold text-sm sm:text-base text-stone-900">
                        Peak Posting Hours (Mipui luh tam hun lai)
                      </h4>
                      <span className="text-[10px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md">
                        IST (+5:30)
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                      Kan Page API engagement aṭanga a lannaah, heng hunahte hian mipuiin kan post an hmu hnemin reaction an pe tam ber:
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {data.topPeakHours.length > 0 ? (
                        data.topPeakHours.map((h, i) => (
                          <div
                            key={h.hour}
                            className="flex items-center gap-2 bg-white border border-amber-300 rounded-xl px-3 py-1.5 shadow-2xs"
                          >
                            <span className="w-5 h-5 rounded-lg bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center">
                              #{i + 1}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-stone-900">
                              {h.hourLabel}
                            </span>
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              {h.totalEngagement} eng.
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-stone-500 italic">Data a la tlem rih e.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 24-Hour Activity Chart */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-stone-600" />
                    <h4 className="font-extrabold text-sm text-stone-900">
                      Darkar tin Engagement Activity (24 Hours IST)
                    </h4>
                  </div>
                  <span className="text-[11px] text-stone-400">00:00 - 23:00</span>
                </div>

                <div className="grid grid-cols-12 gap-1 sm:gap-1.5 items-end h-32 pt-2 border-b border-stone-200">
                  {data.hourlyStats
                    .filter((_, idx) => idx % 2 === 0) // sample every 2 hours to fit mobile/desktop nicely
                    .map((h) => {
                      const heightPercent = Math.max(
                        8,
                        Math.round((h.totalEngagement / maxHourlyEngagement) * 100)
                      );
                      const isPeak = data.topPeakHours.some((p) => p.hour === h.hour);

                      return (
                        <div key={h.hour} className="flex flex-col items-center h-full justify-end group">
                          <div className="w-full flex justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-stone-700 mb-1">
                              {h.totalEngagement}
                            </span>
                          </div>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[28px] rounded-t-md transition-all ${
                              isPeak
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : h.totalEngagement > 0
                                ? 'bg-stone-300 hover:bg-stone-400'
                                : 'bg-stone-100'
                            }`}
                            title={`${h.hourLabel} IST: ${h.totalEngagement} engagements (${h.postsCount} posts)`}
                          />
                          <span className="text-[9px] font-semibold text-stone-400 mt-1">
                            {h.hour % 12 === 0 ? 12 : h.hour % 12}
                            {h.hour >= 12 ? 'p' : 'a'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 4. Top Performing Posts Rank */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h4 className="font-extrabold text-sm text-stone-900">
                      Top Performing Posts Rank (Mipui hlut ber berte)
                    </h4>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Reaction & Comment tam dan indawtin
                  </span>
                </div>

                <div className="divide-y divide-stone-100">
                  {data.topPosts.map((post, idx) => (
                    <div
                      key={post.id}
                      className="py-3 flex items-start justify-between gap-3 group hover:bg-stone-50/70 -mx-2 px-2 rounded-xl transition-all"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                            idx === 0
                              ? 'bg-amber-400 text-stone-950 shadow-2xs'
                              : idx === 1
                              ? 'bg-stone-300 text-stone-800'
                              : idx === 2
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          #{idx + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-800 line-clamp-2 leading-relaxed">
                            {post.message || '(Photo/Live post with no caption)'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                            <Clock className="w-3 h-3 text-stone-300" />
                            <span>
                              {new Date(post.createdTime).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              •{' '}
                              {new Date(post.createdTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg text-xs font-bold text-stone-900">
                          <ThumbsUp className="w-3 h-3 text-blue-600 fill-blue-600" />
                          <span>{post.reactions}</span>
                        </div>
                        {post.permalinkUrl && (
                          <a
                            href={post.permalinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-all"
                            title="Facebook-ah en rawh"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-500">
          <span>Xtra Facebook Page API Token hmanga chhut chhuah a ni e.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
