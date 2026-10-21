import { Env } from '../../types';

const VALID_USER = 'lingtuka';
const VALID_PASS = 'MAWLA1984@mala';

// A simple HMAC-like or signature hash for token
async function generateToken(user: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret + '_xtra_auth_salt_2026');
  const msgData = enc.encode(user + ':' + Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30))); // valid for ~30 days window
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${user}.${hex}`;
}

export async function verifyToken(token: string | null | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [user] = parts;
  if (user !== VALID_USER) return false;

  const expectedToken = await generateToken(user, secret);
  return token === expectedToken;
}

// POST /api/auth/login
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = (body.username || '').trim();
    const password = body.password || '';

    // Extract Cloudflare client IP & geo location details
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const city = (request as any).cf?.city || 'unknown';
    const region = (request as any).cf?.region || (request as any).cf?.regionCode || 'unknown';
    const country = (request as any).cf?.country || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (username === VALID_USER && password === VALID_PASS) {
      const secret = env.CRON_SECRET || 'xtra_default_secret_key_2026';
      const token = await generateToken(username, secret);

      // Record successful login
      try {
        await env.DB.prepare(
          'INSERT INTO access_logs (ip, city, region, country, user_agent, action) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(ip, city, region, country, userAgent, 'login_success').run();
      } catch (logErr) {
        console.warn('Logging error:', logErr);
      }

      return Response.json({
        success: true,
        user: { username: VALID_USER },
        token,
      });
    }

    // Record failed login attempt
    try {
      await env.DB.prepare(
        'INSERT INTO access_logs (ip, city, region, country, user_agent, action) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(ip, city, region, country, userAgent, `failed_login: user=${username}`).run();
    } catch (logErr) {
      console.warn('Logging error:', logErr);
    }

    return Response.json(
      { success: false, error: 'Username emaw password a dik lo!' },
      { status: 401 }
    );
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

// GET /api/auth/login -> verify current token
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const secret = env.CRON_SECRET || 'xtra_default_secret_key_2026';
  const isValid = await verifyToken(token, secret);

  if (isValid) {
    return Response.json({ success: true, user: { username: VALID_USER } });
  }

  return Response.json({ success: false, error: 'Session expired' }, { status: 401 });
};
