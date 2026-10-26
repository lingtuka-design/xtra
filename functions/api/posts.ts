import { Env, PostRecord } from '../types';
import { facebookPoster } from '../services/facebookPoster';
import { whatsappPoster } from '../services/whatsappPoster';
import { telegramPoster } from '../services/telegramPoster';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 250);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
  const source = url.searchParams.get('source');
  const search = url.searchParams.get('search');
  const fbStatus = url.searchParams.get('fb_status');

  try {
    let query = "SELECT * FROM posts WHERE (facebook_status != 'none' OR tweet_id LIKE 'manual_%')";
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

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all<PostRecord>();

    // When fetching general feed, always include all queued/publishing posts so they never vanish from the queue tab
    let finalData = results || [];
    if (!fbStatus && (!source || source === 'all') && (!search || !search.trim())) {
      const { results: allQueued } = await env.DB.prepare(
        "SELECT * FROM posts WHERE facebook_status IN ('queued', 'publishing') ORDER BY updated_at ASC, id ASC"
      ).all<PostRecord>();

      if (allQueued && allQueued.length > 0) {
        const map = new Map<number, PostRecord>();
        for (const p of finalData) {
          map.set(p.id, p);
        }
        for (const q of allQueued) {
          map.set(q.id, q);
        }
        finalData = Array.from(map.values()).sort((a, b) => b.id - a.id);
      }
    }

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
    const queueCountRes = await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE facebook_status IN ('queued', 'publishing')").first<{ count: number }>();

    return Response.json({
      success: true,
      data: finalData,
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      mizo_translation: string;
      original_text?: string;
      primary_image_url?: string;
      author_name?: string;
      author_handle?: string;
      facebook_status?: 'queued' | 'none';
      publish_now?: boolean;
      skip_whatsapp?: boolean;
      skip_telegram?: boolean;
    };

    if (!body.mizo_translation || !body.mizo_translation.trim()) {
      return Response.json({ success: false, error: 'Mizo caption is required' }, { status: 400 });
    }

    const mizoCaption = body.mizo_translation.trim();
    const originalText = (body.original_text || mizoCaption).trim();
    const photoUrl = body.primary_image_url?.trim() || null;
    const authorName = body.author_name?.trim() || 'Xtra Editorial';
    const authorHandle = body.author_handle?.trim() || 'inkhel_xtra';
    const tweetId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tweetUrl = 'https://www.facebook.com/inkhel.Xtra';
    const initialStatus = body.publish_now ? 'pending' : (body.facebook_status || 'queued');

    let queueTimeStr = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    if (initialStatus === 'queued') {
      const maxRes = await env.DB.prepare(
        "SELECT MAX(updated_at) as max_time FROM posts WHERE facebook_status = 'queued'"
      ).first<{ max_time: string | null }>();

      const parseSqliteUtc = (dateStr?: string | null): number => {
        if (!dateStr) return 0;
        const iso = dateStr.includes('T')
          ? (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
          : dateStr.replace(' ', 'T') + 'Z';
        const t = new Date(iso).getTime();
        return isNaN(t) ? 0 : t;
      };

      const tNow = Date.now();
      const tMax = parseSqliteUtc(maxRes?.max_time);
      const queueTimeMs = Math.max(tNow, tMax + 1000);
      queueTimeStr = new Date(queueTimeMs).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    }

    // Insert into D1
    const insertRes = await env.DB.prepare(
      `INSERT INTO posts (
        tweet_id, author_handle, author_name, author_avatar,
        original_text, mizo_translation, primary_image_url,
        media_urls, tweet_url, tweet_created_at, facebook_post_id,
        facebook_status, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL, ?, NULL, CURRENT_TIMESTAMP, ?)`
    )
      .bind(
        tweetId,
        authorHandle,
        authorName,
        'https://pbs.twimg.com/profile_images/1689000000000000000/madrid_400x400.jpg',
        originalText,
        mizoCaption,
        photoUrl,
        photoUrl ? JSON.stringify([{ url: photoUrl, hd_url: photoUrl, type: 'photo' }]) : JSON.stringify([]),
        tweetUrl,
        initialStatus,
        queueTimeStr
      )
      .run();

    const newPostId = insertRes.meta.last_row_id;
    let publishResult = null;

    if (body.publish_now) {
      if (!env.FB_PAGE_ID || !env.FB_PAGE_ACCESS_TOKEN) {
        throw new Error('Facebook credentials are not configured');
      }

      // Publish immediately to Facebook Page
      const fbRes = await facebookPoster.postNews(
        mizoCaption,
        photoUrl || undefined,
        env.FB_PAGE_ID,
        env.FB_PAGE_ACCESS_TOKEN
      );

      if (fbRes.success) {
        await env.DB.prepare(
          "UPDATE posts SET facebook_status = 'published', publish_source = 'direct', facebook_post_id = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(fbRes.postId, newPostId).run();
        publishResult = { success: true, postId: fbRes.postId };

        // Also broadcast to WhatsApp Channel unless skip_whatsapp is true
        if (!body.skip_whatsapp) {
          try {
            console.log('Broadcasting manual post to WhatsApp Channel...');
            const waRes = await whatsappPoster.postNews(
              mizoCaption,
              photoUrl || undefined,
              env.WHATSAPP_API_TOKEN,
              env.WHATSAPP_CHANNEL_ID,
              env.WHATSAPP_API_URL
            );
            console.log('WhatsApp broadcast result:', waRes);
          } catch (waErr: any) {
            console.error('WhatsApp broadcast failed:', waErr.message);
          }
        }

        // Also broadcast to Telegram Channel unless skip_telegram is true
        if (!body.skip_telegram) {
          try {
            console.log('Broadcasting manual post to Telegram Channel...');
            const tgRes = await telegramPoster.postNews(
              mizoCaption,
              photoUrl || undefined,
              env.TELEGRAM_BOT_TOKEN,
              env.TELEGRAM_CHANNEL_ID
            );
            console.log('Telegram broadcast result:', tgRes);
          } catch (tgErr: any) {
            console.error('Telegram broadcast failed:', tgErr.message);
          }
        }

        // Also broadcast to Main Inkhel.com FB Page if requested (TRIO mode)
        const publishMainFb = (body as any).publish_main_fb === true;
        if (publishMainFb) {
          if (env.MAIN_FB_PAGE_ID && env.MAIN_FB_PAGE_ACCESS_TOKEN) {
            try {
              console.log('Broadcasting manual post to Inkhel.com Main FB Page...');
              const mainFbRes = await facebookPoster.postNews(
                mizoCaption,
                photoUrl || undefined,
                env.MAIN_FB_PAGE_ID,
                env.MAIN_FB_PAGE_ACCESS_TOKEN
              );
              console.log('Main FB broadcast result:', mainFbRes);
            } catch (mainFbErr: any) {
              console.error('Main FB broadcast failed:', mainFbErr.message);
            }
          }
        }
      } else {
        await env.DB.prepare(
          "UPDATE posts SET facebook_status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(fbRes.error || 'Failed to post', newPostId).run();
        return Response.json({
          success: false,
          error: fbRes.error,
          postId: newPostId,
        }, { status: 500 });
      }
    }

    const createdPost = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(newPostId).first();

    return Response.json({
      success: true,
      message: body.publish_now
        ? 'Post published to Facebook Page successfully!'
        : 'Post added to FB Queue successfully!',
      post: createdPost,
      publishResult,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      id?: number;
      action?: 'reorder_queue';
      direction?: 'up' | 'down';
      mizo_translation?: string;
      facebook_status?: 'none' | 'queued' | 'published' | 'failed' | 'publishing';
    };

    // Queue reordering action (Move up / Move down in drip schedule)
    if (body.action === 'reorder_queue') {
      if (!body.id || !body.direction) {
        return Response.json({ success: false, error: 'Post ID and direction are required' }, { status: 400 });
      }

      // Query all queued posts ordered by FIFO
      const { results } = await env.DB.prepare(
        "SELECT id, updated_at, created_at FROM posts WHERE facebook_status = 'queued' ORDER BY updated_at ASC, id ASC"
      ).all<{ id: number; updated_at: string; created_at: string }>();

      const list = results || [];
      const currentIndex = list.findIndex((p) => p.id === body.id);
      if (currentIndex === -1) {
        return Response.json({ success: false, error: 'Post not found in queue' }, { status: 404 });
      }

      const targetIndex = body.direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= list.length) {
        return Response.json({ success: true, message: 'Already at queue boundary' });
      }

      const current = list[currentIndex];
      const target = list[targetIndex];

      const parseSqliteUtc = (dateStr?: string | null): number => {
        if (!dateStr) return 0;
        const iso = dateStr.includes('T')
          ? (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
          : dateStr.replace(' ', 'T') + 'Z';
        const t = new Date(iso).getTime();
        return isNaN(t) ? 0 : t;
      };

      const formatSqliteUtc = (ms: number): string => {
        const d = new Date(ms);
        return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
      };

      const tCurrent = parseSqliteUtc(current.updated_at || current.created_at);
      const tTarget = parseSqliteUtc(target.updated_at || target.created_at);

      let newCurrentTime: string;
      let newTargetTime: string;

      if (body.direction === 'up') {
        if (tCurrent > tTarget) {
          newCurrentTime = target.updated_at || formatSqliteUtc(tTarget);
          newTargetTime = current.updated_at || formatSqliteUtc(tCurrent);
        } else {
          newCurrentTime = formatSqliteUtc(tTarget - 1000);
          newTargetTime = target.updated_at || formatSqliteUtc(tTarget);
        }
      } else {
        if (tTarget > tCurrent) {
          newCurrentTime = target.updated_at || formatSqliteUtc(tTarget);
          newTargetTime = current.updated_at || formatSqliteUtc(tCurrent);
        } else {
          newTargetTime = formatSqliteUtc(tCurrent - 1000);
          newCurrentTime = current.updated_at || formatSqliteUtc(tCurrent);
        }
      }

      await env.DB.batch([
        env.DB.prepare('UPDATE posts SET updated_at = ? WHERE id = ?').bind(newCurrentTime, current.id),
        env.DB.prepare('UPDATE posts SET updated_at = ? WHERE id = ?').bind(newTargetTime, target.id),
      ]);

      const updated = await env.DB.prepare(
        'SELECT * FROM posts WHERE id IN (?, ?)'
      ).bind(current.id, target.id).all<PostRecord>();

      return Response.json({
        success: true,
        message: `Post #${current.id} moved ${body.direction} in queue`,
        updatedPosts: updated.results || [],
      });
    }

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

      if (body.facebook_status === 'queued') {
        updates.push("publish_source = 'queue'");
        // Guarantee newly queued post is placed at the very end of the schedule
        const maxRes = await env.DB.prepare(
          "SELECT MAX(updated_at) as max_time FROM posts WHERE facebook_status = 'queued' AND id != ?"
        ).bind(body.id).first<{ max_time: string | null }>();

        const parseSqliteUtc = (dateStr?: string | null): number => {
          if (!dateStr) return 0;
          const iso = dateStr.includes('T')
            ? (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
            : dateStr.replace(' ', 'T') + 'Z';
          const t = new Date(iso).getTime();
          return isNaN(t) ? 0 : t;
        };

        const formatSqliteUtc = (ms: number): string => {
          const d = new Date(ms);
          return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
        };

        const tNow = Date.now();
        const tMax = parseSqliteUtc(maxRes?.max_time);
        const queueTimeMs = Math.max(tNow, tMax + 1000);
        const queueTimeStr = formatSqliteUtc(queueTimeMs);

        updates.push('updated_at = ?');
        params.push(queueTimeStr);
      }
    }

    if (updates.length === 0) {
      return Response.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    if (body.facebook_status !== 'queued') {
      updates.push('updated_at = CURRENT_TIMESTAMP');
    }
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
