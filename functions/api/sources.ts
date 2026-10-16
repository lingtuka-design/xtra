import { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, avatar_url, bio, enabled, created_at FROM sources ORDER BY created_at ASC'
    ).all();

    return Response.json({
      success: true,
      data: results || [],
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
      id: string;
      name?: string;
      avatar_url?: string;
      bio?: string;
      enabled?: boolean | number;
    };

    if (!body.id) {
      return Response.json({ success: false, error: 'Source id (screen name) is required' }, { status: 400 });
    }

    const cleanHandle = body.id.replace(/^@/, '').trim();
    const name = body.name || cleanHandle;
    const enabled = body.enabled === false || body.enabled === 0 ? 0 : 1;

    await env.DB.prepare(
      `INSERT INTO sources (id, name, avatar_url, bio, enabled, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         avatar_url = COALESCE(excluded.avatar_url, sources.avatar_url),
         bio = COALESCE(excluded.bio, sources.bio),
         enabled = excluded.enabled`
    )
      .bind(cleanHandle, name, body.avatar_url || null, body.bio || null, enabled)
      .run();

    return Response.json({
      success: true,
      message: `Source @${cleanHandle} saved successfully`,
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
