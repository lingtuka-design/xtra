/**
 * Gemini AI Football News Translator for Mizo language
 * Using Google AI Studio Free Tier (gemini-2.0-flash / gemini-1.5-flash)
 */
export class GeminiTranslator {
  /**
   * Translate English football news tweet to engaging, authentic Mizo language
   */
  public async translateToMizo(
    englishText: string,
    authorName: string,
    apiKey: string
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Try gemini-3.8-flash first, fallback to gemini-2.5-flash and gemini-flash-latest
    const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const prompt = `You are a Tier-1 sports journalist writing breaking football news for a Mizo football community Facebook page.
Translate the following English football transfer or breaking news tweet into clean, authentic, punchy, and engaging Mizo language.

Journalist / Source: ${authorName}
Tweet Text:
"${englishText}"

Requirements:
1. Tone & Style: Natural, authoritative, and engaging Mizo (chhiar nuam, tawi fel, fiah em em).
2. Phrasing examples:
   - "🚨 THUTHAR / EXCLUSIVE:"
   - "Arsenal chuan...", "Chelsea nen inremna an nei fel ta...", "Medical an nei dawn..."
   - "Fee £40m vel a ni...", "Kum 5 daih contract a ziak ang..."
3. Emojis: Use 2-4 clean football emojis naturally (e.g. 🚨, ⚽, 📝, 💣, 🤝).
4. STRICT RULE: DO NOT include any website links, t.co URLs, or promotions in the text.
5. Return ONLY the translated Mizo post text directly. No explanations, no markdown ticks, no metadata.`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini API error (${model} - HTTP ${res.status}): ${errText}`);
        }

        const data = (await res.json()) as any;
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate || candidate.trim().length === 0) {
          throw new Error(`Gemini response was empty (${model})`);
        }

        return candidate.trim();
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed with ${model}, trying next if available:`, err.message);
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }
}

export const geminiTranslator = new GeminiTranslator();
