/**
 * Ensures destination-specific hashtags are included on created/scheduled posts:
 * - Xtra Facebook Page: #inkhelXtra
 * - WhatsApp Channel & Telegram Channel (and Main FB): #inkhel
 * - Skipped automatically if the post contains a YouTube link.
 */

export function isYouTubePost(text?: string | null): boolean {
  if (!text) return false;
  return /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\b/i.test(text);
}

function appendTagSmartly(text: string, tag: string): string {
  const lines = text.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  if (lastLine.startsWith('#') || /(?:^|\s)#\w+/.test(lastLine)) {
    return `${text} ${tag}`;
  }
  return `${text}\n\n${tag}`;
}

export function applyDestinationHashtag(
  caption: string,
  destination: 'fb_xtra' | 'wa' | 'tg' | 'fb_main',
  extraContext?: string | null
): string {
  const trimmed = (caption || '').trim();
  if (!trimmed) return trimmed;

  if (isYouTubePost(trimmed) || isYouTubePost(extraContext)) {
    return trimmed;
  }

  const targetTag = destination === 'fb_xtra' ? '#inkhelXtra' : '#inkhel';

  if (destination === 'fb_xtra') {
    if (/#inkhelxtra\b/i.test(trimmed)) {
      return trimmed;
    }
    return appendTagSmartly(trimmed, targetTag);
  }

  let updated = trimmed.replace(/#inkhelxtra\b/gi, '#inkhel');
  updated = updated.replace(/(#inkhel\b)(\s+#inkhel\b)+/gi, '$1');
  if (/#inkhel\b/i.test(updated)) {
    return updated;
  }
  return appendTagSmartly(updated, targetTag);
}
