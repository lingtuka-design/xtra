import { Env, PostRecord } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
  const source = url.searchParams.get('source');
  const search = url.searchParams.get('search');
  const fbStatus = url.searchParams.get('fb_status');

  try {
    let query = 'SELECT * FROM posts WHERE 1=1';
    const params: any[] = [];

    if (source && source !== 'all') {
      query += ' AND author_handle = ?';
      params.push(source);
    }

    if (fbStatus) {
      query += ' AND facebook_status = ?';
      params.push(fbStatus);
    }

    if (search && search.trim().length > 0) {
      query += ' AND (mizo_translation LIKE ? OR original_text LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all<PostRecord>();

    // Count total matching
    let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE 1=1';
    const countParams: any[] = [];
    if (source && source !== 'all') {
      countQuery += ' AND author_handle = ?';
      countParams.push(source);
    }
    if (fbStatus) {
      countQuery += ' AND facebook_status = ?';
      countParams.push(fbStatus);
    }
    if (search && search.trim().length > 0) {
      countQuery += ' AND (mizo_translation LIKE ? OR original_text LIKE ?)';
      countParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    const countRes = await env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    // Also get queue count for quick badge display
    const queueCountRes = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE facebook_status = 'queued'").first<{ count: number }>();

    return Response.json({
      success: true,
      data: results || [],
      queueCount: queueCountRes?.count || 0,
      pagination: {
        total: countRes?.total || 0,
        limit,
        offset,
        hasMore: (countRes?.total || 0) > offset + (results?.length || 0),
      },
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

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      id: number;
      mizo_translation?: string;
      facebook_status?: 'none' | 'queued' | 'published' | 'failed';
    };

    if (!body.id) {
      return Response.json({ success: false, error: 'Post ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (body.mizo_translation !== undefined) {
      updates.push('mizo_translation = ?');
      params.push(body.mizo_translation.trim());
    }

    if (body.facebook_status !== undefined) {
      updates.push('facebook_status = ?');
      params.push(body.facebook_status);
    }

    if (updates.length === 0) {
      return Response.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(body.id);

    const sql = `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...params).run();

    // Fetch updated record
    const updatedPost = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(body.id).first<PostRecord>();

    return Response.json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost,
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

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const idParam = url.searchParams.get('id');
    const clearQueueParam = url.searchParams.get('clear_queue');

    // 1. Clear entire FB queue
    if (clearQueueParam === 'true') {
      await env.DB.prepare("UPDATE posts SET facebook_status = 'none', updated_at = CURRENT_TIMESTAMP WHERE facebook_status = 'queued'").run();
      return Response.json({
        success: true,
        message: 'FB Queue cleared successfully',
      });
    }

    let id = idParam ? parseInt(idParam, 10) : null;
    let permanent = url.searchParams.get('permanent') === 'true';

    // Check JSON body if query param not present
    if (!id) {
      try {
        const body = (await request.json()) as any;
        id = body?.id;
        if (body?.permanent !== undefined) {
          permanent = Boolean(body.permanent);
        }
        if (body?.clear_queue) {
          await env.DB.prepare("UPDATE posts SET facebook_status = 'none', updated_at = CURRENT_TIMESTAMP WHERE facebook_status = 'queued'").run();
          return Response.json({
            success: true,
            message: 'FB Queue cleared successfully',
          });
        }
      } catch {}
    }

    if (!id) {
      return Response.json({ success: false, error: 'Post ID is required' }, { status: 400 });
    }

    if (permanent) {
      // Delete post entirely from D1 database
      await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
      return Response.json({
        success: true,
        message: 'Post deleted permanently from database',
        id,
      });
    } else {
      // Just remove from queue (reset status to 'none')
      await env.DB.prepare("UPDATE posts SET facebook_status = 'none', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
      return Response.json({
        success: true,
        message: 'Post removed from FB queue',
        id,
      });
    }
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
