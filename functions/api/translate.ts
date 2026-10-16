import { Env } from '../types';
import { geminiTranslator } from '../services/geminiTranslator';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      englishText: string;
      authorName?: string;
    };

    if (!body.englishText || !body.englishText.trim()) {
      return Response.json({ success: false, error: 'English news text is required' }, { status: 400 });
    }

    if (!env.GEMINI_API_KEY) {
      return Response.json({ success: false, error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const mizoText = await geminiTranslator.translateToMizo(
      body.englishText.trim(),
      body.authorName || 'Xtra Breaking News',
      env.GEMINI_API_KEY
    );

    return Response.json({
      success: true,
      mizoText,
    });
  } catch (err: any) {
    console.error('Translate API error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};
