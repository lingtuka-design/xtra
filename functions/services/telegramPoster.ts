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

          console.warn('Telegram sendPhoto failed, falling back to sendMessage:', data.description || res.statusText);
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
