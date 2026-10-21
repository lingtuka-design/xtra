import { Env, PostRecord } from '../types';
import { facebookPoster } from '../services/facebookPoster';
import { whatsappPoster } from '../services/whatsappPoster';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as { id: number; skip_whatsapp?: boolean };

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

    // Determine whether this was a scheduled queue item or a direct publish
    const publishSource = post.facebook_status === 'queued' ? 'queue' : 'direct';

    // Update DB with published status & Facebook post ID
    await env.DB.prepare(
      "UPDATE posts SET facebook_status = 'published', publish_source = ?, facebook_post_id = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(publishSource, fbResult.postId, post.id).run();

    // Simultaneously publish to WhatsApp Channel unless skip_whatsapp is true
    let waNotice = '';
    if (!body.skip_whatsapp) {
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
    }

    // Publish to Inkhel.com Main FB Page if requested (TRIO mode)
    let mainFbNotice = '';
    const publishToMainFb = (body as any).publish_main_fb === true;
    if (publishToMainFb) {
      if (env.MAIN_FB_PAGE_ID && env.MAIN_FB_PAGE_ACCESS_TOKEN) {
        try {
          const mainFbResult = await facebookPoster.postNews(
            post.mizo_translation,
            post.primary_image_url,
            env.MAIN_FB_PAGE_ID,
            env.MAIN_FB_PAGE_ACCESS_TOKEN
          );
          if (mainFbResult.success) {
            mainFbNotice = ' & Inkhel.com FB';
          } else {
            console.warn('Main FB Page publish failed:', mainFbResult.error);
          }
        } catch (mainFbErr: any) {
          console.warn('Main FB Page publish error:', mainFbErr.message);
        }
      } else {
        console.warn('MAIN_FB_PAGE_ID or MAIN_FB_PAGE_ACCESS_TOKEN not configured');
      }
    }

    return Response.json({
      success: true,
      postId: fbResult.postId,
      message: `Successfully published to Facebook Page${mainFbNotice}${waNotice}!`,
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
