import { Env } from '../../types';
import { breakingMonitorService } from '../../services/breakingMonitorService';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    const res = await breakingMonitorService.checkBreakingNews(env);
    return Response.json({ success: true, ...res });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    const res = await breakingMonitorService.checkBreakingNews(env);
    return Response.json({ success: true, ...res });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};
