export interface TelegramPostResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_BOT_TOKEN = '8870071622:AAFX5cDesVs40kyAKLOTnmE1-8bFw5XKrf0';
const DEFAULT_CHANNEL_ID = '-1004342755067';

export class TelegramPoster {
  /**
   * Post news caption and optional photo to a Telegram Channel
   */
  public async postNews(
    caption: string,
    imageUrl?: string | null,
    botToken?: string,
    channelId?: string
  ): Promise<TelegramPostResult> {
    try {
      const token = botToken?.trim() || DEFAULT_BOT_TOKEN;
      const targetChat = channelId?.trim() || DEFAULT_CHANNEL_ID;

      if (!token || !targetChat) {
        throw new Error('Telegram bot token or channel ID not configured');
      }

      const cleanText = caption.trim();

      // If imageUrl is provided, attempt sendPhoto
      if (imageUrl && imageUrl.trim()) {
        try {
          const photoUrl = imageUrl.trim();
          // Telegram caption limit is 1024 characters
          const safeCaption = cleanText.length > 1024 ? cleanText.substring(0, 1020) + '...' : cleanText;

          // 1. If base64 data URI (uploaded file from mobile/desktop)
          if (photoUrl.startsWith('data:image/')) {
            const mimeMatch = photoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const ext = mimeType.split('/')[1] || 'jpg';
            const commaIdx = photoUrl.indexOf(',');
            const base64Data = commaIdx !== -1 ? photoUrl.slice(commaIdx + 1) : photoUrl;
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mimeType });

            const formData = new FormData();
            formData.append('chat_id', targetChat);
            formData.append('photo', blob, `photo.${ext}`);
            if (safeCaption) {
              formData.append('caption', safeCaption);
            }

            const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              body: formData,
            });

            const data = (await res.json()) as any;
            if (res.ok && data.ok) {
              return {
                success: true,
                messageId: String(data.result?.message_id),
              };
            }
            console.warn('Telegram sendPhoto (multipart) failed:', data.description || res.statusText);
          } else {
            // 2. Standard HTTP/HTTPS Image URL
            const photoEndpoint = `https://api.telegram.org/bot${token}/sendPhoto`;
            const res = await fetch(photoEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                chat_id: targetChat,
                photo: photoUrl,
                caption: safeCaption,
              }),
            });

            const data = (await res.json()) as any;
            if (res.ok && data.ok) {
              return {
                success: true,
                messageId: String(data.result?.message_id),
              };
            }

            console.warn('Telegram sendPhoto (json) failed, falling back to sendMessage:', data.description || res.statusText);
          }
        } catch (photoErr: any) {
          console.warn('Telegram sendPhoto exception, falling back to sendMessage:', photoErr.message);
        }
      }

      // Fallback or text-only post: sendMessage (up to 4096 characters)
      const messageEndpoint = `https://api.telegram.org/bot${token}/sendMessage`;
      const safeText = cleanText.length > 4096 ? cleanText.substring(0, 4090) + '...' : cleanText;

      const res = await fetch(messageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          chat_id: targetChat,
          text: safeText,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.ok) {
        throw new Error(data.description || `HTTP ${res.status}`);
      }

      return {
        success: true,
        messageId: String(data.result?.message_id),
      };
    } catch (err: any) {
      console.error('Telegram Poster error:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

export const telegramPoster = new TelegramPoster();
