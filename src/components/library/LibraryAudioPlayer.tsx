"use client";

import { useEffect, useState } from "react";
import { AudioPlayer } from "@/components/audio-player";

export function LibraryAudioPlayer({ itemId }: { itemId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/library/${itemId}/audio`)
      .then((res) => res.json())
      .then((data) => { if (data.url) setUrl(data.url); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [itemId]);

  if (!loaded || !url) return null;
  return <AudioPlayer audioUrl={url} />;
}
