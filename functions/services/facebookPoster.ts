/**
 * Meta Graph API Facebook Page Auto-Poster
 * Posts native HD photo + Mizo caption directly to Facebook Page.
 * Strictly avoids external links in captions to maximize Facebook organic reach.
 */
export class FacebookPoster {
  private readonly GRAPH_API_VERSION = 'v21.0';

  /**
   * Post a news item to Facebook Page
   * @param caption Mizo translated text (clean of external links)
   * @param photoUrl Optional HD image URL (pbs.twimg.com)
   * @param pageId Facebook Page ID
   * @param pageAccessToken Page Access Token
   */
  public async postNews(
    caption: string,
    photoUrl: string | undefined,
    pageId: string,
    pageAccessToken: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    const cleanId = (pageId || '').replace(/^\uFEFF/, '').trim();
    const cleanToken = (pageAccessToken || '').replace(/^\uFEFF/, '').trim();

    if (!cleanId || !cleanToken) {
      return {
        success: false,
        error: 'Facebook Page ID or Access Token is missing',
      };
    }

    try {
      // 1. If photo is present (Base64 file upload from mobile/desktop or HTTP URL)
      if (photoUrl) {
        if (photoUrl.startsWith('data:image/')) {
          // Direct Base64 image upload via multipart/form-data
          const commaIdx = photoUrl.indexOf(',');
          const mimeMatch = photoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

          const base64Data = photoUrl.slice(commaIdx + 1);
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mimeType });

          const formData = new FormData();
          formData.append('source', blob, `photo.${ext}`);
          if (caption && caption.trim()) {
            formData.append('caption', caption.trim());
          }
          formData.append('access_token', cleanToken);

          const uploadUrl = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/photos`;
          const res = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });

          const data = (await res.json()) as any;
          if (!res.ok || data.error) {
            const errDetail = data.error?.message || `HTTP ${res.status}`;
            console.error('Facebook photo upload error:', data.error);
            return {
              success: false,
              error: `Facebook API photo error: ${errDetail}`,
            };
          }

          const postId = data.post_id || data.id;
          return {
            success: true,
            postId,
          };
        } else if (photoUrl.startsWith('http')) {
          // Remote Web URL (e.g. pbs.twimg.com)
          const url = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/photos`;
          const body = new URLSearchParams();
          body.append('url', photoUrl);
          if (caption && caption.trim()) {
            body.append('caption', caption.trim());
          }
          body.append('access_token', cleanToken);

          const res = await fetch(url, {
            method: 'POST',
            body,
          });

          const data = (await res.json()) as any;
          if (!res.ok || data.error) {
            const errDetail = data.error?.message || `HTTP ${res.status}`;
            console.error('Facebook photo post error:', data.error);
            return {
              success: false,
              error: `Facebook API photo error: ${errDetail}`,
            };
          }

          const postId = data.post_id || data.id;
          return {
            success: true,
            postId,
          };
        }
      }

      // 2. If no photo is present, fallback to pure status update: POST /{page-id}/feed
      const feedUrl = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/feed`;
      const body = new URLSearchParams();
      body.append('message', caption);
      body.append('access_token', cleanToken);

      const res = await fetch(feedUrl, {
        method: 'POST',
        body,
      });

      const data = (await res.json()) as any;

      if (!res.ok || data.error) {
        const errDetail = data.error?.message || `HTTP ${res.status}`;
        console.error('Facebook text post error:', data.error);
        return {
          success: false,
          error: `Facebook API feed error: ${errDetail}`,
        };
      }

      return {
        success: true,
        postId: data.id,
      };
    } catch (err: any) {
      console.error('Unexpected Facebook posting error:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

export const facebookPoster = new FacebookPoster();
