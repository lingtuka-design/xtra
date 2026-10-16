import { Env, PostRecord } from '../types';
import { facebookPoster } from '../services/facebookPoster';
import { whatsappPoster } from '../services/whatsappPoster';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as { id: number };

    if (!body.id) {
      return Response.json({ success: false, error: 'Post ID is required' }, { status: 400 });
    }

    if (!env.FB_PAGE_ID || !env.FB_PAGE_ACCESS_TOKEN) {
      return Response.json({
        success: false,
        error: 'Facebook Page credentials not set. Please configure FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN.',
      }, { status: 400 });
    }

    // Fetch the post from D1
    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(body.id).first<PostRecord>();

    if (!post) {
      return Response.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // Call Meta Graph API
    const fbResult = await facebookPoster.postNews(
      post.mizo_translation,
      post.primary_image_url,
      env.FB_PAGE_ID,
      env.FB_PAGE_ACCESS_TOKEN
    );

    if (!fbResult.success) {
      // Record error in DB
      await env.DB.prepare(
        "UPDATE posts SET facebook_status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(fbResult.error || 'Failed to post', post.id).run();

      return Response.json({
        success: false,
        error: fbResult.error,
      }, { status: 500 });
    }

    // Update DB with published status & Facebook post ID
    await env.DB.prepare(
      "UPDATE posts SET facebook_status = 'published', facebook_post_id = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(fbResult.postId, post.id).run();

    // Simultaneously publish to WhatsApp Channel
    let waNotice = '';
    try {
      const waRes = await whatsappPoster.postNews(
        post.mizo_translation,
        post.primary_image_url,
        env.WHATSAPP_API_TOKEN,
        env.WHATSAPP_CHANNEL_ID,
        env.WHATSAPP_API_URL
      );
      if (waRes.success) {
        waNotice = ' & WhatsApp Channel';
      } else {
        console.warn('WhatsApp broadcast failed:', waRes.error);
      }
    } catch (waErr: any) {
      console.warn('WhatsApp broadcast error:', waErr.message);
    }

    return Response.json({
      success: true,
      postId: fbResult.postId,
      message: `Successfully published to Facebook Page${waNotice}!`,
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
