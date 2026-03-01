"use client";

import { useEffect, useState } from "react";
import { ImageIcon, X, ZoomIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function LyricsImages({ lessonId }: { lessonId: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    
    fetch(`/api/lessons/${lessonId}/lyrics-image`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to fetch images (Status: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          if (data?.urls?.length) {
            setUrls(data.urls);
          } else {
            setUrls([]);
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Error loading lyrics images:", err);
          setError(err.message || "Failed to load images");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [lessonId, retryCount]);

  if (loading) {
    return (
      <div className="mb-4 space-y-4 px-3 py-2">
        <Skeleton className="h-4 w-32 rounded-full opacity-50" />
        <Skeleton className="h-64 w-full rounded-2xl opacity-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ImageIcon className="size-6 opacity-50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-stone-800">Images couldn&apos;t be loaded</p>
          <p className="text-xs text-stone-500 max-w-[200px] mx-auto leading-relaxed">{error}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setRetryCount(prev => prev + 1)}
          className="h-9 rounded-xl border-stone-200 text-[10px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-50"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (urls.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-4 overflow-hidden px-3 pb-4 pt-2">
        {urls.map((url, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-stone-50 bg-stone-50/30 px-4 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-stone-400">Page {i + 1}</p>
              <button 
                onClick={() => setPreviewUrl(url)}
                className="rounded-lg p-1 text-stone-300 hover:bg-stone-100 hover:text-teal-600 transition-colors"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>
            <button
              onClick={() => setPreviewUrl(url)}
              className="relative block w-full overflow-hidden bg-stone-50/20 focus:outline-none"
            >
              <img
                src={url}
                alt={`Lyrics page ${i + 1}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'flex flex-col items-center justify-center py-12 px-6 text-center gap-2';
                    errorMsg.innerHTML = `
                      <div class="text-stone-300"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off"><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.82-2.82"/><line x1="14.5" y1="21" x2="16" y2="21"/><path d="M14.5 21H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v2"/><path d="m2 16 4.5-4.5 2.3 2.3"/><path d="m15 21-3.5-3.5"/><path d="m10 10 2.2-2.2L15 11l5.1-5.1a1 1 0 0 1 1.4 0l1.5 1.5"/><circle cx="7.5" cy="7.5" r="1.5"/></svg></div>
                      <p class="text-xs font-bold text-stone-400">Failed to load this page</p>
                    `;
                    parent.appendChild(errorMsg);
                  }
                }}
                className="w-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-teal-900/0 transition-all duration-300 group-hover:bg-teal-900/5">
                <div className="translate-y-4 rounded-full bg-white/90 p-3 shadow-xl opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ZoomIn className="size-6 text-teal-600" />
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Full-screen Preview Overlay */}
      {previewUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all animate-in fade-in duration-200"
          onClick={() => setPreviewUrl(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-[110] h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95"
            onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }}
          >
            <X className="size-6" />
          </Button>
          
          <div className="relative h-full w-full p-4 sm:p-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full w-full items-center justify-center overflow-auto">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-300"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
