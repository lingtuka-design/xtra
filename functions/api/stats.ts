import { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const totalPostsRes = await env.DB.prepare('SELECT COUNT(*) as count FROM posts').first<{ count: number }>();
    const fbPublishedRes = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE facebook_status = 'published'").first<{ count: number }>();
    const activeSourcesRes = await env.DB.prepare('SELECT COUNT(*) as count FROM sources WHERE enabled = 1').first<{ count: number }>();
    
    const { results: recentLogs } = await env.DB.prepare(
      'SELECT id, source_handle, status, message, tweets_found, tweets_new, created_at FROM sync_logs ORDER BY created_at DESC LIMIT 5'
    ).all();

    return Response.json({
      success: true,
      stats: {
        totalPosts: totalPostsRes?.count || 0,
        facebookPublished: fbPublishedRes?.count || 0,
        activeSources: activeSourcesRes?.count || 0,
      },
      recentLogs: recentLogs || [],
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
};
