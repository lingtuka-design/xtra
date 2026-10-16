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

  // Handle local image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Thlalak hi 10MB aia lian a ni tur a ni lo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotoUrl(base64);
      setPhotoPreview(base64);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
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
    <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 sm:p-6 shadow-xl mb-6 backdrop-blur-sm">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            ✍️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100">
              Post Thar Siamna (Manual Post Creator)
            </h2>
            <p className="text-xs text-zinc-400">
              English news copy-paste la Gemini-in a letling ang, emaw Mizo-in type lut tawp rawh.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Source / Author Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Source / Hming (Optional):
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. Fabrizio Romano, David Ornstein, Sky Sports"
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Section 1: English News + Gemini Paraphraser */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/70 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>1. English News Copy-Paste Rawh (Optional):</span>
            </label>
            <button
              onClick={handleParaphrase}
              disabled={isTranslating || !englishText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-sm transition-all disabled:opacity-40"
              title="Letling and paraphrase with Gemini AI"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini-in a letling mek...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
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
            className="w-full bg-zinc-950 border border-zinc-800/90 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/70"
          />
        </div>

        {/* Section 2: Mizo Caption (Main Content) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <span>✏️</span>
              <span>2. Facebook Post Caption (Mizo ṭawng - A hnuaia mi hi a in-post tur a ni):</span>
            </label>
            <span className="text-[11px] text-zinc-500">
              {mizoCaption.length} characters
            </span>
          </div>
          <textarea
            value={mizoCaption}
            onChange={(e) => setMizoCaption(e.target.value)}
            rows={7}
            placeholder="Mizo caption hetah hian type lut rawh, emaw a chunga Gemini lehlin sa hi duh tawkin edit rawh..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-4 text-[15px] sm:text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 leading-relaxed font-normal min-h-[180px] resize-y shadow-inner"
          />
        </div>

        {/* Section 3: Image Upload or URL */}
        <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>3. Thlalak (Photo):</span>
            </label>
            <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setImageInputMode('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  imageInputMode === 'upload'
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
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
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
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
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl cursor-pointer bg-zinc-950/60 transition-colors"
              >
                <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                <span className="text-xs text-zinc-300 font-medium">
                  {photoPreview ? 'Thlalak thlak duh chuan click rawh' : 'Thlalak upload nan hetah hian click rawh'}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Photo Live Preview */}
          {photoPreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-zinc-800 max-h-56 bg-zinc-950 group">
              <img
                src={photoPreview}
                alt="Upload preview"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white transition-colors"
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 shadow-sm"
            title="Add to Facebook 15-minute drip queue"
          >
            {isQueueing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400" />
            )}
            <span>+ Add to FB Queue</span>
          </button>

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={isPublishing || isQueueing || !mizoCaption.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 shadow-md shadow-blue-500/20"
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
