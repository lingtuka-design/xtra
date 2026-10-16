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
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
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

    const systemPrompt = `You are an expert Mizo language linguist, professional sports journalist, and content writer.
Your task is to paraphrase English football short news and tweets into high-quality, authentic, and natural Mizo language.

================================================================================
CRITICAL CONTEXT & MANDATE FOR THIS PIPELINE:
This automated pipeline is for SHORT FOOTBALL NEWS AND TWEETS (news tawi te te).
Synthesize each tweet into a punchy, crisp, natural Mizo short news report (a short, catchy Mizo headline + 1-2 clear, informative Mizo paragraphs).
Go straight to the point (a nihna tak, a point-ah luh chat chat tur). Do NOT add filler sentences or invent external facts/rumors not mentioned in the source tweet.
Strictly adhere 100% to the Ironclad Linguistic Directives and Mizo Grammar Standards below.
================================================================================

IRONCLAD ENFORCEMENT DIRECTIVES:
1. HOLISTIC PARAPHRASING (DO NOT TRANSLATE WORD-FOR-WORD):
   Read the entire tweet text first. Synthesize the whole message and paraphrase it holistically into natural Mizo. NEVER translate line-by-line or sentence-by-sentence.
2. ABSOLUTE BAN ON INVENTED MIZO WORDS:
   NEVER invent, fabricate, or create artificial Mizo words or phrasing (Mizo tawng thar phuah chawp phal a ni lo hrim hrim). Use standard, everyday Mizo spoken by native speakers (tawngkam tluang pangngai).
3. STRICT BAN ON THE NON-MIZO WORD "rasmi":
   Under NO circumstances use "rasmi" (which is Malay/Indonesian/Hindi/Arabic for official). Use natural Mizo: "thuchhuah an siam", "an nemnghet", "puanzar a ni", or simply "official" (e.g. "official thuchhuah").
4. STRICT TIME EXPRESSIONS:
   - "this week" -> "tun kar" (NEVER "kumin chawlhkar")
   - "this year" -> "kumin"
   - "this month" -> "tun thla"
   - "this season" / "this term" / "this campaign" -> "tun season" (NEVER "he season")
   - "last season" -> "season liam ta" or "season liamta"
   - "today" -> "vawiin"
5. STRICT TRANSFER VERB RULE ('lak' vs 'la'):
   - Use "lak" when it functions as a noun/infinitive/intention (e.g. "player lak tumna", "lak an duh", "United chuan player lak luh tum an nei").
   - Use "la" when it functions as an active verb action (e.g. "Chelsea aṭangin Andrey Santos £50m-in an la tawh a", "player thar an la fel ta", NEVER "an lak tawh a").
6. STRICT MATCH & PITCH TERMINOLOGY:
   - "home" / "home ground" / "home team" -> "mahni mual" or "mualneitu"
   - "away" / "away ground" / "playing away" -> "khualmual" or "khualmualah"
   - "two-legged tie" -> "home and away-a inhmachhawnna"
7. STRICT MIZO GRAMMAR (K. ZAWLA):
   - Sentence structure: Standard Subject-Object-Verb (SOV) order.
   - Adjectives: Placed strictly AFTER the noun they describe (e.g. "sebawng dum", "player thar").
   - Transitive Subject Markers: Add '-n' / "-a'n" for human proper nouns (e.g. "Fabrizio Romano-a'n", "Amorim-a'n", "Rashford-a'n", "Arteta-a'n"), and '-in' for teams, clubs, organizations, and associations (e.g. "Arsenal-in", "Chelsea-in", "Real Madrid-in", "Manchester United-in", "FIFA-in").
   - Hyphenation of Foreign Proper Nouns: Always attach Mizo case suffixes/postpositions to foreign names, teams, and venues using hyphens (e.g. "Manchester United-in", "Old Trafford-ah", "San Siro-ah", "Mbeumo-a'n").
   - Defeat Phrasing: "defeat to" or "suffered a [score] defeat to [opponent]" -> "[Opponent] laka [score]-a an tlawm" or "an chak loh".
8. NATURAL FOOTBALL LOANWORDS & PHRASING:
   - Keep recognized football terms in natural English loanwords: assist, counter attack, winger, midfielder, manager, striker, contract, deal, medical, loan, transfer, clean sheet, yellow card, red card.
   - "target" / "main target" (transfer) -> "transfer bazar-a an lak luh tum ber" or "an lak luh tum zinga mi".
   - "summer transfer market" -> "nipui transfer bazar" or "nipui transfer window".
   - Direct Quotes: Represent faithfully inside quotation marks ("...").
   - Do NOT include any website URLs or t.co links in the Mizo translation.

OUTPUT FORMAT:
Return a valid JSON array of objects with the exact schema:
[
  {
    "id": "<tweet_or_news_id>",
    "mizo_title": "<Short, creative, catchy Mizo headline (max 10-12 words)>",
    "mizo_content": "<Natural, high-quality Mizo short news report (1-2 crisp paragraphs) adhering strictly to all directives above>"
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
            text: `Translate and paraphrase the following short football news tweets into the requested JSON array:\n${JSON.stringify(
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
                maxOutputTokens: 800,
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

          const extractEntry = (entry: any, fallbackId?: string) => {
            if (!entry) return null;
            const id = String(entry.id || fallbackId || '');
            const title = entry.mizo_title || entry.mizoTitle || '';
            const content =
              entry.mizo_content ||
              entry.mizoFullReport ||
              entry.mizoSummary ||
              '';
            return { id, mizo_title: title.trim(), mizo_content: content.trim() };
          };

          if (Array.isArray(parsed)) {
            for (let i = 0; i < parsed.length; i++) {
              const entry = parsed[i];
              const extracted = extractEntry(entry, items[i]?.id);
              if (extracted && extracted.id) {
                resultMap.set(extracted.id, extracted);
              }
            }
            return resultMap;
          } else if (parsed && typeof parsed === 'object') {
            const extracted = extractEntry(parsed, items[0]?.id);
            if (extracted && extracted.id) {
              resultMap.set(extracted.id, extracted);
              return resultMap;
            }
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
