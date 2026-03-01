"use client";

import { useEffect, useState } from "react";
import { AudioPlayer } from "@/components/audio-player";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LibraryAudioPlayer({ itemId }: { itemId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setUrl(null);
    
    fetch(`/api/library/${itemId}/audio`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to fetch audio (Status: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          if (data.url) setUrl(data.url);
          else setError("Audio file not found");
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Error loading library audio:", err);
          setError(err.message || "Failed to load audio");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [itemId, retryCount]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-full opacity-50" />
        <Skeleton className="h-12 w-full rounded-xl opacity-30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/30 px-4 py-3 text-red-600">
        <AlertCircle className="size-4 shrink-0" />
        <p className="flex-1 text-[10px] font-bold uppercase tracking-widest">{error}</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setRetryCount(prev => prev + 1)}
          className="h-7 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest hover:bg-red-50"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!url) return null;
  return <AudioPlayer audioUrl={url} />;
}
