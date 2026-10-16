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
    const cleanKey = (apiKey || '').replace(/^\uFEFF/, '').trim();
    if (!cleanKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Prioritize high-availability fast models
    const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

        const prompt = `You are an expert Mizo sports journalist writing for a premier football community on Facebook.

TASK:
Paraphrase and retell the following English football tweet into clean, natural, punchy, and engaging Mizo.

SOURCE / JOURNALIST: ${authorName}
ORIGINAL TWEET:
"${englishText}"

CRITICAL GUIDELINES:
1. PARAPHRASE NATURALLY (NO WORD-BY-WORD TRANSLATION):
   - Never do literal word-by-word translation. English-to-Mizo literal translation sounds broken and unnatural.
   - Paraphrase the core story into fluent, idiomatic, exciting Mizo as spoken and written by top Mizo sports editors (chhiar nuam, fiah, leh ngaihnawm takin).

2. DIRECT QUOTES & STATEMENTS (THUSAWI):
   - If the tweet contains quotes or statements from a player, manager, or journalist (e.g. in quotation marks "..." or "X said..."), translate the exact statement and its meaning faithfully (e.g. 'Arteta chuan: "..." a ti'). Do not alter or omit what was said.

3. PRESERVE FOOTBALL JARGON & STATS IN ENGLISH (DO NOT TRANSLATE STATS TO MIZO):
   - Mizo football fans and media use English for football stats and technical terms. Do NOT attempt to force stats or common football jargon into Mizo.
   - Keep stats and terms in English:
     * Stats: "10 goals, 5 assists", "clean sheet", "hat-trick", "chances created", "pass accuracy", "xG", "tackles", "MOTM"
     * Football terms: "medical", "contract extension", "loan deal", "release clause", "buy option", "starting XI", "bench", "penalty", "free kick", "yellow card", "red card", "offside", "first half", "second half", "full-time"
     * Transfer phrases: "deal sheet", "fee £40m", "personal terms", "agreement reached"

4. EMOJIS & FORMATTING:
   - Begin with an eye-catching header like "🚨 THUTHAR:" or "🚨 BREAKING:" or "🚨 EXCLUSIVE:".
   - Use 2-4 clean football emojis appropriately (e.g. 🚨, ⚽, 📝, 💣, 🤝).
   - STRICT RULE: NEVER include any website links, t.co URLs, or promotions in the text.
   - Return ONLY the final Mizo post text directly. No conversational filler, no explanations, no markdown backticks.`;

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
