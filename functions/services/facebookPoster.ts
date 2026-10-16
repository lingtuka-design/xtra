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
      // 1. If photo is present, use POST /{page-id}/photos for native full-size photo post
      if (photoUrl && photoUrl.startsWith('http')) {
        const url = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/photos`;

        const body = new URLSearchParams();
        body.append('url', photoUrl);
        body.append('caption', caption);
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
