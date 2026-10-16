import { Env } from '../types';

function checkAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const validToken = env.WHATSAPP_API_TOKEN || 'xtra_secret_2026';
  return token === validToken;
}

// GET /api/bot-auth -> Returns all session keys and values from D1
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!checkAuth(request, env)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT key, value FROM whatsapp_sessions'
    ).all<{ key: string; value: string }>();

    const files: Record<string, string> = {};
    for (const r of results || []) {
      files[r.key] = r.value;
    }

    return Response.json({ success: true, files });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

// POST /api/bot-auth -> Saves or deletes session keys
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!checkAuth(request, env)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      updates?: Record<string, string | null>;
    };

    const updates = body.updates || {};
    const statements = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        statements.push(
          env.DB.prepare('DELETE FROM whatsapp_sessions WHERE key = ?').bind(key)
        );
      } else {
        statements.push(
          env.DB.prepare(
            'INSERT OR REPLACE INTO whatsapp_sessions (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
          ).bind(key, value)
        );
      }
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return Response.json({ success: true, count: statements.length });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};
