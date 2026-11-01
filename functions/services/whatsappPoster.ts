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
    const baseUrl = (apiUrl?.trim() || 'https://xtra-whatsapp-bot.onrender.com').replace(/\/$/, '');
    const token = apiToken?.trim() || 'xtra_secret_2026';
    const targetChannel = channelId?.trim() || '120363179785749330@newsletter';

    // Map known channel invite code to official numeric JID to prevent resolution failures
    let to = targetChannel.trim();
    if (to.includes('0029Va9TAJnKbYMRVbHZbQ1A') || to === '0029Va9TAJnKbYMRVbHZbQ1A') {
      to = '120363179785749330@newsletter';
    }

    const endpoint = `${baseUrl}/send`;
    let lastError: any = null;

    // Retry loop (2 attempts) to handle Render cold-start wakeups smoothly
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
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
        if (!res.ok || data.success === false) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }

        return {
          success: true,
          messageId: data.messageId || data.message?.id || data.id,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[WhatsApp Poster] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    console.error('WhatsApp Poster all attempts failed:', lastError?.message);
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
    };
  }
}

export const whatsappPoster = new WhatsAppPoster();
