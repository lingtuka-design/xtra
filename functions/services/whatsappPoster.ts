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
    apiToken: string,
    channelId: string,
    apiUrl?: string
  ): Promise<WhatsAppPostResult> {
    try {
      const baseUrl = apiUrl?.replace(/\/$/, '') || 'https://gate.whapi.cloud';

      // Format channel identifier
      const cleanTarget = channelId.trim();
      const match = cleanTarget.match(/channel\/([A-Za-z0-9_-]+)/);
      const to = match ? match[1] : (cleanTarget.includes('@') ? cleanTarget : `${cleanTarget}@newsletter`);

      if (imageUrl) {
        // Send image message with caption
        const endpoint = `${baseUrl}/messages/image`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            to,
            media: imageUrl,
            caption: caption,
          }),
        });

        const data = (await res.json()) as any;
        if (!res.ok) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }

        return {
          success: true,
          messageId: data.message?.id || data.id,
        };
      } else {
        // Send pure text message
        const endpoint = `${baseUrl}/messages/text`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            to,
            body: caption,
          }),
        });

        const data = (await res.json()) as any;
        if (!res.ok) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }

        return {
          success: true,
          messageId: data.message?.id || data.id,
        };
      }
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
