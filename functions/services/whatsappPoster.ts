export interface WhatsAppPostResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppPoster {
  /**
   * Post news caption and optional photo to a WhatsApp Channel (Newsletter)
   */
  public async postNews(
    caption: string,
    imageUrl: string | undefined | null,
    apiToken?: string,
    channelId?: string,
    apiUrl?: string
  ): Promise<WhatsAppPostResult> {
    try {
      const baseUrl = (apiUrl?.trim() || 'https://xtra-whatsapp-bot.onrender.com').replace(/\/$/, '');
      const token = apiToken?.trim() || 'xtra_secret_2026';
      const targetChannel = channelId?.trim() || '0029Va9TAJnKbYMRVbHZbQ1A';

      // Format channel identifier (do not append @newsletter to alphanumeric invite codes)
      const cleanTarget = targetChannel.trim();
      const match = cleanTarget.match(/channel\/([A-Za-z0-9_-]+)/);
      const to = match ? match[1] : cleanTarget;

      const endpoint = `${baseUrl}/send`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to,
          caption,
          imageUrl: imageUrl || undefined,
          media: imageUrl || undefined,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || (data.success === false)) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }

      return {
        success: true,
        messageId: data.messageId || data.message?.id || data.id,
      };
    } catch (err: any) {
      console.error('WhatsApp Poster error:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

export const whatsappPoster = new WhatsAppPoster();
