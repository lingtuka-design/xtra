import { Env, PostRecord } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
  const source = url.searchParams.get('source');
  const search = url.searchParams.get('search');

  try {
    let query = 'SELECT * FROM posts WHERE 1=1';
    const params: any[] = [];

    if (source) {
      query += ' AND author_handle = ?';
      params.push(source);
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
    if (source) {
      countQuery += ' AND author_handle = ?';
      countParams.push(source);
    }
    if (search && search.trim().length > 0) {
      countQuery += ' AND (mizo_translation LIKE ? OR original_text LIKE ?)';
      countParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    const countRes = await env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return Response.json({
      success: true,
      data: results || [],
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
