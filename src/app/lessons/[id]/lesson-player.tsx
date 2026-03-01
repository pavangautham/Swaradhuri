"use client";

import { useEffect, useState } from "react";
import { Loader2, Music } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";
import { Button } from "@/components/ui/button";

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoaded(false);
    setError(null);

    fetch(`/api/lessons/${lessonId}/audio`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load audio (Status: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (mounted && data.url) setAudioUrl(data.url);
      })
      .catch((err) => {
        if (mounted) {
          console.error("Audio loading error:", err);
          setError(err.message || "Failed to load audio");
        }
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => { mounted = false; };
  }, [lessonId, retryCount]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] border border-stone-100 bg-white/90 p-8 shadow-xl shadow-stone-200/40 ring-1 ring-stone-100/50">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <Loader2 className="absolute size-10 animate-spin text-teal-600/20" />
          <Music className="size-5 text-teal-600" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Fetching audio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-red-100 bg-red-50/20 p-8 text-center shadow-inner">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Music className="size-6 opacity-50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-stone-800">Audio couldn&apos;t be loaded</p>
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

  if (!audioUrl) return null;

  return <AudioPlayer audioUrl={audioUrl} />;
}
