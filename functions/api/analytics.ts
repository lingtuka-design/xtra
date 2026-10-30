import { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const rawToken = env.FB_PAGE_ACCESS_TOKEN || '';
  const rawId = env.FB_PAGE_ID || '';
  const cleanToken = rawToken.replace(/^\uFEFF/, '').trim();
  const cleanId = rawId.replace(/^\uFEFF/, '').trim();

  if (!cleanToken || !cleanId) {
    return Response.json(
      { success: false, error: 'Facebook Page credentials not configured in Cloudflare environment' },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch recent feed from Facebook Graph API (up to 100 items)
    // Send cleanToken via Authorization Bearer header to avoid URL encoding/truncation quirks
    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${cleanId}/feed?fields=id,message,created_time,permalink_url,shares,reactions.summary(total_count),comments.summary(total_count)&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'User-Agent': 'Xtra-Analytics/1.0',
        },
      }
    );

    const fbData = (await fbRes.json()) as any;
    if (!fbRes.ok || fbData.error) {
      return Response.json(
        { success: false, error: fbData.error?.message || 'Failed to fetch Facebook Page feed' },
        { status: 500 }
      );
    }

    const rawPosts: any[] = fbData.data || [];

    // Map each post with reactions, comments, shares, total engagements, and IST hour
    const posts = rawPosts.map((p) => {
      const utcDate = new Date(p.created_time);
      // Convert to IST (+5:30)
      const istMs = utcDate.getTime() + (5.5 * 60 * 60 * 1000);
      const istDate = new Date(istMs);
      const istHour = istDate.getUTCHours(); // 0 to 23

      const reactions = p.reactions?.summary?.total_count || 0;
      const comments = p.comments?.summary?.total_count || 0;
      const shares = p.shares?.count || 0;
      const totalEngagement = reactions + comments + shares;

      return {
        id: p.id,
        message: p.message || '',
        createdTime: p.created_time,
        istHour,
        reactions,
        comments,
        shares,
        totalEngagement,
        permalinkUrl: p.permalink_url,
      };
    });

    // 2. Compute Peak Hours (Hourly Engagement Map in IST: 00:00 to 23:00)
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      hourLabel: `${hour.toString().padStart(2, '0')}:00`,
      postsCount: 0,
      totalEngagement: 0,
      avgEngagement: 0,
    }));

    for (const post of posts) {
      const h = post.istHour;
      if (h >= 0 && h < 24) {
        hourlyStats[h].postsCount += 1;
        hourlyStats[h].totalEngagement += post.totalEngagement;
      }
    }

    // Calculate average engagement per post for each hour
    hourlyStats.forEach((h) => {
      h.avgEngagement = h.postsCount > 0 ? Math.round(h.totalEngagement / h.postsCount) : 0;
    });

    // Sort to find peak hours (hours with highest activity/engagement)
    const activeHours = hourlyStats.filter((h) => h.totalEngagement > 0 || h.postsCount > 0);
    const sortedByEngagement = [...hourlyStats].sort((a, b) => b.totalEngagement - a.totalEngagement);
    const topPeakHours = sortedByEngagement.slice(0, 3).filter((h) => h.totalEngagement > 0);

    // 3. Top Performing Posts Rank (sorted by total engagement)
    const topPosts = [...posts]
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 15);

    // Total metrics overview
    const totalEngagements = posts.reduce((sum, p) => sum + p.totalEngagement, 0);
    const totalReactions = posts.reduce((sum, p) => sum + p.reactions, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
    const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);

    return Response.json({
      success: true,
      analyzedPostsCount: posts.length,
      overview: {
        totalEngagements,
        totalReactions,
        totalComments,
        totalShares,
        avgEngagementPerPost: posts.length > 0 ? Math.round(totalEngagements / posts.length) : 0,
      },
      topPeakHours: topPeakHours.map((h) => ({
        hour: h.hour,
        hourLabel: `${h.hour % 12 === 0 ? 12 : h.hour % 12}:00 ${h.hour >= 12 ? 'PM' : 'AM'}`,
        totalEngagement: h.totalEngagement,
        postsCount: h.postsCount,
      })),
      hourlyStats,
      topPosts,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};
