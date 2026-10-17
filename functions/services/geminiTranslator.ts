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
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
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

    const systemPrompt = `You are an expert Mizo sports journalist, linguist, and football editor.
Your task is to paraphrase English football news and tweets into natural, authentic, high-quality Mizo language.

==================================================
        MIZO TRANSLATION & GRAMMAR RULES
==================================================

1. Sentence Structure (SOV - Subject, Object, Verb):
   Follow standard Mizo grammar (K. Zawla grammar): Subject first, Object second, and Verb last (e.g., "Sakeiin sial a seh", "Arsenal chuan player an la lut").

2. Adjective Placement:
   Adjectives must strictly follow the noun they modify (e.g., "sebawng dum", "player thar", "inkhel hmuhnawm").

3. Subject Markers (-n / -a'n / -in):
   - Human proper nouns: attach '-n' or "-a'n" (e.g., Fabrizio Romano-a'n, Amorim-a'n, Carrick-a'n, Arteta-a'n, Rashford-a'n).
   - Teams, Clubs, Organizations, Associations: attach '-in' (e.g., Manchester United-in, Chelsea-in, Real Madrid-in, Arsenal-in, FIFA-in, UEFA-in).

4. Foreign Words and Hyphenation (-):
   Always attach Mizo postpositions/case markers to foreign proper nouns, clubs, and stadiums using a hyphen (e.g., Old Trafford-ah, San Siro-ah, Stamford Bridge-ah, Pep Guardiola-a hnuaiah, Mourinho-a squad-ah).

5. Strict Vocabulary Bans:
   - "rasmi" is STRICTLY BANNED: Never use "rasmi" for official. Use natural Mizo: "official", "an nemnghet", "thuchhuah an siam", or "puanzar a ni".
   - NO artificial/invented Mizo words: Use established football loanwords directly: contract, deal, medical, loan, transfer, assist, counter-attack, winger, midfielder, striker, clean sheet, yellow card, red card.

6. Strict Transfer Verb Rule ('lak' vs 'la'):
   - Noun / Intention / Future aim: use "lak" (e.g., "player lak luh tumna", "lak an duh", "lakluh an tum").
   - Completed action / Active verb: use "la" (e.g., "player thar an la tawh a", "free-in an la bawk a", "an la lut fel ta"; NEVER say "an lak tawh a").

7. Pitch & Match Terminology:
   - Home ground / home team -> "mahni mual" or "mualneitu"
   - Away ground / playing away -> "khualmual" or "khualmualah"
   - Two-legged tie -> "home and away-a inhmachhawnna"

8. Time & Season Terminology:
   - "this week" -> "tun kar" (NEVER "kumin chawlhkar")
   - "this year" -> "kumin"
   - "this month" -> "tun thla"
   - "this season" / "this term" / "this campaign" -> "tun season" (NEVER "he season")
   - "last season" / "last year" (in football context) -> "season liam ta" or "season liamta"
   - "today" -> "vawiin"

9. Natural Paraphrasing (Mizo ṭawng tluang pangngai):
   Do NOT translate word-for-word. Synthesize the core news into natural, fluent, easy-to-read Mizo sports journalism. Go straight to the point (a nihna tak, a point-ah luh chat chat tur).

10. No Brackets:
   Do NOT insert bracketed English words when the Mizo phrasing is already clear.

11. Clean Content:
    Do NOT include any Twitter/X links, t.co URLs, or website links in the Mizo translation.

==================================================
FEW-SHOT REFERENCE EXAMPLES (FOLLOW THIS EXACT STYLE):
==================================================

Example 1:
English: "Arsenal sign Greece forward Tzolis for £34m. Arsenal have signed 'extremely versatile attacking player' Christos Tzolis from Club Brugge for £34m on a long-term contract."
Mizo Title: "Arsenal chuan Greece forward Tzolis chu £34m-in an lei"
Mizo Content: "Arsenal chuan Club Brugge aṭangin 'attacking player theihna ngah tak' Christos Tzolis chu £34m-in an lalut fel ta. Kum 24 mi Greece international hian Premier League champion hi contract hun rei tak daih ziakin a zawm a ni."

Example 2:
English: "Arsenal set to make £70m offer for Bruno Guimaraes. Brazil international Guimaraes is a priority target for the Gunners, with the midfielder keen to join the Premier League champions this summer."
Mizo Title: "Guimaraes manah Arsenal-in £70m thehchhuah inhuam"
Mizo Content: "Arsenal chuan Newcastle captain Bruno Guimaraes lakluh nan £70m thehchhuah an inpeih niin report a ni. He Brazil international hi Gunners-in an lakluh duh berte zinga mi a ni a, he midfielder hian Premier League champion zawm hi a duh hle a ni."

Example 3:
English: "Chelsea finalising £52m deal for Crystal Palace’s Maxence Lacroix, set to undergo medical today before signing a six-year deal that will see him contracted to Chelsea until 2032."
Mizo Title: "Chelsea chuan £52m-in Crystal Palace player Lacroix an la lut dawn a, medical nei turin an inbuatsaih"
Mizo Content: "Chelsea chuan Crystal Palace centre-back Maxence Lacroix chu £52million bawr vela lalut turin inbiakna an tifel mek. He France international hian kum 2032 thleng Chelsea-a a chamna tur contract a ziah hmain vawiin hian medical a nei dawn a ni."

Example 4:
English: "Roberto Mancini has been appointed Italy manager for a second time - just a day after Andrea Pirlo ruled himself out of the running for the job and technical director Paolo Maldini resigned."
Mizo Title: "Italy head coach thar Mancini"
Mizo Content: "Andrea Pirlo-a'n manager hna a lak theih loh thu a puan leh technical director Paolo Maldini a ban hnu ni khat lekah, Roberto Mancini chu a vawi hnih nan Italy manager atan ruat a ni ta."

Example 5:
English: "Premier League champions Arsenal produced a statement win over rivals Manchester City to lift the 2026 Community Shield in Cardiff. Mikel Arteta's side took the lead after just 23 seconds when Calafiori slotted past Donnarumma."
Mizo Title: "Community Shield-ah Arsenal an champion"
Mizo Content: "Premier League champion Arsenal chuan Cardiff-a Community Shield inkhelah an hmelma Manchester City lakah hnehna ropui tak changin nomawi an chawi a. Mikel Arteta-a naute hian inkhel ṭan aṭanga second 23 lek a liam tihin hma an hruai nghal a, Myles Lewis-Skelly-a ball siamsak chu Riccardo Calafiori chuan Manchester City goalkeeper Gianluigi Donnarumma-a man hman lohvin a pet lut a ni."

==================================================
OUTPUT FORMAT:
==================================================
Return a valid JSON array of objects with the exact schema:
[
  {
    "id": "<tweet_or_news_id>",
    "mizo_title": "<Short, creative, punchy Mizo headline (max 10-12 words)>",
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

    for (const model of this.modelChain) {
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
                maxOutputTokens: 1500,
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
