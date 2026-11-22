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
          // Dynamic screenshot / graphic (e.g. image.thum.io or card endpoint)
          const isDynamicGraphic = photoUrl.includes('image.thum.io') || photoUrl.includes('/api/live/card');
          const isLineupCard = photoUrl.includes('type=lineup') || photoUrl.includes('status=LINEUP');
          const isGoalCard = photoUrl.includes('type=goal') || photoUrl.includes('status=GOAL');
          // For Goal cards: blank canvas is ~5KB, full graphic is >300KB (threshold: 60KB).
          // For Lineup cards: legitimate card design is clean white with text columns (size 65KB-105KB, threshold: 30KB).
          // For Score / Result cards: typical size is 180KB-320KB, blank canvas is ~5KB (threshold: 40KB).
          const minSizeRequired = isGoalCard ? 60000 : (isLineupCard ? 30000 : 40000);
          let directBlob: Blob | null = null;

          if (isDynamicGraphic) {
            try {
              let imgRes = await fetch(photoUrl);
              if (imgRes.ok) {
                let blob = await imgRes.blob();
                let attempts = 0;
                while (blob.size < minSizeRequired && attempts < 5) {
                  attempts++;
                  await new Promise((r) => setTimeout(r, 2000));
                  try {
                    imgRes = await fetch(photoUrl);
                    if (imgRes.ok) {
                      const nextBlob = await imgRes.blob();
                      if (nextBlob.size >= minSizeRequired) {
                        blob = nextBlob;
                        break;
                      } else if (nextBlob.size > blob.size) {
                        blob = nextBlob;
                      }
                    }
                  } catch {}
                }
                if (blob.size >= minSizeRequired) {
                  directBlob = blob;
                }
              }
            } catch (fetchErr: any) {
              console.warn('[Facebook Poster] Direct graphic fetch failed:', fetchErr.message);
            }
          }

          // Method A: Direct binary blob upload (highest reliability for dynamic cards)
          if (directBlob) {
            const formData = new FormData();
            formData.append('source', directBlob, 'card.png');
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
            console.warn('[Facebook Poster] Direct blob upload failed, falling back to url upload:', data.error);
          }

          // Method B: Standard Remote Web Photo upload via URL (for Twitter/press photos or URL fallback)
          const photoUrlEndpoint = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/photos`;
          const body = new URLSearchParams();
          body.append('url', photoUrl);
          if (caption && caption.trim()) {
            body.append('caption', caption.trim());
          }
          body.append('access_token', cleanToken);

          let res = await fetch(photoUrlEndpoint, {
            method: 'POST',
            body,
          });

          let data = (await res.json()) as any;
          if (res.ok && !data.error) {
            const postId = data.post_id || data.id;
            return {
              success: true,
              postId,
            };
          }

          // Retry once on /photos before reporting error (strictly avoid degrading to text-only feed post)
          console.warn('[Facebook Poster] Photo upload via url failed, retrying once...', data.error);
          await new Promise((r) => setTimeout(r, 2000));
          res = await fetch(photoUrlEndpoint, { method: 'POST', body });
          data = (await res.json()) as any;
          if (res.ok && !data.error) {
            const postId = data.post_id || data.id;
            return {
              success: true,
              postId,
            };
          }

          const errDetail = data.error?.message || `HTTP ${res.status}`;
          console.error('[Facebook Poster] All photo upload attempts failed:', errDetail);
          return {
            success: false,
            error: `Facebook API photo error: ${errDetail}`,
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
