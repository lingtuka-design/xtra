import { Env } from '../types';
import { syncService } from '../services/syncService';

async function handleSync(context: EventContext<Env, any, any>) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Security check: If CRON_SECRET is configured, require either query param or bearer token
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get('Authorization') || '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '');
    const querySecret = url.searchParams.get('secret') || url.searchParams.get('key');

    if (bearer !== env.CRON_SECRET && querySecret !== env.CRON_SECRET) {
      return Response.json(
        {
          success: false,
          error: 'Unauthorized: Invalid or missing CRON_SECRET',
        },
        { status: 401 }
      );
    }
  }

  const targetSource = url.searchParams.get('source') || undefined;

  try {
    const results = await syncService.runSync(env, targetSource);

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
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
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleSync(context);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleSync(context);
};
