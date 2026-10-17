/**
 * Comprehensive Mizo Translation & Grammar Guide with User-Provided Reference Examples (1 to 52)
 * Used as source of truth for Gemini AI translation in Xtra.
 */

export const MIZO_RULES_TEXT = `
==================================================
        MIZO TRANSLATION & GRAMMAR RULES
==================================================

1. Sentence Structure (SOV - Subject, Object, Verb):
   Mizo tawng ziah dan phung pangngai (K. Zawla grammar) - Subject hmasak ber, Object a dawt, a tawpah Verb (e.g., "Sakeiin sial a seh").

2. Adjective Placement:
   Adjective chu noun hnungah zel a awm tur a ni (e.g., "sebawng dum", "in lian").

3. Subject Markers (-n / -a'n / -in):
   - Mihring hmingah: -n / -a'n (e.g., Fabrizio Romano-a'n, Amorim-a'n, Carrick-a'n).
   - Team / Club / Pawl / Rannungah: -in (e.g., Manchester United-in, Chelsea-in, Real Madrid-in).

4. Foreign Words leh Hyphen (-):
   Hnam dang hming leh hmun hming zawmah hyphen hman ngei ngei tur (e.g., Old Trafford-ah, San Siro-ah, Pep Guardiola-a hnuaiah).

5. Thumal Khap Bur (Vocabulary Bans):
   - "rasmi" hman khap tlat a ni: "Official" sawi nan "rasmi" tih hman phal a ni lo. Official, an nemnghet, thuchhuah an siam, puan a ni tih hman tur.
   - Tawng thar phuah chawp khap a ni: Football tawngkam pangngai (contract, deal, medical, loan, transfer, assist, counter-attack) te chu a nihna angin hman mai tur.

6. 'lak' leh 'la' Hman Dan Dik:
   - Noun / Tumna sawi nan: "lak" (e.g., player lak luh tumna, lak an duh).
   - Verb / Tih tawh hnu sawi nan: "la" (e.g., player thar an la tawh a, free-in an la bawk a).

7. Khelmual Sawi Dan:
   - Home -> mahni mual / mualneitu
   - Away -> khualmual
   - Two-legged tie -> home and away-a inhmachhawnna

8. Hun Sawi Dan (Time Expressions):
   - "this week" -> tun kar
   - "this year" -> kumin
   - "this month" -> tun thla
   - "this season" / "this term" -> tun season ("he season" tih loh tur)
   - "last season" / "last year" -> season liam ta (European season August-May milin)
   - "today" -> vawiin

9. Mizo tawng tluang pangngai:
   Word-for-word a letling bur lovin, Mizo tawng kalphung dik, chhiar hahdam leh nuam tak turin paraphrase/translate thin tur a ni.

10. Bracket hman loh:
   Mizo tawnga letlin fiah tawk sa rengah bracket hmanga English thumal dah tel kher loh tur a ni.
==================================================
`;

export interface TranslationExample {
  id: number;
  english: string;
  mizoHeadline: string;
  mizoBody: string;
}

export const MIZO_FEW_SHOT_SAMPLES: TranslationExample[] = [
  {
    id: 1,
    english: `Arsenal sign Greece forward Tzolis for £34m. Arsenal have signed "extremely versatile attacking player" Christos Tzolis from Club Brugge for £34m. The 24-year-old Greece international has joined the Premier League champions on a long-term contract.`,
    mizoHeadline: `Arsenal chuan Greece forward Tzolis chu £34m-in an lei`,
    mizoBody: `Arsenal chuan Club Brugge aṭangin "attacking player theihna ngah tak" Christos Tzolis chu £34m-in an lalut fel ta. Kum 24 mi Greece international hian Premier League champion hi contract hun rei tak daih ziakin a zawm a ni.`
  },
  {
    id: 2,
    english: `Arsenal set to make £70m offer for Bruno Guimaraes. Arsenal are set to make a £70m offer for Newcastle captain Bruno Guimaraes. Brazil international Guimaraes is a priority target for the Gunners, with the midfielder keen to join the Premier League champions.`,
    mizoHeadline: `Guimaraes manah Arsenal-in £70m thehchhuah inhuam`,
    mizoBody: `Arsenal chuan Newcastle captain Bruno Guimaraes lakluh nan £70m thehchhuah an inpeih niin report a ni. He Brazil international hi Gunners-in an lakluh duh berte zinga mi a ni a, he midfielder hian Premier League champion zawm hi a duh hle a ni.`
  },
  {
    id: 4,
    english: `Chelsea finalising £52m deal for Crystal Palace’s Maxence Lacroix, set to undergo medical. The France international is scheduled to undergo his medical today before signing a six-year deal that will see him contracted to Chelsea until 2032.`,
    mizoHeadline: `Chelsea chuan £52m-in Crystal Palace player Lacroix an la lut dawn a, medical nei turin an inbuatsaih`,
    mizoBody: `Chelsea chuan Crystal Palace centre-back Maxence Lacroix chu £52million bawr vela lalut turin inbiakna an tifel mek. He France international hian kum 2032 thleng Chelsea-a a chamna tur, kum ruka sei contract a ziah hmain vawiin hian medical a nei dawn a ni.`
  },
  {
    id: 8,
    english: `Roberto Mancini has been appointed Italy manager for a second time - just a day after Andrea Pirlo ruled himself out of the running for the job and technical director Paolo Maldini resigned.`,
    mizoHeadline: `Italy head coach thar Mancini`,
    mizoBody: `Andrea Pirlo-a'n manager hna a lak theih loh thu a puan leh technical director Paolo Maldini a ban hnu ni khat lekah, Roberto Mancini chu a vawi hnih nan Italy manager atan ruat a ni ta.`
  },
  {
    id: 21,
    english: `Real Madrid are close to reaching an agreement with RB Leipzig for the signing of Yan Diomande following lengthy negotiations. Once the deal has been finalised, the Ivory Coast international will be given permission to travel to Madrid to undergo a medical.`,
    mizoHeadline: `Real Madrid leh RB Leipzig te chuan Yan Diomande inleisak chungchangah inremna an nei hnai`,
    mizoBody: `Real Madrid leh RB Leipzig te chuan inbiakna hun rei tak an neih hnuah, Yan Diomande inleisak chungchangah inremna an nei hnai ta hle. He inremna hi tihfel a nih veleh, Ivory Coast international hian medical test paltlang turin Madrid pan phalna a hmu nghal ang.`
  },
  {
    id: 42,
    english: `Premier League champions Arsenal produced a statement win over rivals Manchester City to lift the 2026 Community Shield in Cardiff. Mikel Arteta's side took the lead after just 23 seconds when Myles Lewis-Skelly slipped in Riccardo Calafiori, who slotted an effort past Manchester City goalkeeper Gianluigi Donnarumma.`,
    mizoHeadline: `Community Shield-ah Arsenal an champion`,
    mizoBody: `Premier League champion Arsenal chuan Cardiff-a Community Shield inkhelah an hmelma Manchester City lakah hnehna ropui tak changin nomawi an chawi a. Mikel Arteta-a naute hian inkhel ṭan aṭanga second 23 lek a liam tihin hma an hruai nghal a, Myles Lewis-Skelly-a ball siamsak chu Riccardo Calafiori chuan Manchester City goalkeeper Gianluigi Donnarumma-a man hman lohvin a pet lut a ni.`
  }
];
