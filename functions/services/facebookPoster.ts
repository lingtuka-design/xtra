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
          // If the photo is a dynamic screenshot / graphic (e.g. image.thum.io or card endpoint):
          // NEVER hand the raw URL to Facebook crawler because Facebook scrapes too fast and catches the initial blank white canvas!
          // Instead, fetch and verify the full rendered image bytes first, then upload directly as binary source.
          const isDynamicGraphic = photoUrl.includes('image.thum.io') || photoUrl.includes('/api/live/card');
          let directBlob: Blob | null = null;

          if (isDynamicGraphic) {
            try {
              let imgRes = await fetch(photoUrl);
              if (imgRes.ok) {
                let blob = await imgRes.blob();
                // A valid rendered graphic card is 100KB-400KB. A blank white canvas or placeholder is typically < 15KB.
                if (blob.size < 15000) {
                  // Wait 2.2 seconds for headless Chrome to finish painting and retry
                  await new Promise((r) => setTimeout(r, 2200));
                  imgRes = await fetch(photoUrl);
                  if (imgRes.ok) {
                    const retryBlob = await imgRes.blob();
                    if (retryBlob.size > blob.size) {
                      blob = retryBlob;
                    }
                  }
                }
                if (blob.size > 15000) {
                  directBlob = blob;
                }
              }
            } catch (fetchErr: any) {
              console.warn('[Facebook Poster] Direct graphic fetch failed, falling back to URL:', fetchErr.message);
            }
          }

          if (directBlob) {
            const formData = new FormData();
            formData.append('source', directBlob, 'graphic.png');
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
            if (res.ok && !data.error) {
              const postId = data.post_id || data.id;
              return {
                success: true,
                postId,
              };
            }
            console.warn('[Facebook Poster] Direct blob upload returned error, falling back to URL:', data.error);
          }

          // Remote Web URL fallback (e.g. pbs.twimg.com press photo)
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
            console.warn(`[Facebook Poster] Photo upload failed (${errDetail}). Falling back to text feed post...`);

            // Fallback: post caption as a standard feed post so the post is never lost
            const feedUrl = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/feed`;
            const feedBody = new URLSearchParams();
            feedBody.append('message', caption);
            feedBody.append('access_token', cleanToken);

            const feedRes = await fetch(feedUrl, {
              method: 'POST',
              body: feedBody,
            });

            const feedData = (await feedRes.json()) as any;
            if (feedRes.ok && !feedData.error) {
              console.log('[Facebook Poster] Fallback feed post published successfully!');
              return {
                success: true,
                postId: feedData.id,
              };
            }

            return {
              success: false,
              error: `Facebook API photo error: ${errDetail}; Feed fallback: ${feedData.error?.message || feedRes.statusText}`,
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
