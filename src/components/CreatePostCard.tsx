import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  PlusCircle, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Upload, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';
import { Post } from '../types';

interface CreatePostCardProps {
  onPostCreated: (newPost: Post) => void;
  onSwitchToQueue: () => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({
  onPostCreated,
  onSwitchToQueue,
}) => {
  const [englishText, setEnglishText] = useState('');
  const [mizoCaption, setMizoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('Xtra Breaking');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  const [isTranslating, setIsTranslating] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paraphrase English text to Mizo using Gemini AI
  const handleParaphrase = async () => {
    if (!englishText.trim()) {
      setErrorMessage('English news text copy-paste hmasa phawt rawh.');
      return;
    }

    setIsTranslating(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          englishText: englishText.trim(),
          authorName: authorName.trim() || 'Football News',
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gemini paraphrase a hlawhchham');
      }

      setMizoCaption(data.mizoText);
      setStatusMessage('✨ Gemini-in Mizo tawngin a paraphrase fel ta e! A hnuaiah hian i duh tawkin i edit thei ang.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gemini paraphrase laiin buaina a awm');
    } finally {
      setIsTranslating(false);
    }
  };

  // Optimize and compress image on client before sending to API
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawData = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawData);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with 0.88 quality (super fast, crystal-clear HD for Facebook)
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressed);
        };
        img.onerror = () => resolve(rawData);
        img.src = rawData;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle local image file upload (auto-compressed for mobile)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Thlalak hi 25MB aia lian a ni tur a ni lo.');
      return;
    }

    try {
      const base64 = await compressImage(file);
      setPhotoUrl(base64);
      setPhotoPreview(base64);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Thlalak chhiar theih a ni lo.');
    }
  };

  // Clear selected image
  const handleClearImage = () => {
    setPhotoUrl('');
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save to Queue (enters 15-minute drip queue and switches tab)
  const handleAddToQueue = async () => {
    if (!mizoCaption.trim()) {
      setErrorMessage('Facebook Caption (Mizo) hi chhut luh ngei ngei tur a ni.');
      return;
    }

    setIsQueueing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mizo_translation: mizoCaption.trim(),
          original_text: englishText.trim() || mizoCaption.trim(),
          primary_image_url: photoUrl || null,
          author_name: authorName.trim() || 'Xtra Editorial',
          facebook_status: 'queued',
          publish_now: false,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Queue-a dah a hlawhchham');
      }

      onPostCreated(data.post);
      // Reset form
      setEnglishText('');
      setMizoCaption('');
      handleClearImage();

      // Immediately switch to the FB Queue tab as requested
      onSwitchToQueue();
    } catch (err: any) {
      setErrorMessage(err.message || 'Queue-a dah laiin buaina a awm');
    } finally {
      setIsQueueing(false);
    }
  };

  // Publish Immediately to Facebook Page
  const handlePublishNow = async () => {
    if (!mizoCaption.trim()) {
      setErrorMessage('Facebook Caption (Mizo) hi chhut luh ngei ngei tur a ni.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mizo_translation: mizoCaption.trim(),
          original_text: englishText.trim() || mizoCaption.trim(),
          primary_image_url: photoUrl || null,
          author_name: authorName.trim() || 'Xtra Editorial',
          publish_now: true,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Facebook-a post a hlawhchham');
      }

      onPostCreated(data.post);
      setStatusMessage('🎉 Facebook Page-ah hlawhtling takin a in-post fel chiah e!');
      // Reset form
      setEnglishText('');
      setMizoCaption('');
      handleClearImage();
    } catch (err: any) {
      setErrorMessage(err.message || 'Facebook-a post laiin buaina a awm');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold">
            ✍️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Post Thar Siamna (Manual Post Creator)
            </h2>
            <p className="text-xs text-stone-500">
              English news copy-paste la Gemini-in a letling ang, emaw Mizo-in type lut tawp rawh.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Source / Author Name */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Source / Hming (Optional):
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. Fabrizio Romano, David Ornstein, Sky Sports"
            className="w-full bg-[#FCFAF6] focus:bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
          />
        </div>

        {/* Section 1: English News + Gemini Paraphraser */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>1. English News Copy-Paste Rawh (Optional):</span>
            </label>
            <button
              onClick={handleParaphrase}
              disabled={isTranslating || !englishText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-xs transition-all disabled:opacity-40"
              title="Letling and paraphrase with Gemini AI"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini-in a letling mek...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
                  <span>✨ Gemini-in Mizo-ah Letling Rawh</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={englishText}
            onChange={(e) => setEnglishText(e.target.value)}
            rows={3}
            placeholder="Copy and paste English football tweet or article here..."
            className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Section 2: Mizo Caption (Main Content) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <span>✏️</span>
              <span>2. Facebook Post Caption (Mizo ṭawng - A hnuaia mi hi a in-post tur a ni):</span>
            </label>
            <span className="text-[11px] text-stone-500">
              {mizoCaption.length} characters
            </span>
          </div>
          <textarea
            value={mizoCaption}
            onChange={(e) => setMizoCaption(e.target.value)}
            rows={7}
            placeholder="Mizo caption hetah hian type lut rawh, emaw a chunga Gemini lehlin sa hi duh tawkin edit rawh..."
            className="w-full bg-[#FCFAF6] focus:bg-white border border-stone-300 rounded-xl p-4 text-[15px] sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 leading-relaxed font-normal min-h-[180px] resize-y shadow-xs"
          />
        </div>

        {/* Section 3: Image Upload or URL */}
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
              <span>3. Thlalak (Photo):</span>
            </label>
            <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg border border-stone-300 text-xs">
              <button
                type="button"
                onClick={() => setImageInputMode('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  imageInputMode === 'upload'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="w-3 h-3 inline mr-1" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('url')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  imageInputMode === 'url'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LinkIcon className="w-3 h-3 inline mr-1" />
                Image URL
              </button>
            </div>
          </div>

          {imageInputMode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="photo-file-input"
              />
              <label
                htmlFor="photo-file-input"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl cursor-pointer bg-white transition-colors"
              >
                <Upload className="w-5 h-5 text-stone-500 mb-1" />
                <span className="text-xs text-stone-800 font-medium">
                  {photoPreview ? 'Thlalak thlak duh chuan click rawh' : 'Thlalak upload nan hetah hian click rawh'}
                </span>
                <span className="text-[11px] text-stone-500 mt-0.5">
                  PNG, JPG, WEBP (up to 10MB)
                </span>
              </label>
            </div>
          ) : (
            <div>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value);
                  setPhotoPreview(e.target.value);
                }}
                placeholder="https://pbs.twimg.com/media/...jpg"
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Photo Live Preview */}
          {photoPreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-stone-300 max-h-56 bg-stone-100 group">
              <img
                src={photoPreview}
                alt="Upload preview"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/80 hover:bg-red-600 text-white transition-colors"
                title="Paih rawh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
          <button
            type="button"
            onClick={handleAddToQueue}
            disabled={isQueueing || isPublishing || !mizoCaption.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 shadow-xs"
            title="Add to Facebook 15-minute drip queue"
          >
            {isQueueing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clock className="w-4 h-4 text-amber-700" />
            )}
            <span>+ Add to FB Queue</span>
          </button>

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={isPublishing || isQueueing || !mizoCaption.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 shadow-xs"
            title="Publish immediately to Facebook Page"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Facebook-ah a post mek...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Post to FB Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
