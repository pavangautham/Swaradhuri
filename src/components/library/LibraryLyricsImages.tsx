"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LibraryLyricsImages({ itemId }: { itemId: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/library/${itemId}/lyrics-image`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.urls?.length) setUrls(data.urls); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading || urls.length === 0) return null;
  return (
    <>
      <div className="flex flex-col gap-3">
        {urls.map((u, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50/50 p-2 shadow-inner">
            <button
              onClick={() => setPreviewUrl(u)}
              className="relative block w-full focus:outline-none"
            >
              <img 
                src={u} 
                alt={`Page ${i + 1}`} 
                className="w-full rounded-lg object-contain transition-transform duration-300 group-hover:scale-[1.01]" 
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
                <ZoomIn className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
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
