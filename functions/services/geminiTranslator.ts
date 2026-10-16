/**
 * Gemini AI Football News Translator for Mizo language
 * Implements key rotation, model fallback chain, batch translation, and strict Mizo grammar rules.
 */

export interface BatchTranslationItem {
  id: string;
  text: string;
  authorName?: string;
}

export interface TranslatedPost {
  id: string;
  mizo_title?: string;
  mizo_content: string;
}

export class GeminiTranslator {
  private defaultPrimaryKey = (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '';
  private defaultFallbackKey =
    (typeof process !== 'undefined'
      ? process.env?.GEMINI_API_KEY_2 || process.env?.GEMINI_API_KEY_FALLBACK
      : '') || '';

  // Primary model and fallback chain
  private modelChain = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-2.5-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-flash-latest',
  ];

  /**
   * Batch translate multiple tweets in a single Gemini request
   * Free tier optimization: minimizes API calls and token consumption
   */
  public async batchTranslate(
    items: BatchTranslationItem[],
    primaryKey?: string,
    fallbackKey?: string
  ): Promise<Map<string, TranslatedPost>> {
    const resultMap = new Map<string, TranslatedPost>();
    if (!items || items.length === 0) {
      return resultMap;
    }

    const primary = (primaryKey || this.defaultPrimaryKey).replace(/^\uFEFF/, '').trim();
    const fallback = (fallbackKey || this.defaultFallbackKey).replace(/^\uFEFF/, '').trim();

    const keys: string[] = [];
    if (primary) keys.push(primary);
    if (fallback && fallback !== primary) keys.push(fallback);

    const systemPrompt = `You are an expert Mizo sports journalist and editor translating English football news tweets into natural, authentic, punchy Mizo.

STRICT MIZO TRANSLATION & GRAMMAR RULES:
1. Sentence Structure (SOV): Follow standard Mizo Subject-Object-Verb order. Adjectives must strictly follow the nouns they modify.
2. Subject & Agent Markers:
   - For individual humans: use "-n" / "-a'n" (e.g. Fabrizio Romano-a'n, Amorim-a'n, Rashford-a'n).
   - For clubs, teams, organizations: use "-in" (e.g. Chelsea-in, Real Madrid-in, Arsenal-in).
3. Hyphenation of Foreign Proper Nouns:
   - Always attach Mizo case suffixes to foreign names and venues using hyphens (e.g. Old Trafford-ah, San Siro-ah, Pep Guardiola-a hnuaiah).
4. Forbidden Words & Vocabulary Bans:
   - STRICTLY BAN the fake word "rasmi": Never translate "official" as "rasmi". Use standard terms: thuchhuah an siam, an nemnghet, official, or puan a ni.
   - No Fabricated Words: Do not invent synthetic Mizo words for common modern football terms. Keep recognized football jargon naturally (e.g. contract, deal, medical, loan, transfer).
5. Transfer Verb Precision:
   - Use "lak" for nouns/intentions (e.g. player lak tumna, lak an duh).
   - Use "la" for active completed verbs (e.g. player thar an la tawh a).
6. Match & Ground Terms:
   - "Home match/ground" -> mahni mual
   - "Away match/ground" -> khualmual
7. Time Expressions:
   - "this season" -> tun season (NEVER write "he season")
   - "last season" -> season liam ta
   - "this week" -> tun kar
   - "today" -> vawiin
8. Content & Formatting:
   - Direct Quotes: Faithfully translate statements (e.g. 'Arteta chuan: "..." a ti').
   - Keep recognized football stats/terms in English (e.g. 10 goals, 5 assists, clean sheet, hat-trick, xG, starting XI, yellow card, red card).
   - Do NOT include any website URLs or t.co links in the translation.
   - Return a valid JSON array of objects with the exact schema:
[
  {
    "id": "<tweet_or_news_id>",
    "mizo_title": "<Short, catchy Mizo headline if applicable>",
    "mizo_content": "<Flawless, natural Mizo translation adhering to all rules above>"
  }
]`;

    const userPayload = items.map((item) => ({
      id: item.id,
      author: item.authorName || 'Football News',
      text: item.text,
    }));

    const contents = [
      {
        parts: [
          { text: systemPrompt },
          {
            text: `Translate the following short football news tweets into the requested JSON array:\n${JSON.stringify(
              userPayload,
              null,
              2
            )}`,
          },
        ],
      },
    ];

    let lastError: Error | null = null;

    // Model selection and fallback chain: gemini-3.8-flash -> gemini-3.7-flash -> gemini-2.5-flash
    for (const model of this.modelChain) {
      // Key rotation and failover: Primary Key -> Fallback Key
      for (let kIdx = 0; kIdx < keys.length; kIdx++) {
        const currentKey = keys[kIdx];
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (res.status === 429) {
            console.warn(
              `[Gemini] Key #${kIdx + 1} hit rate limit (429) on ${model}. Trying next key or fallback model...`
            );
            continue; // Try next key
          }

          if (res.status === 503 || res.status === 404 || !res.ok) {
            const errBody = await res.text();
            console.warn(
              `[Gemini] ${model} (Key #${kIdx + 1}) returned HTTP ${res.status} (${errBody.substring(0, 100)}). Trying fallback...`
            );
            lastError = new Error(`HTTP ${res.status}: ${errBody}`);
            continue;
          }

          const data = (await res.json()) as any;
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) {
            throw new Error(`Empty response from model ${model}`);
          }

          // Clean response text in case markdown backticks exist
          const cleaned = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/, '')
            .trim();
          const parsed = JSON.parse(cleaned);

          if (Array.isArray(parsed)) {
            for (const entry of parsed) {
              if (entry && entry.id) {
                resultMap.set(String(entry.id), {
                  id: String(entry.id),
                  mizo_title: entry.mizo_title || '',
                  mizo_content: entry.mizo_content || '',
                });
              }
            }
            return resultMap;
          } else if (parsed && typeof parsed === 'object' && parsed.id) {
            resultMap.set(String(parsed.id), {
              id: String(parsed.id),
              mizo_title: parsed.mizo_title || '',
              mizo_content: parsed.mizo_content || '',
            });
            return resultMap;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini] Error with model ${model}:`, err.message);
        }
      }
    }

    if (resultMap.size > 0) {
      return resultMap;
    }

    throw lastError || new Error('All Gemini API keys and models failed');
  }

  /**
   * Single post translation helper with key rotation and fallback
   */
  public async translateToMizo(
    englishText: string,
    authorName: string,
    primaryKey?: string,
    fallbackKey?: string
  ): Promise<string> {
    const singleId = 'single_req';
    const batch = await this.batchTranslate(
      [{ id: singleId, text: englishText, authorName }],
      primaryKey,
      fallbackKey
    );

    const item = batch.get(singleId);
    if (!item || !item.mizo_content) {
      throw new Error('Translation returned empty result');
    }

    if (item.mizo_title && item.mizo_title.trim() && !item.mizo_content.includes(item.mizo_title.trim())) {
      return `${item.mizo_title.trim()}\n\n${item.mizo_content.trim()}`;
    }

    return item.mizo_content.trim();
  }
}

export const geminiTranslator = new GeminiTranslator();
